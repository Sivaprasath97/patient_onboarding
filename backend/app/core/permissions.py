"""Role -> permission matrix (SRD §3). Must match ctms-frontend/src/shared/auth/permissions.js."""
from typing import List

ROLES = {
    "admin": "System Administrator",
    "principal_investigator": "Principal Investigator",
    "research_coordinator": "Research Coordinator",
    "cra": "Clinical Research Associate",
    "data_manager": "Data Manager",
}
SELF_REGISTER_ROLES = [r for r in ROLES if r != "admin"]

A, PI, RC, CRA, DM = "admin", "principal_investigator", "research_coordinator", "cra", "data_manager"
ALL = [A, PI, RC, CRA, DM]
CLINICAL = [PI, RC, CRA, DM]

PERMISSIONS = {
    "users:manage": [A],
    "trials:read": ALL,
    "trials:write": [A, PI],
    "protocols:write": [A, PI],
    "deviations:write": [PI, RC, CRA],
    "participants:read": ALL,
    "participants:write": [PI, RC],
    "enrollment:write": [PI, RC],
    "visits:read": ALL,
    "visits:write": [PI, RC],
    "assessments:read": CLINICAL,
    "assessments:write": [PI, RC],
    "assessments:finalize": [PI],
    "ae:read": ALL,
    "ae:write": [PI, RC],
    "ae:review": [PI],
    "queries:read": ALL,
    "queries:raise": [PI, CRA, DM],
    "queries:respond": [PI, RC],
    "queries:close": [CRA, DM],
    "documents:read": ALL,
    "documents:write": [A, PI, RC, CRA],
    "reports:read": ALL,
    "audit:read": [A, CRA, DM],
}


def has_permission(role: str, perm: str) -> bool:
    return role in PERMISSIONS.get(perm, [])


def permissions_for(role: str) -> List[str]:
    return sorted(p for p, roles in PERMISSIONS.items() if role in roles)
