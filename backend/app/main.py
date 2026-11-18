from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.database import close_db, get_db, init_indexes
from app.routers import auth, shell, users


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_indexes()
    yield
    close_db()


app = FastAPI(title="CTMS Portal API", version="1.0.0", description="Phase 0–1: authentication & user management", lifespan=lifespan)

app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(shell.router)


@app.get("/api/health", tags=["system"])
def health():
    get_db().command("ping")
    return {"status": "ok", "database": settings.mongodb_db}


@app.api_route("/api/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"], include_in_schema=False)
def not_yet(path: str):
    """Modules from later phases aren't on the backend yet; the frontend shows 'Coming in a later phase'."""
    return JSONResponse(status_code=501, content={"detail": "This module isn't connected to the database yet — it comes in a later phase."})
