---
name: project-full-figma-sweep-202607
description: 2026-07-17~18 모바일 8섹션+어드민 5영역 Figma 전수 정합 + 4팀 전수검증 완료 상태와 잔여 P2 백로그
metadata: 
  node_type: memory
  type: project
  originSessionId: f0c66c2c-a052-4dbf-b4f3-c6f052084f74
---

2026-07-17~18에 WDC 파일 기준 전수 정합 완료 (전부 seungmo 브랜치 커밋):
- 모바일 8섹션: 설문 28a1a3c, 홈 7b93335, 로그인 24003f9, 공공데이터(신규 MPublicData) b6ca182, 진단 7a4ec40, 나의활동 cf7ec68, 가상시민 be702db, 제보/제안 21e25c4 (+MLocationPicker 신규)
- 어드민 5영역 (관리자 캔버스 **263:2627**, TalkToFigma 노드ID로 타 페이지 접근 가능): 설문 e026b05, 제보/제안 1b9840d, 진단(기록상세 신규) 5555b75, 회원관리+공용셸 08f5548, 공공데이터/가상시민 879882e
- 전역 폰트: h1~h6 GmarketSans → Pretendard Variable 전면 통일 78d7aaa (Figma 실측: Gmarket은 M진단 소형 라벨 3개뿐)
- 지도 컨트롤바 전 페이지 Figma 노드 export 통일 6230e8a (에셋 /figma-assets/icons/pubd-toolbar/, 제보/제안 accent #f74e7e, person 버튼은 가상시민만)
- 4팀 전수검증(모바일/PC/어드민/verify+API): 전부 PASS, P0/P1 제로 (PC 헤더 겹침 1건만 발견 즉시 수정 35e0ead)

잔여 P2 백로그 (다음 세션 후보):
- 페르소나 3명(id 35/36/42) 다국어 오염 — ANTHROPIC_API_KEY로 재생성 필요
- 진단 데이터 494/500건이 '부산역' 쏠림 (구역 필터 대부분 0건)
- MDiagnosisResult recharts 0-size 경고 (minHeight로 해소 가능)
- MDiagnosisMap 초기 뷰 핀 평균점 이동으로 핀 가시성 낮음
- admin RAG 대시보드 UI 진입점 부재 (시드로만 접근)
- src/admin/components/dashboard/ 5개 파일 lucide-react 잔존
- verify/api.mjs가 expectBody 미평가 (장식용)
- Figma 오명명: 302:28533 "설문>결과"가 실제론 진단 화면 — 디자이너 확인 필요
- 배포(수요일 실사 전): 운영서버 반영 + survey_chat_settings 마이그레이션 + 프로덕션 키 + 카카오맵 배포 도메인 등록
