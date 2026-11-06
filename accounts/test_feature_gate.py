from unittest.mock import patch
from django.http import HttpResponse
from django.test import RequestFactory,SimpleTestCase
from .middleware import FeatureAccessMiddleware

class FeatureAccessTests(SimpleTestCase):
    def run_request(self,path,features,method='get'):
        request=getattr(RequestFactory(),method)(path)
        with patch('panel.settings_runtime.system_settings',return_value={'features':features}):
            return FeatureAccessMiddleware(lambda r:HttpResponse('view reached'))(request)
    def test_disabled_legacy_modules_block_all_methods_and_object_subroutes(self):
        pairs=[('files','/panel/files/7/'),('requests','/panel/requests/'),('chats','/panel/chats/4/messages/'),
               ('users','/panel/users/2/role/'),('contracts','/panel/contracts/1/'),('logs','/panel/activity-logs/'),
               ('tasks','/panel/dashboard/tasks/2/toggle/'),('follow-ups','/panel/follow-ups/2/'),('tickets','/panel/tickets/2/replies/')]
        for feature,path in pairs:
            for method in ('get','post','patch','delete'):
                response=self.run_request(path,{feature:False},method)
                self.assertEqual(response.status_code,403,(feature,path,method));self.assertEqual(response['Cache-Control'],'no-store')
    def test_exact_path_matching_preserves_unrelated_routes(self):
        for path in ('/panel/files-archive/','/panel/my-files/','/panel/public/catalog/','/accounts/session/','/accounts/login/password/'):
            self.assertEqual(self.run_request(path,{'files':False,'workflows':False},'post').status_code,200)
    def test_settings_appearance_geography_and_auth_recovery_remain_reachable(self):
        flags={x:False for x in ['users','profile','dashboard','workflows','files','requests','chats']}
        for path in ('/panel/settings/','/panel/appearance/','/panel/locations/','/panel/locations/manage/',
                     '/panel/impersonation/exit/','/accounts/token/refresh/','/accounts/logout/'):
            self.assertEqual(self.run_request(path,flags,'post').status_code,200)
        self.assertEqual(self.run_request('/accounts/profile/',flags).status_code,200)
        self.assertEqual(self.run_request('/accounts/profile/',flags,'patch').status_code,403)
    def test_workflow_parent_and_specific_flags_enforce_api_access(self):
        for feature,path in [('workflows','/panel/workflows/favorites/'),('favorites','/panel/workflows/favorites/2/'),
          ('crm','/panel/workflows/contacts/3/'),('assignments','/panel/workflows/assignments/2/respond/'),
          ('finance','/panel/workflows/finance/1/receipt/'),('finance','/panel/workflows/financial-settings/'),
          ('finance','/panel/workflows/ledger/'),('visits','/panel/workflows/visits/2/'),
          ('visit-slots','/panel/workflows/visit-slots/'),('chats','/panel/workflows/properties/2/chat/'),
          ('archives','/panel/workflows/archive/'),('workspace-roles','/panel/workflows/roles/')]:
            self.assertEqual(self.run_request(path,{feature:False},'post').status_code,403,(feature,path))
    def test_only_literal_false_disables_and_preflight_does_not_override_auth(self):
        for value in (None,0,'false',True):
            self.assertEqual(self.run_request('/panel/files/',{'files':value}).status_code,200)
        self.assertEqual(self.run_request('/panel/files/',{'files':False},'options').status_code,200)
    def test_explicit_subcategory_filters_honor_their_own_flags(self):
        for path,feature in [('/panel/users/?role=expert','users/expert'),('/panel/requests/?requesterType=owner','owners-requests'),
                             ('/panel/workflows/contacts/?kind=owner','owners'),('/panel/workflows/contacts/?kind=tenant','landlordTenant')]:
            self.assertEqual(self.run_request(path,{feature:False}).status_code,403)
