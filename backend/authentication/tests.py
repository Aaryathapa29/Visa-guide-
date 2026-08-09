import shutil
import tempfile

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from .models import Notification, User


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

    def test_delete_account_removes_user_from_database(self):
        self.client.force_authenticate(self.user)

        response = self.client.delete('/api/auth/delete-account/')

        self.assertEqual(response.status_code, 200)
        self.assertFalse(User.objects.filter(pk=self.user.id).exists())


class ConsultancyProfilePictureTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.media_root = tempfile.mkdtemp(prefix='visa-guide-media-')
        self.consultancy = User.objects.create_user(
            username='consultancy-upload',
            email='consultancy-upload@example.com',
            password='StrongPass123',
            role='consultancy',
            office_name='Bright Visa',
            is_verified=True,
        )

    def tearDown(self):
        shutil.rmtree(self.media_root, ignore_errors=True)

    def test_consultancy_can_upload_profile_picture(self):
        self.client.force_authenticate(self.consultancy)
        uploaded_file = SimpleUploadedFile('logo.png', b'fake-image-bytes', content_type='image/png')

        with override_settings(MEDIA_ROOT=self.media_root):
            response = self.client.put(
                '/api/consultancy/profile-picture/',
                {'logo': uploaded_file},
                format='multipart',
            )

        self.assertEqual(response.status_code, 200)
        self.consultancy.refresh_from_db()
        self.assertTrue(self.consultancy.logo_url)
        self.assertIn('/media/consultancy-logos/', response.json()['logo_url'])

    def test_profile_picture_requires_file(self):
        self.client.force_authenticate(self.consultancy)
        response = self.client.put('/api/consultancy/profile-picture/', {}, format='multipart')

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json().get('message'), 'No file provided')

    def test_consultancy_can_remove_profile_picture(self):
        self.client.force_authenticate(self.consultancy)
        uploaded_file = SimpleUploadedFile('logo.png', b'fake-image-bytes', content_type='image/png')

        with override_settings(MEDIA_ROOT=self.media_root):
            upload_response = self.client.put(
                '/api/consultancy/profile-picture/',
                {'logo': uploaded_file},
                format='multipart',
            )
            self.assertEqual(upload_response.status_code, 200)

            delete_response = self.client.delete('/api/consultancy/profile-picture/')

        self.assertEqual(delete_response.status_code, 200)
        self.consultancy.refresh_from_db()
        self.assertFalse(self.consultancy.logo_url)
        self.assertEqual(delete_response.json().get('logo_url'), None)


class BookingApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.aspirant = User.objects.create_user(
            username='aspirant-booker',
            email='aspirant-booker@example.com',
            password='StrongPass123',
            role='student',
            first_name='Aspirant Booker',
        )
        self.consultancy = User.objects.create_user(
            username='bright-visa',
            email='bright-visa@example.com',
            password='StrongPass123',
            role='consultancy',
            office_name='Bright Visa',
            is_verified=True,
        )

    def test_create_booking_for_consultancy(self):
        self.client.force_authenticate(self.aspirant)

        response = self.client.post(
            '/api/auth/bookings/',
            {
                'consultancy_id': self.consultancy.id,
                'appointment_date': '2026-08-20',
                'appointment_time': '10:00 AM',
                'notes': 'Need guidance on student visa process.',
            },
            format='json',
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()['status'], 'pending')
        self.assertEqual(response.json()['aspirant_id'], self.aspirant.id)
        self.assertEqual(response.json()['consultancy_id'], self.consultancy.id)

    def test_consultancy_can_confirm_booking(self):
        self.client.force_authenticate(self.aspirant)
        create_response = self.client.post(
            '/api/auth/bookings/',
            {
                'consultancy_id': self.consultancy.id,
                'appointment_date': '2026-08-20',
                'appointment_time': '10:00 AM',
            },
            format='json',
        )
        booking_id = create_response.json()['id']

        self.client.force_authenticate(self.consultancy)
        response = self.client.patch(
            f'/api/auth/bookings/{booking_id}/',
            {'status': 'confirmed', 'assigned_time': '11:00 AM'},
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['status'], 'confirmed')
        self.assertEqual(response.json()['assigned_time'], '11:00 AM')

    def test_booking_update_returns_booking_date_and_time(self):
        self.client.force_authenticate(self.aspirant)
        create_response = self.client.post(
            '/api/auth/bookings/',
            {
                'consultancy_id': self.consultancy.id,
                'appointment_date': '2026-08-20',
                'appointment_time': '10:00 AM',
            },
            format='json',
        )
        booking_id = create_response.json()['id']

        self.client.force_authenticate(self.consultancy)
        response = self.client.patch(
            f'/api/auth/bookings/{booking_id}/update/',
            {'appointment_date': '2026-08-21', 'appointment_time': '02:30 PM'},
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['booking_date'], '2026-08-21')
        self.assertEqual(response.json()['booking_time'], '02:30 PM')

    def test_confirmed_booking_creates_aspirant_notification(self):
        self.client.force_authenticate(self.aspirant)
        create_response = self.client.post(
            '/api/auth/bookings/',
            {
                'consultancy_id': self.consultancy.id,
                'appointment_date': '2026-08-20',
                'appointment_time': '10:00 AM',
            },
            format='json',
        )
        booking_id = create_response.json()['id']

        self.client.force_authenticate(self.consultancy)
        response = self.client.patch(
            f'/api/auth/bookings/{booking_id}/',
            {'status': 'confirmed', 'assigned_time': '11:00 AM'},
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(Notification.objects.filter(user=self.aspirant, is_read=False).exists())
        notification = Notification.objects.filter(user=self.aspirant).latest('created_at')
        self.assertIn('confirmed', notification.title.lower())
        self.assertIn('booking', notification.message.lower())
