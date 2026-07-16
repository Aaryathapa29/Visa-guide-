import os
from datetime import datetime

from sqlalchemy import (
    create_engine,
    MetaData,
    Table,
    Column,
    Integer,
    String,
    Text,
    DateTime,
    select,
    desc,
)
from sqlalchemy.exc import SQLAlchemyError

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:password@localhost:5432/visa_chatbot",
)

engine = create_engine(DATABASE_URL, future=True)
metadata = MetaData()

chat_history = Table(
    "chat_history",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("session_id", String(255), nullable=False),
    Column("sender", String(50), nullable=False),
    Column("message", Text, nullable=False),
    Column("timestamp", DateTime, nullable=False, default=datetime.utcnow),
)

# Create the table if the database is reachable. If Postgres is down we don't
# crash on import — chat still works, history just won't be saved.
try:
    metadata.create_all(engine)
except SQLAlchemyError as exc:
    print(f"[db] Skipping table creation (database unavailable): {exc}")


def save_message(session_id: str, sender: str, message: str) -> None:
    try:
        with engine.connect() as conn:
            statement = chat_history.insert().values(
                session_id=session_id,
                sender=sender,
                message=message,
                timestamp=datetime.utcnow(),
            )
            conn.execute(statement)
            conn.commit()
    except SQLAlchemyError:
        pass


def get_chat_history(session_id: str, limit: int = 10) -> list[dict]:
    try:
        with engine.connect() as conn:
            statement = (
                select(chat_history)
                .where(chat_history.c.session_id == session_id)
                .order_by(desc(chat_history.c.timestamp))
                .limit(limit)
            )
            result = conn.execute(statement).mappings().all()
            return [dict(row) for row in reversed(result)]
    except SQLAlchemyError:
        return []
