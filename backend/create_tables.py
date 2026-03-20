import models
from database import engine

def create_tables():
    print("MariaDB에 테이블 생성을 시작합니다...")
    try:
        models.Base.metadata.create_all(bind=engine)
        print("✅ 테이블 생성이 완료되었습니다!")
    except Exception as e:
        print(f"❌ 오류 발생: {e}")

if __name__ == "__main__":
    create_tables()
