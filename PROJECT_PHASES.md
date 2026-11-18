# CTMS Portal — Project Phases & Workflow Logic

Clinical Trial Management System (CTMS) frontend, built from the *Software Requirements Document (SRD) v1.0*.
This file lists every delivery phase, what it contains, where the code lives, and how each workflow behaves.

- **Frontend:** `ctms-frontend/` (React 18 + Vite + Tailwind CSS)
- **Backend:** `backend/` (Python FastAPI) → **MongoDB Atlas**, database **`patient_onboarding`** (Phases 0–1)
- **Run** (two terminals):
  1. `cd backend` → `.venv\Scripts\python -m uvicorn app.main:app --reload --reload-dir app --port 8000`
  2. `cd ctms-frontend` → `npm run dev` → open http://127.0.0.1:5173
- **First administrator:** `cd backend` → `.venv\Scripts\python create_admin.py` (admins can't self-register).
- **Data mode:** `VITE_USE_MOCK` in `ctms-frontend/.env.development`
  - `false` (current) → real backend at `/api` (proxied to `http://127.0.0.1:8000`) → MongoDB Atlas.
  - `true` → in-browser demo data, no backend needed.
- **Secrets:** the Atlas connection string and JWT secret live only in `backend/.env` (git-ignored). Template: `backend/.env.example`.

**MongoDB collections (`patient_onboarding`)**

| Collection | Holds |
|---|---|
| `users` | Accounts: name, email (unique), bcrypt password hash, role, site, phone, active flag, failed-login count, lock time |
| `sessions` | Server-side sessions (one per sign-in); deleted on logout / password reset / deactivation; auto-expire after 8 h |
| `password_resets` | Hashed reset tokens, single use, auto-expire after 30 min |
| `audit_logs` | Sign-ins, failed sign-ins, lockouts, profile/password changes, user admin actions (old → new values) |
| `notifications` | In-app notifications (e.g. welcome message) |

---

## 1. Phase overview

| Phase | Name | SRD sections | Status |
|---|---|---|---|
| 0 | Foundation & design system | §5.4, §5.6, §7.1 | ✅ Complete |
| 1 | Authentication & user management | §3, §4.1, §5.2 | ✅ Complete — connected to MongoDB Atlas |
| 2 | Study setup — Trials, Protocols, Documents | §4.3, §4.6, §4.11 | 🟡 Screens built; needs backend |
| 3 | Participant onboarding — Participants, Enrollment | §4.4, §4.5 | 🟡 Screens built; needs backend |
| 4 | Trial conduct — Visits, Assessments, Adverse Events | §4.7, §4.8, §4.9 | 🟡 Screens built; needs backend |
| 5 | Data quality & compliance — Data Queries, Audit Logs | §4.10, §4.14 | 🟡 Screens built; needs backend |
| 6 | Insights & alerts — Dashboard, Reports, Notifications | §4.2, §4.12, §4.13 | 🟡 Screens built; needs backend |
| 7 | Hardening & release | §5.1, §5.3, §5.5 | ⬜ Not started |

> "Needs backend": the pages and forms exist and were tested against the earlier Python backend (since removed).
> In demo mode they show **"Coming in a later phase"** until the mock API (or a real backend) covers them.

---

## 2. User roles (SRD §3)

| Role | Key | Main responsibilities |
|---|---|---|
| System Administrator | `admin` | Users, roles, system settings. **Cannot see medical data.** |
| Principal Investigator | `principal_investigator` | Trials, protocols, eligibility review, finalize assessments, AE review |
| Research Coordinator | `research_coordinator` | Register/enroll participants, visits, record assessments and AEs |
| Clinical Research Associate | `cra` | Monitor, verify data, deviations, raise/close queries |
| Data Manager | `data_manager` | Data quality, raise/close queries, reports |

The full permission matrix is in `src/shared/auth/permissions.js` and is shown in the app under
**User Management → Roles & permissions**. The sidebar only shows modules the signed-in role can open, and every
route re-checks the permission (direct URL access shows *"You don't have permission"*).

---

## 3. Phase details and workflow logic

### Phase 0 — Foundation & design system ✅

**Contains**
- Project setup: `package.json`, `vite.config.js`, `tailwind.config.js`, `index.html`, `.env.development`
- Brand theme from the project logo (`tailwind.config.js`):
  - Primary blue `#1B74AC` / deep navy `#16466E` (from the cross) — buttons, links, headings
  - Green `#23803A` / `#2E9440` (from the leaves) — success, "active" states, highlights
  - Lime `#7DCB45` — small accents only (not used for text)
- Logo slot: `src/shared/components/BrandLogo.jsx` loads `public/logo.png`; shows a placeholder until the licensed file is added
- App shell & routing: `src/app/App.jsx`, module registry `src/app/modules.js`
- Shared UI kit: `src/shared/ui/` (Button, DataTable, Form fields, Modal, StatusBadge, Toast, Page/Card/Tabs)
- Layout: `src/shared/layout/` (sidebar, top bar, user menu, notification bell)
- API client + demo mode: `src/shared/api/client.js`, `src/shared/api/mock/`
- Error screen (`ErrorBoundary.jsx`) and 404 page (`NotFound.jsx`)

**Working logic**
- **Module registry:** each module has `src/modules/<name>/index.js` = `{ id, path, label, icon, perm, routes }`.
  `app/modules.js` lists them in sidebar order. `App.jsx` builds the routes from this list; adding a module needs no layout changes.
- **Page load:** route → permission check → lazy-load the module's page → error boundary around it.
- **API calls:** every module calls `api('/path')`.
  - Demo mode → handled by `shared/api/mock/index.js` (data in browser `localStorage`).
  - Real mode → `fetch('/api/path')` with `Authorization: Bearer <token>`.
  - A `401` anywhere signs the user out; validation errors are shown under the matching form fields.
- **Responsive layout:** desktop (≥ 1024 px) has a fixed sidebar; tablet/mobile use a slide-out menu (☰ button).

---

### Phase 1 — Authentication & user management ✅

**Contains**
- `src/modules/auth/` — Login, Register, Forgot password, Reset password, My profile, auth context, route guards, password strength meter
- `src/modules/user-management/` — Users list, add/edit user, activate/deactivate, reset password, Roles & permissions matrix
- `src/shared/auth/permissions.js` — role → permission matrix

**Demo accounts** (demo mode only, password `Demo@1234`):
`admin@ctms.demo`, `pi@ctms.demo`, `coordinator@ctms.demo`, `cra@ctms.demo`, `datamanager@ctms.demo`

**Workflow logic**

*Register*
```
Fill form → client validation → POST /auth/register → account created → signed in → Dashboard
```
- Name ≥ 2 characters, valid email, role required.
- Password: at least 8 characters with at least one letter and one number (strength meter shown).
- Email must be unique (409 "account already exists").
- **Administrator cannot be self-registered** — admins are created by another admin.

*Sign in*
```
Email + password → POST /auth/login
  ├─ correct            → session token saved → go to the page you came from (or Dashboard)
  ├─ wrong              → "Invalid email or password" (same message whether or not the email exists)
  ├─ 5th wrong attempt  → account LOCKED for 15 minutes
  ├─ locked account     → "temporarily locked… try again in N minutes or reset your password"
  └─ deactivated account → "This account has been deactivated"
```

*Session*
- Session lasts 8 hours; refreshing the page keeps you signed in.
- **Idle timeout:** no mouse/keyboard/scroll activity for 30 minutes → signed out → login page explains why.
- Expired/revoked session (401) → signed out → "Your session has expired".
- Signed-in users visiting `/login` or `/register` are sent to the Dashboard; signed-out users visiting app pages are sent to `/login`.

*Forgot / reset password*
```
Forgot password → enter email → POST /auth/forgot-password
   → always "If an account exists, a reset link has been sent" (doesn't reveal which emails exist)
Reset link (/reset-password?token=…) → link checked (valid 30 minutes, single use)
   → new password + confirm → POST /auth/reset-password
   → account unlocked, all sessions signed out → login page "Your password was changed"
```
- Demo mode has no email service, so the reset link is shown on screen.

*My profile* (user menu → "My profile & password", or click your name in the sidebar)
- Edit full name, phone, site (email is changed only by an administrator).
- Change password: current password must be correct; new password must follow the policy and differ from the current one.
- "What you can do" lists the permissions of your role.

*User management* (administrators only)
- List with search and filters (role, active/inactive); totals for total / active / inactive / locked.
- **Add user:** name, email, temporary password, role, site, phone. Any role, including admin.
- **Edit user:** name, role, site, phone. An admin cannot change their own role.
- **Deactivate:** user is signed out immediately and can no longer sign in. Records are kept. An admin cannot deactivate themselves.
- **Activate:** restores access and clears any lock.
- **Reset password:** sets a new password and unlocks a locked account.
- **Roles & permissions** tab: read-only matrix of what every role can do.

**Backend endpoints** (implemented in `backend/app/routers/auth.py` and `users.py`; prefix `/api`)

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/auth/roles` | Self-registrable roles |
| POST | `/auth/register` | → `{ access_token, expires_in, user }` |
| POST | `/auth/login` | → `{ access_token, expires_in, user }` · 401 invalid · 423 locked · 403 deactivated |
| GET / PATCH | `/auth/me` | Current user / update own profile |
| POST | `/auth/change-password` | `{ current_password, new_password }` → 204 |
| POST | `/auth/logout` | → 204 |
| POST | `/auth/forgot-password` | `{ email }` → `{ message }` (emails a reset link) |
| GET | `/auth/reset-password/:token` | Validate link → `{ email }` (masked) |
| POST | `/auth/reset-password` | `{ token, password }` → 204 |
| GET | `/users` | `?q&role&active&page&page_size` → `{ items, total, page, page_size }` |
| POST | `/users` | Create user |
| PATCH | `/users/:id` | `{ full_name?, role?, phone?, site?, is_active? }` |
| POST | `/users/:id/reset-password` | `{ password }` → 204 (also unlocks) |
| GET | `/users/directory` | `?role` → active users for pickers |

The `user` object: `id, full_name, email, role, role_label, phone, site, is_active, locked, created_at, last_login_at, permissions[]`.

---

### Phase 2 — Study setup: Trials, Protocols, Documents 🟡

**Contains:** `src/modules/trials/`, `src/modules/documents/`

**Workflow logic**

*Trial lifecycle* (unique ID `TRL-0001`, auto-generated — BR-1)
```
Draft ──► Planned ──► Active ──► Completed
  │          │  ▲        │
  │          ▼  │        ├──► Suspended ──► Active
  │        Draft│        │        │
  └──────────────┴────────┴────────┴──► Terminated
```
- Allowed moves only: Draft→Planned/Terminated · Planned→Draft/Active/Terminated · Active→Suspended/Completed/Terminated · Suspended→Active/Terminated. Completed and Terminated are final.
- **Active requires an active protocol.** Suspend/Terminate require a reason.
- Every change is kept in the trial's status history and notifies the trial team.
- Completed/Terminated trials can't be edited.
- Fields: title, phase, study type, therapeutic area, sponsor, start/end date (end ≥ start), target enrollment, Principal Investigator, research team.

*Protocol versions*
```
Create (Draft v1) → edit → Activate → Active
Amendment: create Draft v2 → Activate → v2 Active, v1 Superseded
```
- Only one draft at a time; only drafts can be edited.
- Activation needs at least one inclusion criterion.
- A protocol holds: objectives, procedures, **inclusion / exclusion criteria**, **visit schedule** (name, day after enrollment, ± window days).
- Activating an amendment (v2+) warns the team that participants may need re-consent.

*Protocol deviations:* report (participant optional, category, severity Minor/Major/Critical, date) → Open → Resolve (resolution text) → Resolved.

*Documents*
- Upload with title, category (Protocol, Informed Consent, Lab Report, Regulatory…), optional trial/participant link.
- Allowed: pdf, doc(x), xls(x), csv, txt, png, jpg — max 20 MB.
- **New version** keeps all previous versions; the list shows the latest; version history lets you download any version.

---

### Phase 3 — Participant onboarding: Participants, Enrollment 🟡

**Contains:** `src/modules/participants/`, `src/modules/enrollment/`

*Participant registry* (unique ID `PT-00001` — BR-2)
- Demographics (name, date of birth in the past, sex), contact, emergency contact, medical history, allergies, medications.
- **Withdraw:** reason required → open screenings/enrollments withdrawn, scheduled visits cancelled.
  Records are kept and become read-only (BR-10).

*Enrollment workflow*
```
Start screening ─► Eligibility checklist ─► Informed consent ─► Enroll ─► (visits auto-scheduled) ─► Complete study
       │                    │                       │
       │                    └─ Not eligible ─► Screen fail (reason)
       └──────────────────────────────────────────► Withdraw (reason) at any point
```
1. **Start screening** — participant must be Active; trial must be **Active** with an active protocol (BR-3);
   no other open screening/enrollment for the same trial. The protocol's criteria are copied into a checklist.
2. **Eligibility** — answer Yes/No per criterion.
   *Eligible* = every inclusion criterion **Yes** and every exclusion criterion **No** (BR-5).
   Otherwise *Not eligible*; unanswered = *Incomplete*.
3. **Informed consent** — status Pending / Signed / Declined / Withdrawn.
   *Signed* requires consent date (not in the future) and consent form version; a signed consent document can be linked.
4. **Enroll** — allowed only when Eligible **and** consent Signed (BR-4); enrollment date ≥ consent date.
   The visit schedule is generated from the protocol: date = enrollment date + day, with the ± window.
5. **Complete study** — only when no visits are still Scheduled.

Enrollment statuses: `Screening → Enrolled → Completed`, or `Screen Failed`, or `Withdrawn`.

---

### Phase 4 — Trial conduct: Visits, Medical Assessments, Adverse Events 🟡

**Contains:** `src/modules/visits/`, `src/modules/assessments/`, `src/modules/adverse-events/`

*Visits* (every visit belongs to a screening/enrolled participant — BR-6)
```
Scheduled ──► Completed   (completion date; flagged "out of window" if outside the protocol window)
    │──────► Missed      (reason)
    │──────► Cancelled   (reason)
    └──────► Reschedule  (new date + reason, history kept; stays Scheduled)
```
- **Overdue** = still Scheduled and the date has passed.
- Views: Upcoming, Overdue, All, month Calendar. Unscheduled visits can be added manually.

*Medical assessments* (recorded against a completed visit; consent must be signed)
```
Draft ──(PI finalizes)──► Finalized ──(edit with correction reason)──► Finalized + correction history
```
- Vitals (BP, heart rate, temperature, respiratory rate, SpO₂, weight, height) with valid ranges.
- Lab results: test, value, unit, reference range → automatic flag **High / Low / Normal**.
- Finalizing requires: systolic & diastolic BP, heart rate, temperature, investigator observations, and diastolic < systolic.
- Finalized records are **never silently overwritten** (BR-8): each change needs a reason and is stored in the correction history.
- Administrators cannot view medical data.

*Adverse events* (unique ID `AE-0001`)
```
Report ──► Open ──(PI review + causality)──► Reviewed ──(PI close + final outcome)──► Closed
```
- Fields: term, description, onset date (not future), resolution date (≥ onset), severity
  (Mild / Moderate / Severe / Life-threatening / Death), outcome, action taken.
- **Serious AE (SAE)** requires at least one seriousness criterion and alerts **all** Principal Investigators.
- Follow-ups can be added until closed. **Must be reviewed by a PI before closing** (BR-7).
- Every change appears in the event's change history.

---

### Phase 5 — Data quality & compliance: Data Queries, Audit Logs 🟡

**Contains:** `src/modules/data-queries/`, `src/modules/audit-logs/`

*Data queries* (unique ID `Q-0001`)
```
Raise (PI / CRA / Data Manager) ─► Open ─► Respond (PI / Coordinator) ─► Answered ─► Close (CRA / Data Manager) ─► Closed
                                     ▲                                       │
                                     └────────────── Reopen (with message) ──┘
```
- Raised on a participant, enrollment, visit, assessment or adverse event; optional field name, priority, assignee.
- Every message is kept in a thread. The assignee and raiser are notified.

*Audit logs* (read-only — Admin, CRA, Data Manager)
- Records sign-ins (including failed and locked), sign-outs, and every create/update/status change with **old → new values**,
  user, timestamp and IP. Entries cannot be edited or deleted.

---

### Phase 6 — Insights & alerts: Dashboard, Reports, Notifications 🟡

**Contains:** `src/modules/dashboard/`, `src/modules/reports/`, `src/shared/layout/NotificationBell.jsx`

- **Dashboard:** totals (trials, participants, visits today/overdue, open AEs/SAEs), enrollment vs target per active trial,
  enrollments per month (6 months), upcoming visits (14 days), participant pipeline, **your pending tasks** by role, recent activity.
- **Reports:** Trial summary, Enrollment, Screening failures & withdrawals, Visit completion, Adverse events, Trial progress —
  filter by trial and date range, export to **Excel** and **PDF**.
- **Notifications:** bell in the top bar, refreshed every 60 s. Stored notifications (added to trial, status change,
  SAE reported, query assigned/answered, protocol amended) plus live alerts (overdue visits, visits in next 3 days,
  queries waiting for you, AEs awaiting PI review).

---

### Phase 7 — Hardening & release ⬜

Planned work:
- Real backend for Phases 2–6 (or extend the demo-mode API) using the same endpoints.
- Move the session token from `localStorage` to a secure HTTP-only cookie.
- Email delivery for password reset and SAE alerts.
- Automated tests (unit + end-to-end), accessibility review, performance (< 3 s page load, SRD §5.1).
- Production build & deployment, backups and recovery (SRD §5.3).

---

## 4. SRD business rules → where they are enforced

| Rule | Description | Enforced in |
|---|---|---|
| BR-1 | Unique trial ID | Trial creation (`TRL-xxxx`) |
| BR-2 | Unique participant ID | Participant registration (`PT-xxxxx`) |
| BR-3 | Enroll only into an Active trial | Start screening and Enroll |
| BR-4 | Informed consent before trial procedures | Enroll; record assessment |
| BR-5 | Eligibility criteria satisfied | Enroll (Eligible required) |
| BR-6 | Visit belongs to a valid enrollment | Visit scheduling |
| BR-7 | AEs reviewed by authorized personnel | AE close requires PI review |
| BR-8 | Finalized records not silently overwritten | Assessment corrections need a reason |
| BR-9 | Only authorized users see confidential data | Role permissions on every page and API call |
| BR-10 | Withdrawn participants keep their records | Withdraw keeps data read-only |

---

## 5. Folder map

```
patien onboarding/
├── PROJECT_PHASES.md              ← this file
├── SOFTWARE REQUIREMENTS DOCUMENT.pdf
├── stitch-export/                 original Stitch designs (reference)
├── backend/                       FastAPI → MongoDB Atlas (Phases 0–1)
│   ├── .env                       Atlas URI + JWT secret (git-ignored)
│   ├── create_admin.py            create the first administrator
│   └── app/
│       ├── main.py                app, CORS, health check, "later phase" (501) fallback
│       ├── core/                  config, database (indexes), security, permissions
│       ├── routers/               auth.py, users.py, shell.py (notifications, dashboard placeholder)
│       ├── services.py            sessions, audit log, notifications
│       └── deps.py                auth / permission checks
└── ctms-frontend/
    ├── .env.development           VITE_USE_MOCK=true (demo mode)
    ├── public/                    favicon.svg, logo.png (add licensed logo here)
    └── src/
        ├── app/                   App.jsx (routes), modules.js (module registry)
        ├── shared/
        │   ├── api/               client.js, errors.js, mock/ (demo-mode API)
        │   ├── auth/              permissions.js (role matrix)
        │   ├── components/        BrandLogo, ErrorBoundary, NotFound, Pickers, ReasonModal
        │   ├── hooks/             useApi, useList, useSubmit, usePermission
        │   ├── layout/            AppLayout, SideNavBar, TopNavBar, UserMenu, NotificationBell
        │   ├── ui/                Button, DataTable, Form, Modal, StatusBadge, Toast, Layout
        │   └── utils/             format.js, user.js
        └── modules/
            ├── auth/              Phase 1
            ├── user-management/   Phase 1
            ├── trials/            Phase 2
            ├── documents/         Phase 2
            ├── participants/      Phase 3
            ├── enrollment/        Phase 3
            ├── visits/            Phase 4
            ├── assessments/       Phase 4
            ├── adverse-events/    Phase 4
            ├── data-queries/      Phase 5
            ├── audit-logs/        Phase 5
            ├── dashboard/         Phase 6
            └── reports/           Phase 6
```
