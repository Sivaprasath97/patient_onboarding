from typing import Optional

from pymongo import ASCENDING, DESCENDING, MongoClient
from pymongo.database import Database

from app.core.config import settings

_client: Optional[MongoClient] = None


def get_db() -> Database:
    global _client
    if _client is None:
        _client = MongoClient(settings.mongodb_uri, serverSelectionTimeoutMS=10000, tz_aware=True, appname="ctms-portal")
    return _client[settings.mongodb_db]


def init_indexes() -> None:
    """Creates the collections' indexes (MongoDB creates the database on first write)."""
    db = get_db()
    db.users.create_index([("email", ASCENDING)], unique=True)
    db.sessions.create_index([("user_id", ASCENDING)])
    db.sessions.create_index([("expires_at", ASCENDING)], expireAfterSeconds=0)  # auto-delete expired sessions
    db.password_resets.create_index([("token_hash", ASCENDING)], unique=True)
    db.password_resets.create_index([("expires_at", ASCENDING)], expireAfterSeconds=0)
    db.audit_logs.create_index([("timestamp", DESCENDING)])
    db.audit_logs.create_index([("user_id", ASCENDING)])
    db.notifications.create_index([("user_id", ASCENDING), ("created_at", DESCENDING)])


def close_db() -> None:
    global _client
    if _client is not None:
        _client.close()
        _client = None
