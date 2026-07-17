from django.db import models


class ChatMessage(models.Model):
    """A single turn in a chat session.

    Replaces the SQLAlchemy `chat_history` table the FastAPI service used, so the
    chatbot now shares the project's Django database and ORM instead of a
    separate PostgreSQL connection.
    """

    session_id = models.CharField(max_length=255, db_index=True)
    sender = models.CharField(max_length=50)  # "user" or "assistant"
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['timestamp']

    def __str__(self) -> str:
        return f"[{self.session_id}] {self.sender}: {self.message[:40]}"
