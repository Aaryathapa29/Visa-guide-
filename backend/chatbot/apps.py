from django.apps import AppConfig


class ChatbotConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'chatbot'

    # NOTE: we deliberately do NOT load the embedding model or open ChromaDB in
    # ready(). Those are heavy (torch + transformers + model weights) and would
    # slow down every `manage.py` command and `runserver` boot. Instead they are
    # loaded lazily on the first chat/upload request. See chatbot/services.py.
