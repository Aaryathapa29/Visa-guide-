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