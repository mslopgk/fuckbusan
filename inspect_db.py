from sqlalchemy import create_engine, inspect
from backend.database import SQLALCHEMY_DATABASE_URL

# Fix URL for script execution context (if needed, but usually fine)
if "sqlite" in SQLALCHEMY_DATABASE_URL:
    # Ensure path is correct relative to execution
    # But usually backend.database has absolute path or relative?
    # backend/database.py uses "./sql_app_v2.db". 
    # If running from root, it works.
    pass

engine = create_engine(SQLALCHEMY_DATABASE_URL)
insp = inspect(engine)

print("Tables:", insp.get_table_names())
if "users" in insp.get_table_names():
    print("\nColumns in 'users' table:")
    for col in insp.get_columns("users"):
        print(f" - {col['name']} ({col['type']})")
else:
    print("Table 'users' does not exist.")
