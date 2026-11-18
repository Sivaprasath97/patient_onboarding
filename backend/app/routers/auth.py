"""Phase 1 — Authentication (SRD §4.1, §5.2)."""
from datetime import timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel, EmailStr, Field
from pymongo.errors import DuplicateKeyError

from app.core.config import settings
from app.core.database import get_db
from app.core.errors import field_error
from app.core.permissions import ROLES, SELF_REGISTER_ROLES
from app.core.security import hash_password, hash_token, new_reset_token, now, password_problem, verify_password
from app.deps import client_ip, get_current_user, get_session
from app.services import end_all_sessions, is_locked, log_event, notify, start_session, to_oid, user_out

router = APIRouter(prefix="/api/auth", tags=["auth"])

# Hash used to keep login timing similar whether or not the email exists.
_DUMMY_HASH = hash_password("timing-equaliser-not-a-real-password1")


class RegisterIn(BaseModel):
    full_name: str = Field(max_length=100)
    email: EmailStr
    password: str = Field(max_length=128)
    role: str
    phone: Optional[str] = Field(default=None, max_length=20)
    site: Optional[str] = Field(default=None, max_length=120)


class LoginIn(BaseModel):
    email: str = Field(max_length=254)
    password: str = Field(max_length=128)


class ProfileIn(BaseModel):
    full_name: Optional[str] = Field(default=None, max_length=100)
    phone: Optional[str] = Field(default=None, max_length=20)
    site: Optional[str] = Field(default=None, max_length=120)


class ChangePasswordIn(BaseModel):
    current_password: str = Field(max_length=128)
    new_password: str = Field(max_length=128)


class ForgotIn(BaseModel):
    email: EmailStr


class ResetIn(BaseModel):
    token: str = Field(max_length=200)
    password: str = Field(max_length=128)


def _clean(v: Optional[str]) -> Optional[str]:
    v = (v or "").strip()
    return v or None


@router.get("/roles")
def roles():
    return [{"value": r, "label": ROLES[r]} for r in SELF_REGISTER_ROLES]


@router.post("/register", status_code=201)
def register(data: RegisterIn, request: Request):
    name = data.full_name.strip()
    if len(name) < 2:
        raise field_error("full_name", "Enter your full name")
    if data.role not in SELF_REGISTER_ROLES:
        raise field_error("role", "This role cannot be self-registered")
    problem = password_problem(data.password)
    if problem:
        raise field_error("password", problem)
    ts = now()
    doc = {"full_name": name, "email": data.email.lower(), "password_hash": hash_password(data.password), "role": data.role,
           "phone": _clean(data.phone), "site": _clean(data.site), "is_active": True, "failed_attempts": 0, "locked_until": None,
           "created_at": ts, "updated_at": ts, "last_login_at": None}
    try:
        res = get_db().users.insert_one(doc)
    except DuplicateKeyError:
        raise HTTPException(409, "An account with this email already exists")
    doc["_id"] = res.inserted_id
    log_event("user.register", user=doc, ip=client_ip(request), details={"role": doc["role"]})
    notify(res.inserted_id, "Welcome to CTMS Portal", f"Your {ROLES[doc['role']]} account is ready.", link="/profile")
    return start_session(doc)


