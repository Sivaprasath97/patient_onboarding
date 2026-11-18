import jwt
from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.database import get_db
from app.core.permissions import has_permission
from app.core.security import decode_access_token
from app.services import to_oid

_bearer = HTTPBearer(auto_error=False)
_UNAUTH = HTTPException(401, "Not authenticated", headers={"WWW-Authenticate": "Bearer"})


def client_ip(request: Request):
    return request.client.host if request.client else None


def get_session(creds: HTTPAuthorizationCredentials = Depends(_bearer)) -> dict:
    """Validates the token AND that its server-side session still exists (logout / reset / deactivate revoke it)."""
    if creds is None:
        raise _UNAUTH
    try:
        payload = decode_access_token(creds.credentials)
    except jwt.PyJWTError:
        raise _UNAUTH
    db = get_db()
    session = db.sessions.find_one({"_id": payload.get("sid")})
    if not session or session["user_id"] != payload.get("sub"):
        raise _UNAUTH
    user = db.users.find_one({"_id": to_oid(payload["sub"])})
    if not user or not user.get("is_active", True):
        raise _UNAUTH
    return {"user": user, "sid": session["_id"]}


def get_current_user(s: dict = Depends(get_session)) -> dict:
    return s["user"]


def require_perm(perm: str):
    def checker(user: dict = Depends(get_current_user)) -> dict:
        if not has_permission(user["role"], perm):
            raise HTTPException(403, "You don't have permission to do this")
        return user

    return checker
