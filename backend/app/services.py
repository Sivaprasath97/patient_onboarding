"""Shared helpers: user serialization, sessions, audit log, notifications."""
import secrets
from datetime import timedelta
from typing import Optional

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException

from app.core.config import settings
from app.core.database import get_db
from app.core.permissions import ROLES, permissions_for
from app.core.security import create_access_token, now


def to_oid(value: str, what: str = "Record") -> ObjectId:
    try:
        return ObjectId(value)
    except (InvalidId, TypeError):
        raise HTTPException(404, f"{what} not found")


def is_locked(user: dict) -> bool:
    lu = user.get("locked_until")
    return bool(lu and lu > now())


def user_out(u: dict) -> dict:
    return {
        "id": str(u["_id"]),
        "full_name": u["full_name"],
        "email": u["email"],
        "role": u["role"],
        "role_label": ROLES[u["role"]],
        "phone": u.get("phone"),
        "site": u.get("site"),
        "is_active": u.get("is_active", True),
        "locked": is_locked(u),
        "created_at": u["created_at"],
        "last_login_at": u.get("last_login_at"),
        "permissions": permissions_for(u["role"]),
    }


def start_session(user: dict) -> dict:
    """Creates a server-side session (revocable) and returns the login response."""
    sid = secrets.token_hex(16)
    expires = now() + timedelta(minutes=settings.access_token_expire_minutes)
    get_db().sessions.insert_one({"_id": sid, "user_id": str(user["_id"]), "created_at": now(), "expires_at": expires})
    get_db().users.update_one({"_id": user["_id"]}, {"$set": {"last_login_at": now(), "failed_attempts": 0, "locked_until": None}})
    user = get_db().users.find_one({"_id": user["_id"]})
    return {
        "access_token": create_access_token(str(user["_id"]), user["role"], sid),
        "token_type": "bearer",
        "expires_in": settings.access_token_expire_minutes * 60,
        "user": user_out(user),
    }


def end_all_sessions(user_id: str) -> None:
    get_db().sessions.delete_many({"user_id": str(user_id)})


def log_event(action: str, *, user: Optional[dict] = None, email: Optional[str] = None, ip: Optional[str] = None,
              entity_type: Optional[str] = None, entity_id: Optional[str] = None, entity_label: Optional[str] = None,
              changes: Optional[dict] = None, details: Optional[dict] = None) -> None:
    """Audit trail (SRD §4.14). Append-only."""
    get_db().audit_logs.insert_one({
        "action": action,
        "user_id": str(user["_id"]) if user else None,
        "user_name": user["full_name"] if user else None,
        "user_role": user["role"] if user else None,
        "email": user["email"] if user else email,
        "ip": ip,
        "entity_type": entity_type,
        "entity_id": str(entity_id) if entity_id else None,
        "entity_label": entity_label,
        "changes": changes or {},
        "details": details or {},
        "timestamp": now(),
    })


def notify(user_id, title: str, message: str, link: Optional[str] = None, kind: str = "info") -> None:
    get_db().notifications.insert_one({"user_id": str(user_id), "title": title, "message": message, "link": link,
                                       "kind": kind, "read": False, "created_at": now()})
