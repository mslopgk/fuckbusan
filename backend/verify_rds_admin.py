import os
import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from passlib.context import CryptContext

load_dotenv()

DB_HOST = os.getenv("DB_HOST")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_PORT = os.getenv("DB_PORT", "3306")

SQLALCHEMY_DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset=utf8mb4"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

admin_id = "admin"
admin_pw = "1234"

with open("verify_result.txt", "w") as f:
    try:
        with engine.connect() as conn:
            query = text("SELECT ID, PW FROM users WHERE ID = :id")
            row = conn.execute(query, {"id": admin_id}).fetchone()
            
            if row:
                db_id, db_pw = row
                is_valid = pwd_context.verify(admin_pw, db_pw)
                f.write(f"User Found: {db_id}\n")
                f.write(f"Password Verify Result: {is_valid}\n")
                f.write(f"Hash in DB: {db_pw}\n")
            else:
                f.write(f"User '{admin_id}' NOT found in RDS.\n")
    except Exception as e:
        f.write(f"Error: {e}\n")

print("Result written to verify_result.txt")
