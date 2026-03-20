import sys
import os
import json

# Add project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

try:
    from backend.database import SessionLocal
    from backend import models
    from datetime import datetime
except ImportError as e:
    print(f"Error importing modules: {e}")
    sys.exit(1)

def insert_mock_proposals():
    db = SessionLocal()
    try:
        # Get a few users to assign as authors
        users = db.query(models.User).limit(3).all()
        if not users:
            print("No users found in DB. Please create at least one user first.")
            return

        mock_data = [
            {
                "category": "주거",
                "title": "전봇대 불이 나갔어요",
                "content": "동래구 우리디자이너... 빠른 조치가 필요하네요. 전봇대가 꺼져서 밤길이 너무 어두워요. 빨리 고쳐주세요!",
                "region": "동래구",
                "detailed_address": "사직동 123-45",
                "files": json.dumps(["done.svg"]), # Existing icon as placeholder
                "user_id": users[len(users)-1].user_id # Last user
            },
            {
                "category": "환경",
                "title": "공원 쓰레기통이 부족해요",
                "content": "시민공원 산책로에 쓰레기통이 너무 멀리 떨어져 있어서 사람들이 바닥에 쓰레기를 버립니다. 추가 설치가 시급합니다.",
                "region": "부산진구",
                "detailed_address": "부산시민공원 남문 인근",
                "files": json.dumps(["file.svg"]),
                "user_id": users[0].user_id
            },
            {
                "category": "교통",
                "title": "스마트 버스 쉘터 설치 제안",
                "content": "여름에는 시원하고 겨울에는 따뜻한 스마트 쉘터가 우리 동네에도 생겼으면 좋겠습니다. 어르신들이 많이 이용하시는 정류장 위주로 검토 바랍니다.",
                "region": "금정구",
                "detailed_address": "부산대 정문 버스 정류장",
                "files": json.dumps(["WDC.svg"]),
                "user_id": users[min(1, len(users)-1)].user_id
            }
        ]

        for data in mock_data:
            proposal = models.NewProposal(
                category=data["category"],
                title=data["title"],
                content=data["content"],
                region=data["region"],
                detailed_address=data["detailed_address"],
                files=data["files"],
                user_id=data["user_id"],
                created_at=datetime.utcnow()
            )
            db.add(proposal)
        
        db.commit()
        print(f"Successfully inserted {len(mock_data)} mock proposals.")
    except Exception as e:
        db.rollback()
        print(f"Error during insertion: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    insert_mock_proposals()
