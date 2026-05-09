import csv
import pymysql
from datetime import datetime

CSV_PATH = '/Users/Kang/Desktop/fuckbusan/제목 없음/users_rows.csv'

DB = dict(host='127.0.0.1', port=3306, user='busan', password='busanpw',
          db='busan_design_db', charset='utf8mb4')


def parse_dt(s):
    if not s or not s.strip():
        return None
    s = s.strip()
    for fmt in ('%Y-%m-%d %H:%M:%S.%f', '%Y-%m-%d %H:%M:%S', '%Y-%m-%d'):
        try:
            return datetime.strptime(s[:len(fmt.replace('%f', '000000'))], fmt)
        except Exception:
            pass
    try:
        return datetime.strptime(s[:19], '%Y-%m-%d %H:%M:%S')
    except Exception:
        return None


conn = pymysql.connect(**DB)
cur = conn.cursor()

# Step 1: delete dependent rows for non-admin users, then delete users
# Get non-admin user IDs first
cur.execute("SELECT user_id FROM users WHERE ID != 'admin' AND district_code != 'admin'")
non_admin_ids = [r[0] for r in cur.fetchall()]
print(f'Non-admin users to remove: {len(non_admin_ids)}')

if non_admin_ids:
    ids_sql = ','.join(str(i) for i in non_admin_ids)
    # Clear dependent tables
    for tbl, col in [
        ('activity_logs', 'user_id'),
        ('checklist_result', 'user_id'),
        ('notifications', 'user_id'),
        ('notifications', 'actor_id'),
        ('proposal_likes', 'user_id'),
        ('proposal_views', 'user_id'),
        ('proposal_comments', 'user_id'),
        ('report_likes', 'user_id'),
        ('report_comments', 'user_id'),
        ('survey_responses', 'user_id'),
        ('reports', 'user_id'),
        ('new_proposals', 'user_id'),
        ('surveys', 'created_by'),
    ]:
        try:
            cur.execute(f"DELETE FROM {tbl} WHERE {col} IN ({ids_sql})")
            print(f'  Cleared {tbl}.{col}: {cur.rowcount} rows')
        except Exception as e:
            print(f'  SKIP {tbl}.{col}: {e}')
    conn.commit()
    cur.execute("DELETE FROM users WHERE ID != 'admin' AND district_code != 'admin'")
    deleted = cur.rowcount
    conn.commit()
    print(f'Deleted {deleted} existing non-admin users')
else:
    deleted = 0
    print('No non-admin users to delete')

# Step 2: read CSV
with open(CSV_PATH, encoding='utf-8-sig') as f:
    rows = list(csv.DictReader(f))

active = [r for r in rows if not r.get('deleted_at', '').strip()]
print(f'Active users in CSV: {len(active)} (skipping {len(rows) - len(active)} deleted)')

ok = 0
skip = 0
errors = 0

SQL = """
INSERT INTO users (ID, PW, name, nickname, birth_date, created_at, district_code)
VALUES (%s, %s, %s, %s, %s, %s, %s)
ON DUPLICATE KEY UPDATE name=VALUES(name), PW=VALUES(PW), district_code=VALUES(district_code)
"""

for r in active:
    uid = r.get('id', '').strip()
    name = r.get('name', '').strip()

    # skip admin rows
    if uid == 'admin' or name == '관리자':
        skip += 1
        continue

    pw = r.get('pw', '').strip()
    birthday = r.get('birthday', '').strip()
    created_raw = r.get('created_at', '').strip()
    created_dt = parse_dt(created_raw)
    user_type = r.get('type', '2').strip()
    district = 'expert' if user_type == '1' else 'general'

    addr = r.get('address_1', '').strip()
    nickname = addr if addr else None

    try:
        cur.execute(SQL, (uid, pw, name, nickname, birthday or None, created_dt, district))
        ok += 1
    except Exception as e:
        print(f'  ERROR row id={uid}: {e}')
        errors += 1

conn.commit()

cur.execute('SELECT COUNT(*) FROM users')
total = cur.fetchone()[0]
cur.close()
conn.close()

print(f'\nDone: inserted/updated={ok}, skipped={skip}, errors={errors}')
print(f'Total users in DB now: {total}')
