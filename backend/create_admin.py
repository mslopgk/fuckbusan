
from sqlalchemy.orm import Session
from database import SessionLocal
import models
import utils
import sys

def create_admin():
    db = SessionLocal()
    try:
        email = "admin@test.com"
        username = "testadmin"
        password = "adminpassword123"
        
        # Check if exists
        existing = db.query(models.LegacyUser).filter(models.LegacyUser.email == email).first()
        if existing:
            print("Admin user already exists.")
            return

        hashed = utils.get_password_hash(password)
        user = models.LegacyUser(email=email, username=username, hashed_password=hashed)
        db.add(user)
        db.commit()
        print(f"Created admin user: {email} / {password}")
    except Exception as e:
        print(f"Error creating user: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_admin()
