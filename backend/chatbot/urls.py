from django.urls import path

from .views import ChatView, HealthView, HistoryView, UploadView

# Mounted under /api/chatbot/ (see visa_backend/urls.py). No trailing slashes so
# the paths match the frontend calls: POST /api/chatbot/chat, /api/chatbot/upload.
urlpatterns = [
    path('chat', ChatView.as_view(), name='chatbot_chat'),
    path('upload', UploadView.as_view(), name='chatbot_upload'),
    path('health', HealthView.as_view(), name='chatbot_health'),
    path('history', HistoryView.as_view(), name='chatbot_history'),
]
