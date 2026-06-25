# from django.contrib import admin
# from django.contrib.auth.admin import UserAdmin
# from .models import User

# # This tells Django Admin how to display and structure your custom user model
# @admin.register(User)
# class CustomUserAdmin(UserAdmin):
#     # Add 'role' to the list of fields shown when viewing users
#     list_display = ('username', 'email', 'role', 'is_staff', 'is_active')
    
#     # Add 'role' to the filter sidebar so you can filter by Student vs. Consultancy
#     list_filter = ('role', 'is_staff', 'is_superuser', 'is_active')
    
#     # Include 'role' when you click to edit a user in the admin panel
#     fieldsets = UserAdmin.fieldsets + (
#         ('Role Information', {'fields': ('role',)}),
#     )
    
#     # Include 'role' when creating a new user via the admin panel
#     add_fieldsets = UserAdmin.add_fieldsets + (
#         ('Role Information', {'fields': ('role',)}),
#     )

    
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    # Columns listed when looking at the overall summary tables
    list_display = ('username', 'email', 'role', 'is_verified', 'is_staff', 'is_active')
    
    # Right-side panel filtering fields
    list_filter = ('role', 'is_verified', 'is_staff', 'is_superuser', 'is_active')
    
    # Structure when opening up details of an existing profile
    fieldsets = UserAdmin.fieldsets + (
        ('Role & Business Verification', {'fields': ('role', 'is_verified', 'organisation_type', 'license_number')}),
    )
    
    # Setup parameters when deploying a record fresh from Admin dashboard
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Role & Business Verification', {'fields': ('role', 'is_verified', 'organisation_type', 'license_number')}),
    )

    actions = ['approve_consultancies', 'reject_consultancies']

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        return queryset.order_by('is_verified', 'role', 'username')

    @admin.action(description='Approve selected consultancies')
    def approve_consultancies(self, request, queryset):
        queryset.filter(role='consultancy').update(is_verified=True)

    @admin.action(description='Reject selected consultancies')
    def reject_consultancies(self, request, queryset):
        queryset.filter(role='consultancy').update(is_verified=False)