"""Seed predefined user accounts. Run: python -m app.db.seed"""
from sqlalchemy import select

from app import models  # noqa: ensure all models registered
from app.core.security import get_password_hash
from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models.user import User

PREDEFINED_USERS = [
    {
        "username": "admin",
        "email": "admin@gst.gov.in",
        "full_name": "Senior Officer Sharma",
        "role": "senior_officer",
        "password": "Admin@123",
    },
    {
        "username": "inspector",
        "email": "inspector@gst.gov.in",
        "full_name": "Inspector Raj Kumar",
        "role": "inspection_officer",
        "password": "Inspect@123",
    },
    {
        "username": "taxofficer",
        "email": "taxofficer@gst.gov.in",
        "full_name": "Tax Officer Priya",
        "role": "tax_officer",
        "password": "Tax@123",
    },
]


def seed_users() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        for u in PREDEFINED_USERS:
            existing = db.execute(
                select(User).where(User.username == u["username"])
            ).scalar_one_or_none()
            if not existing:
                db.add(
                    User(
                        username=u["username"],
                        email=u["email"],
                        full_name=u["full_name"],
                        role=u["role"],
                        hashed_password=get_password_hash(u["password"]),
                        is_active=True,
                    )
                )
                print(f"  Created user: {u['username']} ({u['role']})")
            else:
                print(f"  Skipped (exists): {u['username']}")
        db.commit()
        print("Seeding complete.")
    finally:
        db.close()


if __name__ == "__main__":
    seed_users()
