from sqlalchemy import create_engine, text
from backend.database import SQLALCHEMY_DATABASE_URL

engine = create_engine(SQLALCHEMY_DATABASE_URL)

with engine.connect() as conn:
    conn.execute(text("DROP TABLE IF EXISTS users"))
    conn.commit()
    print("Dropped table 'users'. Restart backend to recreate it.")
