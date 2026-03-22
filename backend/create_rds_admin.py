import os
import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from passlib.context import CryptContext

# Add current dir to path to import local modules if needed
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

load_dotenv()

DB_HOST = os.getenv("DB_HOST")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_PORT = os.getenv("DB_PORT", "3306")

if not all([DB_HOST, DB_NAME, DB_USER, DB_PASSWORD]):
    print("Error: RDS credentials missing in .env")
    sys.exit(1)

SQLALCHEMY_DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset=utf8mb4"
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Match the hashing scheme in user_router.py
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

admin_id = "admin"
admin_pw = "1234"
hashed_pw = pwd_context.hash(admin_pw)

try:
    with engine.connect() as conn:
        # Check if exists
        query = text("SELECT * FROM users WHERE ID = :id")
        result = conn.execute(query, {"id": admin_id}).fetchone()
        
        if result:
            print(f"User '{admin_id}' already exists in the RDS database.")
            # Update password just in case it was different
            update_query = text("UPDATE users SET PW = :pw WHERE ID = :id")
            conn.execute(update_query, {"id": admin_id, "pw": hashed_pw})
            conn.commit()
            print(f"Password for '{admin_id}' has been updated to '1234'.")
        else:
            insert_query = text("INSERT INTO users (ID, PW, name, nickname, district_code) VALUES (:id, :pw, :name, :nickname, :dist)")
            conn.execute(
                insert_query, 
                {"id": admin_id, "pw": hashed_pw, "name": "관리자", "nickname": "관리자", "dist": "admin"}
            )
            conn.commit()
            print(f"User '{admin_id}' ('1234') created successfully on RDS database.")
except Exception as e:
    print(f"An error occurred: {e}")
