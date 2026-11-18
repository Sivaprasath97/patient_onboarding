import hashlib
import re
import secrets
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

from app.core.config import settings


def now() -> datetime:
    return datetime.now(timezone.utc)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except ValueError:
        return False


def password_problem(pw: str):
    """Same policy as the frontend: >= 8 chars with at least one letter and one number."""
    if not pw or len(pw) < 8 or not re.search(r"[A-Za-z]", pw) or not re.search(r"\d", pw):
        return "Password must be at least 8 characters with letters and numbers"
    return None


def create_access_token(user_id: str, role: str, session_id: str) -> str:
    n = now()
    payload = {"sub": user_id, "role": role, "sid": session_id, "iat": n,
               "exp": n + timedelta(minutes=settings.access_token_expire_minutes)}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict:
    """Raises jwt.PyJWTError if invalid or expired."""
    return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])


def new_reset_token() -> str:
    return secrets.token_urlsafe(32)


def hash_token(token: str) -> str:
    """Reset tokens are stored hashed, so a database leak can't be used to reset passwords."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()
