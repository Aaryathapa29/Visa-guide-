from django.test import TestCase
from rest_framework.test import APIClient

from .models import User


class HomePageTests(TestCase):
    def test_home_returns_success_payload(self):
        response = self.client.get('/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['status'], 'ok')
        self.assertEqual(response.json()['message'], 'Visa Guide API is running')

    def test_docs_page_is_available(self):
        response = self.client.get('/docs')

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Visa Guide API Docs')

    def test_orders_endpoint_is_available(self):
        response = self.client.get('/orders')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['status'], 'ok')
        self.assertEqual(response.json()['message'], 'Orders endpoint is available')


class AccountSettingsTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='aspirant-user',
            email='aspirant@example.com',
            password='old-password',
            role='student',
            first_name='Aspirant Name',
        )

    def test_password_update_requires_current_password(self):
        self.client.force_authenticate(self.user)

        response = self.client.patch('/api/auth/update-profile/', {'password': 'new-password'}, format='json')

        self.assertEqual(response.status_code, 400)
        self.assertIn('Current password is required', response.json()['detail'])

    def test_password_update_with_current_password(self):
        self.client.force_authenticate(self.user)

        response = self.client.patch(
            '/api/auth/update-profile/',
            {'current_password': 'old-password', 'password': 'new-password'},
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('new-password'))

    def test_delete_account_marks_user_inactive(self):
        self.client.force_authenticate(self.user)

        response = self.client.delete('/api/auth/delete-account/')

        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.assertFalse(self.user.is_active)
