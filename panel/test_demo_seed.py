"""The only local seed execution is inside Django's disposable test transaction."""
from io import StringIO
from tempfile import TemporaryDirectory
from types import SimpleNamespace
from unittest.mock import patch
from decimal import Decimal
import json
from django.core.management import call_command,CommandError
from django.test import SimpleTestCase,TestCase,override_settings
from accounts.models import User
from panel.models import PropertyRecord
from panel.workflow_models import FinancialDocument,PropertyReferral
from panel.management.commands.seed_demo import require_demo_environment

class DemoSeedGuardTests(SimpleTestCase):
    def test_production_and_partial_flags_are_refused(self):
        for name,env,allowed in [('mlkino',True,True),('mlkino_demo',False,True),('mlkino_demo',True,False)]:
            fake=SimpleNamespace(DATABASES={'default':{'NAME':name}},MLKINO_DEMO_ENV=env,MLKINO_DEMO_SEED_ALLOWED=allowed)
            with patch('panel.management.commands.seed_demo.settings',fake),self.assertRaises(CommandError):require_demo_environment()
    def test_guarded_dry_run_does_not_write_or_query_database(self):
        fake=SimpleNamespace(DATABASES={'default':{'NAME':'mlkino_demo'}},MLKINO_DEMO_ENV=True,MLKINO_DEMO_SEED_ALLOWED=True)
        out=StringIO()
        with patch('panel.management.commands.seed_demo.settings',fake):call_command('seed_demo',dry_run=True,stdout=out)
        self.assertEqual(json.loads(out.getvalue())['writes'],0)
    def test_database_router_is_refused_before_any_queries(self):
        fake=SimpleNamespace(DATABASES={'default':{'NAME':'mlkino_demo'}},MLKINO_DEMO_ENV=True,MLKINO_DEMO_SEED_ALLOWED=True,DATABASE_ROUTERS=['custom.Router'])
        with patch('panel.management.commands.seed_demo.settings',fake),self.assertRaises(CommandError):require_demo_environment()
    def test_no_force_bypass_option_exists(self):
        with self.assertRaises(CommandError):call_command('seed_demo','--force')

class DemoSeedFactoryTests(TestCase):
    def setUp(self):
        folder=TemporaryDirectory();self.addCleanup(folder.cleanup)
        media=override_settings(MEDIA_ROOT=folder.name);media.enable();self.addCleanup(media.disable)
    def run_fixture(self):
        out=StringIO()
        # This mock applies only to Django's isolated test database. The command
        # itself has no force/bypass switch and is never run on local business DB.
        with patch('panel.management.commands.seed_demo.require_demo_environment'),patch('panel.management.commands.seed_demo.verify_demo_connection'):
            call_command('seed_demo',profile='small',stdout=out)
        return json.loads(out.getvalue())
    def test_seed_is_idempotent_balanced_and_uses_requested_demo_password(self):
        first=self.run_fixture();counts=(User.objects.count(),PropertyRecord.objects.count(),FinancialDocument.objects.count(),PropertyReferral.objects.count())
        second=self.run_fixture()
        self.assertEqual(counts,(User.objects.count(),PropertyRecord.objects.count(),FinancialDocument.objects.count(),PropertyReferral.objects.count()))
        self.assertEqual(first['counts'],second['counts'])
        for user in User.objects.all():
            self.assertTrue(user.check_password('123456789'));self.assertFalse(user.national_code_verified)
        for doc in FinancialDocument.objects.all():
            debit=sum(Decimal(x['debit']) for x in doc.entries);credit=sum(Decimal(x['credit']) for x in doc.entries)
            self.assertEqual(debit,credit);self.assertEqual(debit,doc.amount)
        self.assertNotIn('password',first)
    def test_non_namespace_phone_collision_never_overwrites_existing_record(self):
        original=User.objects.create_user('09000100001','original-password',email='unrelated@example.invalid')
        with self.assertRaises(CommandError):self.run_fixture()
        original.refresh_from_db();self.assertEqual(original.role,'user');self.assertTrue(original.check_password('original-password'))
        self.assertEqual(User.objects.count(),1)

    def test_full_profile_covers_geography_staff_ranges_and_referral_outcomes(self):
        from panel.models import AgencyExpertLink
        out=StringIO()
        with patch('panel.management.commands.seed_demo.require_demo_environment'),patch('panel.management.commands.seed_demo.verify_demo_connection'):
            call_command('seed_demo',profile='full',stdout=out)
        result=json.loads(out.getvalue())
        self.assertEqual(result['counts']['properties'],40)
        self.assertEqual(len(set(PropertyRecord.objects.values_list('data__province',flat=True))),5)
        self.assertTrue({'accepted','pending','rejected','expired','market'}<=set(PropertyReferral.objects.values_list('status',flat=True)))
        staff=[AgencyExpertLink.objects.filter(agency=u).count() for u in User.objects.filter(role='agency')]
        self.assertTrue({0,3,4,5}<=set(staff))
        self.assertTrue(FinancialDocument.objects.filter(kind='reversal',status='posted').exists())
