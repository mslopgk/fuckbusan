---
name: 부산 BDP 개발 서버 기동 노트
description: 프론트/백엔드 dev 서버 실행 관련 — uvicorn PATH 미등록, 누락 패키지, admin 로그인 단축키
type: reference
originSessionId: 2220fb64-6c4a-48d7-9adc-a9a6b3d7886a
---
# 프론트
- `npm run dev` (포트 8501)

# 백엔드
- `cd backend && python3 -m uvicorn main:app --host 0.0.0.0 --port 8000` (포트 8000)
- `uvicorn` 단독 명령은 PATH 미등록이라 안 먹음 → `python3 -m uvicorn` 사용
- 의존성: `boto3` (S3 업로드), `mangum` (Lambda 어댑터). 둘 다 `requirements.txt`에 누락 가능성 — 필요 시 `pip3 install boto3 mangum`

# Admin 로그인 단축키 (dev only)
- `LoginNew.jsx`에 하드코딩된 단축 인증: `admin / admin1234` → 즉시 `adminMain` 진입 (실제 백엔드 로그인 우회)
- 실 계정: `admin@test.com / adminpassword123` (`backend/create_admin.py`에 정의, DB에 시드돼있어야 함)

# Verify 자동 캡처
- `verify/_dev/admin_capture.mjs` — admin 로그인 후 adminMain + surveyEditor 캡처
- `verify/_dev/survey_results_repro.mjs` — mSurveyResults 흰화면 버그 재현 시도용 (현재 환경에선 재현 안 됨)
