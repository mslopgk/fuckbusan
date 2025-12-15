import sys
import os
from sqlalchemy import text
from datetime import datetime

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

try:
    from database import SessionLocal
    import models
    import utils
except ImportError:
    print("Error importing SessionLocal/models/utils")
    sys.exit(1)

def seed():
    db = SessionLocal()
    
    # Admin User
    email = "admin@busan.go.kr"
    password = "Busan2026!"
    username = "Admin User"
    
    print("Seeding Admin User...")
    try:
        # Check existence
        exists = db.query(models.LegacyUser).filter_by(email=email).first()
        if not exists:
            hashed_password = utils.get_password_hash(password)
            new_user = models.LegacyUser(
                email=email,
                hashed_password=hashed_password,
                username=username,
                is_active=True
            )
            db.add(new_user)
            db.commit()
            print(f"Success! Created user: {email}")
        else:
            print(f"User {email} already exists.")
            
    except Exception as e:
        print(f"Error seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()
