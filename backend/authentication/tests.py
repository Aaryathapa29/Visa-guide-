from django.test import TestCase


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