@router.post("/login")
def login(data: LoginIn, request: Request):
    db = get_db()
    email = data.email.strip().lower()
    user = db.users.find_one({"email": email})
    invalid = HTTPException(401, "Invalid email or password")
    if not user:
        verify_password(data.password, _DUMMY_HASH)
        log_event("user.login_failed", email=email, ip=client_ip(request))
        raise invalid
    if is_locked(user):
        mins = max(1, int((user["locked_until"] - now()).total_seconds() // 60) + 1)
        raise HTTPException(423, f"Account temporarily locked after too many failed attempts. Try again in {mins} minute(s) or reset your password.")
    if not verify_password(data.password, user["password_hash"]):
        attempts = user.get("failed_attempts", 0) + 1
        if attempts >= settings.max_failed_logins:
            db.users.update_one({"_id": user["_id"]}, {"$set": {
                "failed_attempts": 0, "locked_until": now() + timedelta(minutes=settings.lock_minutes)}})
            log_event("user.locked", user=user, ip=client_ip(request))
            raise HTTPException(423, f"Too many failed attempts. Account locked for {settings.lock_minutes} minutes.")
        db.users.update_one({"_id": user["_id"]}, {"$set": {"failed_attempts": attempts}})
        log_event("user.login_failed", user=user, ip=client_ip(request))
        raise invalid
    if not user.get("is_active", True):
        raise HTTPException(403, "This account has been deactivated. Contact your administrator.")
    log_event("user.login", user=user, ip=client_ip(request))
    return start_session(user)


@router.get("/me")
def me(user: dict = Depends(get_current_user)):
    return user_out(user)


@router.patch("/me")
def update_me(data: ProfileIn, request: Request, user: dict = Depends(get_current_user)):
    updates = {}
    fields = data.model_dump(exclude_unset=True)
    if "full_name" in fields:
        name = (fields["full_name"] or "").strip()
        if len(name) < 2:
            raise field_error("full_name", "Enter your full name")
        updates["full_name"] = name
    for k in ("phone", "site"):
        if k in fields:
            updates[k] = _clean(fields[k])
    changes = {k: {"from": user.get(k), "to": v} for k, v in updates.items() if user.get(k) != v}
    if changes:
        updates["updated_at"] = now()
        get_db().users.update_one({"_id": user["_id"]}, {"$set": updates})
        log_event("user.profile_update", user=user, ip=client_ip(request), changes=changes)
    return user_out(get_db().users.find_one({"_id": user["_id"]}))


@router.post("/change-password", status_code=204)
def change_password(data: ChangePasswordIn, request: Request, s: dict = Depends(get_session)):
    user = s["user"]
    if not verify_password(data.current_password, user["password_hash"]):
        raise field_error("current_password", "Current password is incorrect")
    problem = password_problem(data.new_password)
    if problem:
        raise field_error("new_password", problem)
    if data.new_password == data.current_password:
        raise field_error("new_password", "New password must be different from the current one")
    get_db().users.update_one({"_id": user["_id"]}, {"$set": {"password_hash": hash_password(data.new_password), "updated_at": now()}})
    # Sign out other devices, keep this session.
    get_db().sessions.delete_many({"user_id": str(user["_id"]), "_id": {"$ne": s["sid"]}})
    log_event("user.password_change", user=user, ip=client_ip(request))
    return Response(status_code=204)


@router.post("/logout", status_code=204)
def logout(request: Request, s: dict = Depends(get_session)):
    get_db().sessions.delete_one({"_id": s["sid"]})
    log_event("user.logout", user=s["user"], ip=client_ip(request))
    return Response(status_code=204)


@router.post("/forgot-password")
def forgot_password(data: ForgotIn, request: Request):
    db = get_db()
    user = db.users.find_one({"email": data.email.lower(), "is_active": True})
    res = {"message": "If an account exists for this email, a password reset link has been sent."}
    if user:
        token = new_reset_token()
        db.password_resets.insert_one({"token_hash": hash_token(token), "user_id": str(user["_id"]), "used": False,
                                       "created_at": now(), "expires_at": now() + timedelta(minutes=settings.reset_token_minutes)})
        log_event("user.password_reset_requested", user=user, ip=client_ip(request))
        # TODO: send by email. Until an email service exists, optionally return the link (EXPOSE_RESET_LINK).
        if settings.expose_reset_link:
            res["demo_reset_link"] = f"/reset-password?token={token}"
    return res


def _valid_reset(token: str) -> dict:
    r = get_db().password_resets.find_one({"token_hash": hash_token(token)})
    if not r or r["used"] or r["expires_at"] < now():
        raise HTTPException(400, "This reset link is invalid or has expired. Request a new one.")
    return r


@router.get("/reset-password/{token}")
def check_reset(token: str):
    r = _valid_reset(token)
    u = get_db().users.find_one({"_id": to_oid(r["user_id"])})
    if not u:
        raise HTTPException(400, "This reset link is invalid or has expired. Request a new one.")
    name, domain = u["email"].split("@")
    return {"email": f"{name[:2]}{'•' * max(1, len(name) - 2)}@{domain}"}


@router.post("/reset-password", status_code=204)
def reset_password(data: ResetIn, request: Request):
    r = _valid_reset(data.token)
    problem = password_problem(data.password)
    if problem:
        raise field_error("password", problem)
    db = get_db()
    uid = to_oid(r["user_id"])
    db.users.update_one({"_id": uid}, {"$set": {"password_hash": hash_password(data.password), "failed_attempts": 0,
                                                "locked_until": None, "updated_at": now()}})
    db.password_resets.update_one({"_id": r["_id"]}, {"$set": {"used": True, "used_at": now()}})
    end_all_sessions(r["user_id"])
    log_event("user.password_reset", user=db.users.find_one({"_id": uid}), ip=client_ip(request))
    return Response(status_code=204)
