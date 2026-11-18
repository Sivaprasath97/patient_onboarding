# patient_onboarding

**CTMS Portal** — a Clinical Trial Management System for clinical research teams: trials and protocols,
participant onboarding (screening → eligibility → consent → enrollment), visits, medical assessments,
adverse events, data queries, documents, reports and audit logs.

- **Frontend:** React 18 + Vite + Tailwind CSS (`ctms-frontend/`)
- **Backend:** Python FastAPI (`backend/`) → MongoDB Atlas, database `patient_onboarding`
- **Requirements:** `SOFTWARE REQUIREMENTS DOCUMENT.pdf`
- **Phases, status and workflow logic:** [PROJECT_PHASES.md](PROJECT_PHASES.md)

Phases 0–1 (foundation, authentication, user management) are complete and connected to MongoDB.
Phases 2–6 have their screens built and are being connected to the backend.

## Getting started

### 1. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt     # macOS/Linux: .venv/bin/python
copy .env.example .env                                         # then fill in MONGODB_URI and JWT_SECRET
.venv\Scripts\python create_admin.py                           # create the first administrator
.venv\Scripts\python -m uvicorn app.main:app --reload --reload-dir app --port 8000
```

API docs: http://127.0.0.1:8000/docs

### 2. Frontend

```bash
cd ctms-frontend
npm install
npm run dev
```

Open http://127.0.0.1:5173. The dev server forwards `/api` to the backend on port 8000.

To try the frontend **without a backend**, set `VITE_USE_MOCK=true` in `ctms-frontend/.env.development`
(demo accounts appear on the sign-in page, password `Demo@1234`).

## Project structure

```
backend/          FastAPI app (auth, users) → MongoDB Atlas
ctms-frontend/    React app, one folder per module under src/modules/
stitch-export/    Original UI designs exported from Google Stitch (reference)
PROJECT_PHASES.md Phase-by-phase scope, workflows and business rules
```

## Security notes

- Secrets (`backend/.env`) are git-ignored — use `backend/.env.example` as the template.
- Passwords are stored as bcrypt hashes; sessions are server-side and revoked on logout, password reset and deactivation.
- Before production: set `EXPOSE_RESET_LINK=false`, connect an email service, and move the session token to an HTTP-only cookie.
- Logo: add the licensed logo file as `ctms-frontend/public/logo.png`.
