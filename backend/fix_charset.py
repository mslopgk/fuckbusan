import pymysql
import sys

# database.py에서 정보를 가져오는 대신 직접 입력 (속도 및 확실성)
DB_ID = "root"
DB_PW = "1234"
DB_HOST = "127.0.0.1"
DB_PORT = 3306
DB_NAME = "mydata"

def fix_charset():
    print("MariaDB 인코딩 수정을 시작합니다...")
    try:
        conn = pymysql.connect(
            host=DB_HOST,
            user=DB_ID,
            password=DB_PW,
            port=DB_PORT,
            charset='utf8mb4'
        )
        cursor = conn.cursor()
        
        # 1. 데이터베이스 인코딩 변경
        print(f"1. 데이터베이스 [{DB_NAME}] 인코딩 변경...")
        cursor.execute(f"ALTER DATABASE {DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
        
        # 2. 해당 데이터베이스 선택
        cursor.execute(f"USE {DB_NAME}")
        
        # 3. 테이블 인코딩 강제 변환 (CONVERT TO)
        tables = ["new_proposals", "users", "checklist", "checklist_result", "reports", "suggestions"]
        for table in tables:
            print(f"2. 테이블 [{table}] 인코딩 강제 변환 중...")
            try:
                cursor.execute(f"ALTER TABLE {table} CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
            except Exception as e:
                print(f"   - {table} 테이블 변환 건너뜀 (존재하지 않거나 오류): {e}")
        
        conn.commit()
        print("✅ 모든 인코딩 수정이 완료되었습니다!")
        
    except Exception as e:
        print(f"❌ 치명적 오류 발생: {e}")
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    fix_charset()
