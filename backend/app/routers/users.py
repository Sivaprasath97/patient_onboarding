"""Phase 1 — User management (SRD §4.1). Admins only, except /directory."""
import re
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response
from pydantic import BaseModel, EmailStr, Field
from pymongo.errors import DuplicateKeyError

from app.core.database import get_db
from app.core.errors import field_error
from app.core.permissions import ROLES
from app.core.security import hash_password, now, password_problem
from app.deps import client_ip, get_current_user, require_perm
from app.services import end_all_sessions, log_event, to_oid, user_out

router = APIRouter(prefix="/api/users", tags=["users"])


class UserCreate(BaseModel):
    full_name: str = Field(max_length=100)
    email: EmailStr
    password: str = Field(max_length=128)
    role: str
    phone: Optional[str] = Field(default=None, max_length=20)
    site: Optional[str] = Field(default=None, max_length=120)


class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(default=None, max_length=100)
    role: Optional[str] = None
    phone: Optional[str] = Field(default=None, max_length=20)
    site: Optional[str] = Field(default=None, max_length=120)
    is_active: Optional[bool] = None


class PasswordIn(BaseModel):
    password: str = Field(max_length=128)


def _clean(v):
    v = (v or "").strip()
    return v or None


def _get(user_id: str) -> dict:
    u = get_db().users.find_one({"_id": to_oid(user_id, "User")})
    if not u:
        raise HTTPException(404, "User not found")
    return u


@router.get("/directory")
def directory(role: Optional[str] = None, _: dict = Depends(get_current_user)):
    q = {"is_active": True, **({"role": role} if role else {})}
    return [{"id": str(u["_id"]), "name": u["full_name"], "email": u["email"], "role": u["role"], "role_label": ROLES[u["role"]]}
            for u in get_db().users.find(q).sort("full_name", 1)]


@router.get("")
def list_users(q: Optional[str] = None, role: Optional[str] = None, active: Optional[bool] = None,
               page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=200),
               _: dict = Depends(require_perm("users:manage"))):
    query = {}
    if q:
        rx = {"$regex": re.escape(q.strip()), "$options": "i"}
        query["$or"] = [{"full_name": rx}, {"email": rx}]
    if role:
        query["role"] = role
    if active is not None:
        query["is_active"] = active
    coll = get_db().users
    total = coll.count_documents(query)
    docs = coll.find(query).sort("full_name", 1).skip((page - 1) * page_size).limit(page_size)
    return {"items": [user_out(d) for d in docs], "total": total, "page": page, "page_size": page_size}


@router.post("", status_code=201)
def create_user(data: UserCreate, request: Request, admin: dict = Depends(require_perm("users:manage"))):
    name = data.full_name.strip()
    if len(name) < 2:
        raise field_error("full_name", "Enter a full name")
    if data.role not in ROLES:
        raise field_error("role", "Select a role")
    problem = password_problem(data.password)
    if problem:
        raise field_error("password", problem)
    ts = now()
    doc = {"full_name": name, "email": data.email.lower(), "password_hash": hash_password(data.password), "role": data.role,
           "phone": _clean(data.phone), "site": _clean(data.site), "is_active": True, "failed_attempts": 0, "locked_until": None,
           "created_at": ts, "updated_at": ts, "last_login_at": None, "created_by": str(admin["_id"])}
    try:
        res = get_db().users.insert_one(doc)
    except DuplicateKeyError:
        raise HTTPException(409, "An account with this email already exists")
    doc["_id"] = res.inserted_id
    log_event("user.create", user=admin, ip=client_ip(request), entity_type="user", entity_id=res.inserted_id,
              entity_label=doc["email"], details={"role": doc["role"]})
    return user_out(doc)


@router.patch("/{user_id}")
def update_user(user_id: str, data: UserUpdate, request: Request, admin: dict = Depends(require_perm("users:manage"))):
    u = _get(user_id)
    fields = data.model_dump(exclude_unset=True)
    if u["_id"] == admin["_id"] and (fields.get("is_active") is False or ("role" in fields and fields["role"] != "admin")):
        raise HTTPException(400, "You can't deactivate your own account or remove your own admin role")
    updates = {}
    if "full_name" in fields:
        name = (fields["full_name"] or "").strip()
        if len(name) < 2:
            raise field_error("full_name", "Enter a full name")
        updates["full_name"] = name
    if "role" in fields:
        if fields["role"] not in ROLES:
            raise field_error("role", "Select a role")
        updates["role"] = fields["role"]
    for k in ("phone", "site"):
        if k in fields:
            updates[k] = _clean(fields[k])
    if "is_active" in fields and fields["is_active"] is not None:
        updates["is_active"] = bool(fields["is_active"])
        if updates["is_active"]:
            updates.update({"locked_until": None, "failed_attempts": 0})
    changes = {k: {"from": u.get(k), "to": v} for k, v in updates.items() if u.get(k) != v and k not in ("failed_attempts",)}
    if changes:
        updates["updated_at"] = now()
        get_db().users.update_one({"_id": u["_id"]}, {"$set": updates})
        if updates.get("is_active") is False or "role" in changes:
            end_all_sessions(u["_id"])  # deactivated or role changed -> must sign in again
        action = "user.deactivate" if updates.get("is_active") is False else "user.activate" if updates.get("is_active") is True and "is_active" in changes else "user.update"
        log_event(action, user=admin, ip=client_ip(request), entity_type="user", entity_id=u["_id"], entity_label=u["email"],
                  changes={k: {"from": str(c["from"]) if c["from"] is not None else None, "to": str(c["to"]) if c["to"] is not None else None} for k, c in changes.items()})
    return user_out(_get(user_id))


@router.post("/{user_id}/reset-password", status_code=204)
def admin_reset_password(user_id: str, data: PasswordIn, request: Request, admin: dict = Depends(require_perm("users:manage"))):
    u = _get(user_id)
    problem = password_problem(data.password)
    if problem:
        raise field_error("password", problem)
    get_db().users.update_one({"_id": u["_id"]}, {"$set": {"password_hash": hash_password(data.password), "locked_until": None,
                                                           "failed_attempts": 0, "updated_at": now()}})
    end_all_sessions(u["_id"])
    log_event("user.password_reset", user=admin, ip=client_ip(request), entity_type="user", entity_id=u["_id"], entity_label=u["email"])
    return Response(status_code=204)
