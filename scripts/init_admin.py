import os
import sys
import getpass

# Add backend directory to sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.core.database import SessionLocal, Base, engine
from app.core.security import get_password_hash
from app.models.models import User
from app.services.services import AuditService

def init_admin():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        admin_email = os.environ.get("ADMIN_EMAIL")
        admin_pass = os.environ.get("ADMIN_PASSWORD")
        admin_name = os.environ.get("ADMIN_NAME", "System Administrator")

        if not admin_email or not admin_pass:
            print("=== Safe Administrator Account Initialization ===")
            admin_email = input("Enter Administrator Email: ").strip()
            admin_name = input("Enter Full Name: ").strip() or "Administrator"
            admin_pass = getpass.getpass("Enter Administrator Password (min 8 chars): ").strip()

        if len(admin_pass) < 6:
            print("Error: Password must be at least 6 characters.")
            return

        existing = db.query(User).filter(User.email == admin_email).first()
        if existing:
            print(f"User {admin_email} already exists. Updating to Administrator role.")
            existing.role = "Admin"
            existing.hashed_password = get_password_hash(admin_pass)
            db.commit()
            print("Administrator account updated successfully.")
            return

        user = User(
            email=admin_email,
            full_name=admin_name,
            hashed_password=get_password_hash(admin_pass),
            role="Admin",
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        AuditService.log(db, "ADMIN_INITIALIZED", "User", str(user.id), user_id=user.id, details={"email": user.email})
        print(f"[SUCCESS] Administrator '{admin_email}' successfully initialized.")
    finally:
        db.close()

if __name__ == "__main__":
    init_admin()
