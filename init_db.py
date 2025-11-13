"""
Database initialization script for Azure deployment
Run this once after deploying to create all tables
"""
from database import engine
import models

def init_db():
    """Create all database tables"""
    print("Creating database tables...")
    models.Base.metadata.create_all(bind=engine)
    print("✓ Database initialized successfully!")

def create_admin_user():
    """Create a default admin user (optional)"""
    from database import SessionLocal
    from auth import hash_password

    db = SessionLocal()
    try:
        # Check if admin already exists
        existing_admin = db.query(models.Admin).filter(
            models.Admin.username == "admin"
        ).first()

        if existing_admin:
            print("Admin user already exists")
            return

        admin = models.Admin(
            username="admin",
            password_hash=hash_password("ChangeThisPassword123!"),
            full_name="System Administrator",
            email="admin@example.com"
        )
        db.add(admin)
        db.commit()
        print("✓ Admin user created!")
        print("  Username: admin")
        print("  Password: ChangeThisPassword123!")
        print("  ⚠️  PLEASE CHANGE THIS PASSWORD IMMEDIATELY!")
    except Exception as e:
        print(f"Error creating admin user: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_db()

    # Uncomment to create admin user on first run
    # create_admin_user()
