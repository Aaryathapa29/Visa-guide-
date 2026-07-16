import json
import os
from datetime import datetime
from pathlib import Path

from sqlalchemy import (
    Column,
    DateTime,
    Integer,
    MetaData,
    String,
    Table,
    Text,
    create_engine,
    select,
    desc,
)
from sqlalchemy.exc import SQLAlchemyError

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./document_parser.db")
engine = create_engine(DATABASE_URL, future=True)
metadata = MetaData()

analysis_results = Table(
    "analysis_results",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("client_id", String(255), nullable=True),
    Column("filename", String(255), nullable=True),
    Column("result_data", Text, nullable=False),
    Column("created_at", DateTime, nullable=False, default=datetime.utcnow),
)

metadata.create_all(engine)


def save_analysis_result(result: dict, client_id: str | None = None, filename: str | None = None) -> bool:
    try:
        with engine.connect() as conn:
            conn.execute(
                analysis_results.insert().values(
                    client_id=client_id,
                    filename=filename or result.get("filename"),
                    result_data=json.dumps(result),
                    created_at=datetime.utcnow(),
                )
            )
            conn.commit()
            return True
    except SQLAlchemyError:
        return False


def get_analysis_history(client_id: str | None = None, limit: int = 10) -> list[dict]:
    try:
        with engine.connect() as conn:
            statement = select(analysis_results)
            if client_id:
                statement = statement.where(analysis_results.c.client_id == client_id)
            statement = statement.order_by(desc(analysis_results.c.created_at)).limit(limit)
            rows = conn.execute(statement).mappings().all()
            return [
                {
                    "id": row["id"],
                    "client_id": row["client_id"],
                    "filename": row["filename"],
                    "result_data": json.loads(row["result_data"]),
                    "created_at": row["created_at"].isoformat(),
                }
                for row in rows
            ]
    except SQLAlchemyError:
        return []
