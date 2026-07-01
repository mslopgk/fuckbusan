"""Seed minimal demo data for the admin pages: a few citizens, experts, admins, and reports."""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, engine
import models
from utils import get_password_hash

models.Base.metadata.create_all(bind=engine)

CITIZENS = [
    ("kim_citizen1", "김시민", "kim1", "010-1111-2222", "general"),
    ("park_citizen2", "박시민", "park2", "010-2222-3333", "general"),
    ("lee_citizen3", "이시민", "lee3", "010-3333-4444", "general"),
]
EXPERTS = [
    ("expert_choi1", "최전문", "choi1", "010-4444-5555", "expert"),
    ("expert_jung2", "정전문", "jung2", "010-5555-6666", "expert"),
]
ADMINS = [
    ("admin_kang1", "강관리", "kang1", "010-7777-8888", "admin"),
    ("admin_oh2", "오관리", "oh2", "010-8888-9999", "admin"),
]
REPORTS = [
    ("교통", "금정구", "전기자전거 재고 불균형 해결 제안",
     "지하철역 주변에 자전거가 너무 많이 쌓여있고 외곽은 한 대도 없습니다."),
    ("안전", "해운대구", "야간 골목 가로등 부족",
     "주거지역 골목 조도가 낮아 위험합니다. CCTV/조명 보강 필요."),
    ("교육", "사상구", "초등학교 앞 스쿨존 단속 강화 요청",
     "스쿨존 시간대에도 차량 과속이 잦아 학부모 우려가 큽니다."),
    ("환경", "남구", "공원 쓰레기 무단투기 심각",
     "주말 이후 공원 쓰레기 적치 상태가 심각합니다."),
]


def main():
    db = SessionLocal()
    try:
        for ID, name, nick, phone, code in CITIZENS + EXPERTS + ADMINS:
            existing = db.query(models.User).filter(models.User.ID == ID).first()
            if existing:
                continue
            db.add(models.User(
                ID=ID,
                PW=get_password_hash("password123"),
                name=name,
                nickname=nick,
                phone_num=phone,
                district_code=code,
            ))
        db.commit()

        # Reports — only seed if empty so re-runs don't pile up
        if db.query(models.Report).count() == 0:
            for type_, location, title, content in REPORTS:
                db.add(models.Report(
                    type=type_,
                    location=location,
                    title=title,
                    content=content,
                    files="[]",
                ))
            db.commit()

        print(f"users={db.query(models.User).count()} reports={db.query(models.Report).count()}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
