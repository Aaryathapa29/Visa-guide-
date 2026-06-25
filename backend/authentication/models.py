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
    organisation_type = models.CharField(max_length=100, blank=True, null=True)
    license_number = models.CharField(max_length=50, blank=True, null=True)