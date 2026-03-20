import pymysql
import sys

# database.py 설정값과 동일하게 설정
DB_ID = "root"
DB_PW = "1234"
DB_HOST = "127.0.0.1"
DB_PORT = 3306
DB_NAME = "mydata"

def check_db():
    try:
        conn = pymysql.connect(
            host=DB_HOST,
            user=DB_ID,
            password=DB_PW,
            port=DB_PORT,
            charset='utf8mb4'
        )
        cursor = conn.cursor()
        
        # 1. DB 존재 여부 확인
        cursor.execute(f"SHOW DATABASES LIKE '{DB_NAME}';")
        if not cursor.fetchone():
            print(f"❌ 오류: '{DB_NAME}' 데이터베이스가 존재하지 않습니다.")
            print(f"HeidiSQL에서 '{DB_NAME}' 데이터베이스를 먼저 생성해 주세요.")
            return

        conn.select_db(DB_NAME)
        print(f"✅ MariaDB 연결 성공! (DB: {DB_NAME})")

        # 2. 테이블 목록 조회
        cursor.execute("SHOW TABLES;")
        tables = cursor.fetchall()
        
        print(f"\n--- {DB_NAME} 테이블 목록 ---")
        if not tables:
            print("현재 생성된 테이블이 없습니다. 백엔드 서버를 한 번 실행해 주세요.")
        else:
            for table in tables:
                table_name = table[0]
                print(f"\n[테이블: {table_name}]")
                
                # 컬럼 정보 조회
                cursor.execute(f"DESCRIBE {table_name};")
                columns = cursor.fetchall()
                for col in columns:
                    # col: (Field, Type, Null, Key, Default, Extra)
                    print(f"  - {col[0]} ({col[1]})")
            
        conn.close()
    except Exception as e:
        print(f"❌ 연결 오류: {e}")
        print("HeidiSQL이나 MariaDB 서비스가 실행 중인지 확인해 주세요.")

if __name__ == "__main__":
    check_db()
