from django.test import TestCase
from rest_framework.test import APIClient
from accounts.models import User
from accounts.plan_catalog import initial_catalog
from panel.settings_models import PanelSettings


class PlanCatalogTests(TestCase):
    def test_admin_price_update_is_used_for_new_application_and_keeps_existing_quote(self):
        admin = User.objects.create_user(phone='09127770001', role='superadmin')
        office = User.objects.create_user(phone='09127770002', role='agency')
        client = APIClient()
        client.force_authenticate(admin)
        plan = initial_catalog()['plans'][1]
        plan['monthly_price'] = 450000
        response = client.patch('/accounts/plans/2/', plan, format='json')
        self.assertEqual(response.status_code, 200, response.data)
        client.force_authenticate(office)
        self.assertEqual(client.patch('/accounts/plans/2/', plan, format='json').status_code, 403)
        options = client.get('/accounts/role-applications/').data
        self.assertEqual(next(row for row in options['plans'] if row['id'] == 'pro')['price'], 450000)
        quote = client.post('/accounts/role-applications/', {'kind':'upgrade','tier':'pro','accept_terms':True}, format='json')
        self.assertEqual(quote.status_code, 201, quote.data)
        self.assertEqual(quote.data['details']['monthly_price'], 450000)
        client.force_authenticate(admin)
        plan['monthly_price'] = 500000
        client.patch('/accounts/plans/2/', plan, format='json')
        from accounts.models import RoleApplication
        self.assertEqual(RoleApplication.objects.get(pk=quote.data['id']).details['monthly_price'], 450000)
        self.assertTrue(PanelSettings.objects.get(pk=1).data['plan_catalog'])
