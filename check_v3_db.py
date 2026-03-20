import sqlite3

def check_db():
    db_path = "backend/sql_app_v3.db"
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # 전체 테이블 목록 조회
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        
        print(f"\n--- {db_path} 테이블 목록 ---")
        for table in tables:
            table_name = table[0]
            print(f"\n[테이블: {table_name}]")
            
            # 컬럼 정보 조회
            cursor.execute(f"PRAGMA table_info({table_name});")
            columns = cursor.fetchall()
            for col in columns:
                # col: (id, name, type, notnull, default_value, pk)
                print(f"  - {col[1]} ({col[2]})")
            
            # 데이터 개수 확인
            cursor.execute(f"SELECT COUNT(*) FROM {table_name};")
            count = cursor.fetchone()[0]
            print(f"  (데이터 개수: {count}개)")
            
        conn.close()
    except Exception as e:
        print(f"오류 발생: {e}")
        print("백엔드 서버를 한 번 실행하여 DB 파일이 생성되었는지 확인해 주세요.")

if __name__ == "__main__":
    check_db()
