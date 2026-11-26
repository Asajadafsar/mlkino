"""Create two private demo files for the explicitly provisioned demo expert."""
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from accounts.models import AgencyExpert, User
from panel.models import AgencyExpertLink, PropertyRecord
from panel.workflow_services import touch_contact


class Command(BaseCommand):
    help = 'Create two draft files for demo expert 09000901811 without re-creating existing samples.'

    @transaction.atomic
    def handle(self, *args, **options):
        expert = User.objects.select_for_update().filter(
            phone='09000901811', role='expert', is_active=True,
            expert_profile__job_title='کارشناس آزمایشی',
        ).first()
        if not expert:
            raise CommandError('The explicitly provisioned demo expert was not found.')
        membership = AgencyExpert.objects.filter(
            expert=expert, is_active=True, agency__phone='09000901810', agency__role='agency',
            agency__agency_profile__agency_name='املاک آزمایشی',
        ).select_related('agency').first()
        if not membership or not AgencyExpertLink.objects.filter(expert=expert, agency=membership.agency).exists():
            raise CommandError('The demo expert is not linked to the expected demo office.')

        examples = [
            ('apartment', 'آپارتمان', 95, 5_600_000_000, {'roomCount': 2, 'totalFloor': 4, 'floor': 2}),
            ('garden', 'باغ ویلا', 480, 9_200_000_000, {
                'roomCount': 3, 'totalFloor': 2,
                'technical': {'landArea': 480, 'buildingArea': 120, 'pool': True,
                              'utilities': ['آب', 'برق'], 'waterHours': 2, 'waterMinutes': 30},
            }),
        ]
        for index, (key, kind, area, price, details) in enumerate(examples, 1):
            marker = f'expert-demo-file-v1-{key}'
            record, created = PropertyRecord.objects.get_or_create(
                kind='file', created_by=expert, data__demo_key=marker,
                defaults={
                    'assigned_expert': expert, 'office': membership.agency, 'publication_state': 'draft',
                    'data': {
                        'demo_key': marker, 'title': f'{kind} آزمایشی', 'propertyType': kind,
                        'contractType': 'فروش', 'city': 'قم', 'province': 'قم',
                        'address': f'نشانی غیرواقعی آزمایشی {index}', 'ownerName': f'مالک آزمایشی {index}',
                        'ownerPhone': f'0900090182{index}', 'area': area, 'totalPrice': price,
                        'documentType': 'تک برگ', 'publicationStatus': 'draft', 'allowOnlineChat': True,
                        'description': 'این فایل آزمایشی است و برای معامله واقعی نیست.', **details,
                    },
                },
            )
            if created:
                touch_contact(record, expert)
            self.stdout.write(f'{record.pk}: {record.data["title"]} ({"created" if created else "already exists"})')
