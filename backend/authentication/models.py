# from django.contrib.auth.models import AbstractUser
# from django.db import models

# class User(AbstractUser):
#     ROLE_CHOICES = (
#         ('student', 'Student'),
#         ('consultancy', 'Consultancy'),
#     )
#     role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='student')
    
#     # You can add global fields here later (e.g., phone_number = models.CharField(...))

#     def __str__(self):
#         return f"{self.username} ({self.role})"

from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = (
        ('student', 'Student'),
        ('consultancy', 'Consultancy'),
    )
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='student')
    
    # Verification Step Fields
    is_verified = models.BooleanField(default=False) 
    license_number = models.CharField(max_length=50, blank=True, null=True)
    office_name = models.CharField(max_length=255, blank=True, null=True)
    logo_url = models.TextField(blank=True, null=True)


class Notification(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
    )
    title = models.CharField(max_length=200, default='Notification')
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.username}: {self.title}'


class ConsultancyNotification(models.Model):
    consultancy = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='consultancy_notifications',
    )
    aspirant_name = models.CharField(max_length=150)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.aspirant_name} -> {self.consultancy.username}'


class Expert(models.Model):
    consultancy = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='experts',
    )
    name = models.CharField(max_length=150)
    specialization = models.CharField(max_length=150, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        constraints = [
            models.UniqueConstraint(fields=['consultancy', 'name'], name='unique_consultancy_expert_name'),
        ]

    def __str__(self):
        return f'{self.name} ({self.specialization})'


class Booking(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('rejected', 'Rejected'),
    )

    aspirant = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='bookings_as_aspirant',
    )
    consultancy = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='bookings_as_consultancy',
    )
    expert = models.ForeignKey(
        Expert,
        on_delete=models.SET_NULL,
        related_name='bookings',
        null=True,
        blank=True,
    )
    appointment_date = models.DateField()
    appointment_time = models.CharField(max_length=30)
    assigned_time = models.CharField(max_length=30, blank=True, default='')
    notes = models.TextField(blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.aspirant.username} -> {self.consultancy.username} ({self.status})'


class ConsultancyVisitNotification(models.Model):
    consultancy = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='visit_notifications',
    )
    visitor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='visit_notification_visitors',
    )
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        visitor_name = self.visitor.username if self.visitor else 'Anonymous visitor'
        return f'{visitor_name} -> {self.consultancy.username}'


class ConsultancyCountryProfile(models.Model):
    consultancy = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='country_profiles',
    )
    country = models.CharField(max_length=100)
    documents = models.TextField(blank=True)
    instructions = models.TextField(blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['consultancy', 'country'], name='unique_consultancy_country_profile'),
        ]
        ordering = ['country']


class LoginHistory(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='login_history',
    )
    login_time = models.DateTimeField(auto_now_add=True)
    ip_address = models.CharField(max_length=45, blank=True, null=True)
    user_agent = models.CharField(max_length=512, blank=True)

    class Meta:
        ordering = ['-login_time']

    def __str__(self):
        return f'LoginHistory(user={self.user.username}, login_time={self.login_time})'
