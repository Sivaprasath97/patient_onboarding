"""Create a System Administrator (admins can't self-register).

Interactive:      .venv\\Scripts\\python create_admin.py
Non-interactive:  .venv\\Scripts\\python create_admin.py --name "Asha Admin" --email admin@example.com --password "..."
"""
import argparse
import getpass
import sys

from pymongo.errors import DuplicateKeyError

from app.core.database import get_db, init_indexes
from app.core.security import hash_password, now, password_problem


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--name")
    p.add_argument("--email")
    p.add_argument("--password")
    a = p.parse_args()
    name = a.name or input("Full name: ").strip()
    email = (a.email or input("Email: ")).strip().lower()
    password = a.password or getpass.getpass("Password (min 8 chars, letters + numbers): ")
    problem = password_problem(password)
    if len(name) < 2 or "@" not in email or problem:
        sys.exit(f"Invalid input. {problem or 'Name and a valid email are required.'}")
    init_indexes()
    ts = now()
    try:
        get_db().users.insert_one({"full_name": name, "email": email, "password_hash": hash_password(password), "role": "admin",
                                   "phone": None, "site": None, "is_active": True, "failed_attempts": 0, "locked_until": None,
                                   "created_at": ts, "updated_at": ts, "last_login_at": None})
    except DuplicateKeyError:
        sys.exit("An account with this email already exists.")
    print(f"Administrator created: {email}")


if __name__ == "__main__":
    main()
