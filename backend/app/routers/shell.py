"""Data the app shell needs on every page: notifications bell and an (empty) dashboard until later phases."""
from datetime import date

from bson import ObjectId
from fastapi import APIRouter, Depends, Response

from app.core.database import get_db
from app.core.security import now
from app.deps import get_current_user

router = APIRouter(prefix="/api", tags=["shell"])


@router.get("/notifications")
def notifications(user: dict = Depends(get_current_user)):
    db = get_db()
    uid = str(user["_id"])
    items = []
    for n in db.notifications.find({"user_id": uid}).sort("created_at", -1).limit(30):
        n["id"] = str(n.pop("_id"))
        items.append(n)
    return {"items": items, "unread": db.notifications.count_documents({"user_id": uid, "read": False}), "alerts": []}


@router.post("/notifications/read-all", status_code=204)
def read_all(user: dict = Depends(get_current_user)):
    get_db().notifications.update_many({"user_id": str(user["_id"]), "read": False}, {"$set": {"read": True, "read_at": now()}})
    return Response(status_code=204)


@router.post("/notifications/{nid}/read", status_code=204)
def read_one(nid: str, user: dict = Depends(get_current_user)):
    if ObjectId.is_valid(nid):
        get_db().notifications.update_one({"_id": ObjectId(nid), "user_id": str(user["_id"])}, {"$set": {"read": True, "read_at": now()}})
    return Response(status_code=204)


@router.get("/dashboard")
def dashboard(user: dict = Depends(get_current_user)):
    """Placeholder until Phases 2–6 are on the backend: same shape the dashboard page expects, with zero counts."""
    months, d = [], date.today().replace(day=1)
    for _ in range(6):
        months.insert(0, d.strftime("%Y-%m"))
        d = date(d.year - 1, 12, 1) if d.month == 1 else date(d.year, d.month - 1, 1)
    activity = []
    for a in get_db().audit_logs.find({"user_id": str(user["_id"])}, {"ip": 0, "changes": 0}).sort("timestamp", -1).limit(10):
        a["id"] = str(a.pop("_id"))
        activity.append(a)
    return {
        "trials": {"total": 0, "by_status": {}},
        "participants": {"total": 0, "active": 0},
        "enrollment": {"by_status": {}, "by_trial": [], "trend": [{"month": m, "count": 0} for m in months]},
        "visits": {"upcoming": [], "overdue": 0, "today": 0},
        "safety": {"open_aes": 0, "open_saes": 0},
        "queries": {"open": 0, "answered": 0},
        "tasks": [],
        "activity": activity,
    }
