import sqlite3
import os

DB_PATH = "sql_app_v2.db"

def fix_schema():
    if not os.path.exists(DB_PATH):
        print("DB file not found.")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # 0. Drop conflicting index if exists
    try:
        cursor.execute("DROP INDEX IF EXISTS ix_users_ID")
        print("Dropped ix_users_ID index if it existed.")
    except Exception as e:
        print(f"Error dropping index ix_users_ID: {e}")

    # 1. Rename 'users' to 'legacy_users' if it looks like the old schema
    try:
        # Check columns in users
        cursor.execute("PRAGMA table_info(users)")
        columns = [info[1] for info in cursor.fetchall()]
        print(f"Columns in users: {columns}")
        
        if "email" in columns and "username" in columns and "ID" not in columns:
            print("Detected old users schema. Renaming to legacy_users...")
            cursor.execute("ALTER TABLE users RENAME TO legacy_users")
            print("Renamed users to legacy_users.")
        else:
            print("Table 'users' does not match old schema or does not exist.")
            
    except Exception as e:
        print(f"Error checking/renaming users table: {e}")

    # 2. Add columns to district_insights
    columns_to_add = [
        ("latitude", "FLOAT"),
        ("longitude", "FLOAT"),
        ("category", "VARCHAR")
    ]
    
    for col_name, col_type in columns_to_add:
        try:
            cursor.execute(f"ALTER TABLE district_insights ADD COLUMN {col_name} {col_type}")
            print(f"Added {col_name} column to district_insights")
        except Exception as e:
            if "duplicate column" in str(e).lower() or "no such table" in str(e).lower():
                print(f"Skipped {col_name}: {e}")
            else:
                 print(f"Error adding {col_name}: {e}")

    conn.commit()
    conn.close()

if __name__ == "__main__":
    fix_schema()
