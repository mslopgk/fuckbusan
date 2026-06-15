# 부산 BDP — 미완료 항목

> **갱신**: 2026-06-10 (14차 — 모바일 전수 Figma diff 재조사)
> **Figma 파일**: 모바일 기준은 **WDC `TCuOzEqNhoLKjhF0reBDks` page 0:1** (모바일 전용 큐레이션). 구파일 `jWpcqQv2jhb2mkzjEs1fuI`은 참고용.
> 완료 항목은 `CHANGES_2026-05-06.md` 참조.

`[ ]` = 미완 / `[?]` = Figma 확인 필요 / 정책결정 대기

---

## 🔴 NEW (2026-06-10) — 모바일 전수 Figma diff 재조사 결과

**상세 명세: `FIGMA_DIFF_SPEC.md`** (28개 모바일 view 캡처 vs WDC 최신 프레임 29개 전수 대조). 요약:

- [ ] **P0 회귀**: 진단 teal→green 회귀 (mDiagnosisDone/List/Result), mProposalForm back "뒤로"·카테고리 라벨 3종 회귀, mMyReportEdit 사진박스·crosshair 레이아웃 깨짐, mMyReportDetail 날짜 누락·본문/배지 위치
- [ ] **P1 구조**: mSurveyDetail2 작성자 기본정보 레이아웃, mDiagnosisList 카드(점수 체계), mSurveyJoin 헤더/Likert/버튼, mProposalDetail 댓글 입력 위치·답글달기·첨부파일 행, mDiagnosisResult 헤더·섹션별 차트 컬러·댓글 버블
- [?] **P2 디자이너 확인**: 제보 카테고리 4 vs 8 (최신 프레임=4, 5/30 확정=8 충돌), mReportForm placeholder·칩 스타일, mAICitizen 말풍선/아바타 상충, 설문 라디오 teal vs 보라, 지도 단건 핀 모양
- ✅ 일치 확인: mSurveyList, mSurveyDone, mProposalList(썸네일 숨김 제외), mProposalMap, mProposalDone, mReportList, mReportDone
- Figma 프레임 부재(비교 불가): home, login, signup, mNotifications, mDiagnosisMap, MyPage/myActivity 허브

## 🔴 NEW (2026-06-10) — PC 전수 Figma diff 조사 결과

**상세 명세: `FIGMA_DIFF_SPEC_PC.md`** (26개 PC view 캡처 vs `hJCPXp7YcYUL60u2NHiYrS` page 0:1 대조). 요약:

- [x] **적용 완료**: 설문 5건(기간 표기/배경/보더박스/Likert 슬라이더/버블차트/완료 단일버튼), 제안 1건(투표 하트 아이콘), 제보 6건(위치 2분할/다중사진/개선완료 배너/결과 모달/수정 버튼/좋아요 스타일) — 빌드+verify 통과
- [ ] **스코프 결정 대기**: PC home = Figma가 사실상 신규 대시보드 스펙(차트/캐러셀/통계카드/아카이브/소식/다크푸터 등 7+섹션) — 픽셀 diff 아님, 구현 여부 정책 결정 필요
- [ ] **백엔드 후속**: 제보 다중사진 영속(`ReportCreate`가 `image_url` 단일), 개선완료 status 데이터
- [ ] **진단/AI가상시민/나의제안 PC 비교 미완**: Figma REST 레이트리밋으로 13프레임 미수신 — 재시도 중
- [?] **디자이너 확인**: USER PC 로그인 admin 스타일 통일 여부, 지도 정렬 라벨, 카테고리 칩 canonical

---

## 🚨 P0 — 라우팅·백엔드 버그

### R2: `newDiagnosis` dead route 🟡
- **파일**: `src/App.jsx`
- [x] dead route 분기 삭제 완료 (2026-05-06)

### R4: `mDiagnosisResult` = `mDiagnosisDetail` 동일 컴포넌트 🟡
- **파일**: `src/App.jsx:1355`
- **현상**: 두 view가 모두 `MDiagnosisResult` 렌더링 — 현재 의도적 공유이나 "상세" vs "결과" 분리 필요 여부 미결
- [?] 정책 결정 대기

### R5: `auth.py` `/auth/signup` dead code 🟡
- [x] `/auth/signup` 엔드포인트 제거 완료 (2026-05-06)

---

## 🔴 P1 — UI 기능 누락

- [ ] **검색 API 연결**: PC 헤더에 검색 UI 자체가 없음. 검색바 UI 설계 후 `GET /api/search` 연결
- [ ] **Home 통계 섹션 활성화**: `Home.jsx:186-273`의 `{false && ...}` 블록. **사용자 결정 대기**
- [x] **구형 컴포넌트 정리**: `Report.jsx`, `ReportForm.jsx` lazy import 및 view 분기 제거 완료 (2026-05-06). `Survey.jsx`/`Diagnosis.jsx`는 진입 경로 있음 — 유지

---

## 🟡 P2 — Figma diff 보류

- [x] **MReportForm 카테고리 4 vs 8개** — WDC Figma `0:454` 기준 8개 확인. 코드 이미 8개로 일치. (2026-05-30)
- [x] **MDiagnosisResult 레이아웃** — 테이블 레이아웃 + 레이더차트 4종으로 전면 재작성 완료 (2026-05-28)

---

## 🔵 제보·제안 — 미완료

### 제보 리스트 (`MReportList.jsx`)
- [x] 카드 좋아요 토글 인터랙션 (2026-05-06): 하트 클릭 시 active/inactive 아이콘 전환 + 낙관적 카운트 업데이트 + API 호출
- [x] Figma 전수조사 완료 (2026-05-28): 전체 레이아웃·카드 구조 일치 확인
- [x] 패널 핸들 텍스트 레이블 숨김 — Figma 기준 핸들바만 표시 (2026-05-30)
- [x] List/Map 분리 후 단독 목록 페이지로 재구조화 — PCMapCanvas·슬라이딩 패널 제거, 단순 scroll 레이아웃 (2026-05-30)
- [x] sub-tag 색상 #FCDAE3→#FFC9C9, 텍스트 #C2456A→#242424, font-size 11→14px — Figma 848:19157 기준 (2026-05-30)
- [x] m-map-btn (지도보기 pill) 상단 헤더에 추가 — 오른쪽에서 mReportMap으로 navigate (2026-05-30)
- [x] brand color 전체 #E6235A→#f74e7e (WDC primary) + Figma Union heart/comment SVG icon 적용 (2026-06-04)
- [x] brand color #f74e7e→#542aa3 (WDC 215:11074 기준 보라) — 카드 좋아요 inline, 지도보기 pill, region 화살표, stage chip, cat chip, FAB, 위치설정/정렬 모달 확인 버튼 (2026-06-13)

### 제보 지도 (`MReportMap.jsx`)
- [x] 2-snap 바텀시트 (peek/half) 정밀 일치화 — sheet border-radius 18→30px, chip wrap 로직 분기 (2026-05-30)
- [x] 검색바 h44→55px, border-radius 8→15px, shadow 일치화 — Figma 848:19015 기준 (2026-05-30)
- [x] peek/half 모드별 칩 flex-wrap 분기 — peek: nowrap 스크롤, half: wrap 2행 (2026-05-30)
- [x] brand color 전체 #E6235A→#f74e7e + Figma Union icon 적용 (2026-06-04)
- [x] 지도 핀 색 통일 — 카테고리별 색 제거 → 전부 #F74E7E (WDC 0:12148 기준) (2026-06-10)
- [x] 지도 핀/accentColor #f74e7e→#542aa3 (WDC 215:10932 기준 보라) + FAB shadow 업데이트 (2026-06-13)
- [x] 내위치 버튼 — 흰 원 FAB → 검정 크로스헤어 24px 단독 아이콘 (WDC 0:12150 기준) (2026-06-10)
- [x] 검색바 placeholder "검색"→"전체" (WDC 0:12251 기준) (2026-06-10)

### 제보 폼 (`MReportForm.jsx`)
- [x] 사진 등록: MReportForm은 이미 구현되어 있었음 확인 (2026-05-21)
- [x] 임시저장에 location/pickedLat/pickedLng 누락 → 추가 완료 (2026-05-21)
- [x] back 버튼 텍스트 "목록으로"→"홈으로" — WDC 0:454 기준 (2026-05-30)
- [x] 타이틀 font-weight 800→700 수정 (Figma font-bold 기준) (2026-05-30)
- [x] 텍스트 입력 placeholder "상세설명을 작성해주세요"→"느끼신 점을 자유롭게 작성해 주세요." — WDC 0:496 기준 (2026-05-30)
- [x] brand color #E6235A→#f74e7e 전체, disabled submit = #ffdde7, focus border = #f74e7e (2026-06-04)
- [x] brand color #f74e7e→#542aa3 (WDC 215:11497, 215:11799 기준) — submit/disabled btn, cat chip active, focus border, error, draft/leave modal btns, loc-picker confirm (2026-06-13)

### 제보 폼 PC (`PCReportForm.jsx`)
- [x] 사진 업로드 API 연결 완료 — POST /api/reports/upload 호출 + image_url payload 포함 (2026-05-21)
- [x] 임시저장 버튼 onClick 구현 — pcReportForm:draft localStorage (2026-05-21)

### 나의 제보 수정 PC (`PCMyReportEdit.jsx`)
- [x] 사진 추가 버튼 dead → file input + POST /api/reports/upload 연결 완료 (2026-05-21)

### 제보 상세 (`MReportDetail.jsx`)
- [?] cat 태그 색상: Figma 상세화면 노랑, 리스트화면 청록 — 일관성 미정, **정책 결정 대기** (현행 CAT_STYLES 유지)
- [x] 이미지 hero: `report.image` → `background-image` 적용 (없으면 그라데이션 fallback 유지)
- [?] 단계바: "결과안내" 외 단계 클릭 가능 여부 미정 (현행: 결과안내만 클릭 가능)
- [x] sub-tag 색상 (상세 topbar): #FCDAE3→#ffc9c9, #C2456A→#242424 — WDC 0:1365 기준 (2026-05-30)
- [x] cat-tag 폰트: detail topbar에서 12px→14px bold — WDC 0:1364 기준 (2026-05-30)
- [x] 단계바 연결자: chevron arrow→horizontal line connector — WDC 0:1372 기준 (2026-05-30)
- [x] 결과 모달 border-radius 16→30px, padding 조정, 제목 20px bold centered — WDC 0:1493/1494 기준 (2026-05-30)
- [x] 결과 이미지 height 130→95px, radius 12→15px — WDC 0:1496 기준 (2026-05-30)
- [x] 담당자 코멘트 레이블 13→18px bold, 날짜 11→16px #737373 — WDC 0:1498/1499 기준 (2026-05-30)
- [x] 결과 본문 텍스트 12→16px — WDC 0:1500 기준 (2026-05-30)
- [x] 답글쓰기 dead button 제거 (2026-05-21)
- [x] author 섹션 2-line 레이아웃으로 수정 — Figma 848:19789 기준 (2026-05-28)
- [x] `created_at` snake_case 필드 매핑 추가 (2026-05-28)
- [x] author 이름 18px medium, sub 14px gray #737373 (Figma 기준) (2026-05-30)
- [x] 작성자-제목 사이 divider line 추가 (Figma 기준) (2026-05-30)
- [x] 지도 미니맵 높이 160px→80px, border-radius 15px, box-shadow 적용 (Figma 848:19789 기준) (2026-05-30)
- [x] brand color #E6235A→#f74e7e 전체 (stage pill active, result btn, like btn, comment send btn, map pin) (2026-06-04)
- [x] body text 14px→16px, Figma Union heart/comment icon 적용, comment send btn override #f74e7e (2026-06-04)
- [x] brand color #f74e7e→#542aa3 전체 (WDC 215:11544 기준) — stage pill active, result btn, like btn active, comment send, map pin, result modal comment label, hover state (2026-06-13)

### 제보 완료 (`MReportDone.jsx`)
- [x] 일러스트 체크 원 위치: 두루마리 상단 overlay → 두루마리 내부 중앙 centered (Figma 848:20468 기준) (2026-05-30)
- [x] 타이틀 font-weight 800→700 (Figma 기준) (2026-05-30)
- [x] 버튼 max-width 291px (Figma 기준) (2026-05-30)
- [x] secondary 버튼 텍스트 색상 #E6235A→#f74e7e (Figma 기준) (2026-05-30)
- [x] 두루마리+체크 일러스트 — WDC Figma 0:647 실제 SVG path로 교체 (2026-05-30)
- [x] primary 버튼 색상 #E6235A→#f74e7e — WDC 0:651 기준 (2026-05-30)
- [x] secondary 버튼 font-size 18→16px semibold — WDC 0:654 기준 (2026-05-30)
- [x] 체크 일러스트 fill #F74E7E→#542aa3 (WDC 215:12118 기준), primary btn #f74e7e→#542aa3, secondary btn bg #ffdde7→rgba(84,42,163,0.2), shadow 업데이트 (2026-06-13)

### 나의 제보 상세 (`MMyReportDetail.jsx`)
- [x] 댓글 작성 UI 추가 — input + 전송 버튼 + POST /api/reports/{id}/comments (2026-05-21)
- [x] 답글쓰기 dead button 제거 (2026-05-21)
- [x] brand color #E6235A→#f74e7e (WDC 전체 일치화) + 피그마 Union heart/comment icon 적용 (2026-06-04)

### 제안 상세 (`MProposalDetail.jsx`)
- [x] cat 태그 색상: catStyles.js 매핑 유지 (Figma variant별 불일치는 정책 결정으로 현행 유지) (2026-06-04)
- [x] topbar padding 0 12px→0 20px — WDC 0:12131 기준 (2026-06-04)
- [x] 이미지 hero: `proposal.image` → `background-image` 적용 (없으면 그라데이션 fallback)
- [ ] 댓글 더 보기 페이지네이션 없음 (Figma `848:18075` long variant) (정책 결정 대기)
- [x] 이미지 표시 수정 — files[0] fallback 추가 (2026-05-21)
- [x] 답글쓰기 dead button 제거 (2026-05-21)
- [x] title font-size → 18px medium (WDC 0:12046) (2026-05-30)
- [x] 첨부파일 표시 스타일 개선 — 이모지 제거, attachment icon + filename (2026-05-30)
- [x] 좌표 텍스트 "📍 위도..." 제거 — Figma에 없는 요소 (2026-05-30)
- [x] 투표 버튼 solid→outlined (border 2px #E6235A, white bg) — WDC 0:12067 기준 (2026-05-30)
- [x] 지도 height 160→80px, border-radius 8→15px, box-shadow 추가 — WDC 0:12062 기준 (2026-05-30)
- [x] cat 태그 topbar 제거 → content 영역 상단(title 위)으로 이동 — WDC 0:12047 기준 (2026-05-30)
- [x] body text 13→16px font-weight 500 — WDC 0:12051 기준 (2026-05-30)
- [x] 투표/댓글 아이콘 checkmark→heart icon + Union comment bubble — WDC 기준 (2026-05-30)
- [x] 댓글 input height 38→41px, border-radius 19→15px — WDC 0:12039 기준 (2026-05-30)
- [x] footer topbar border→box-shadow, padding 조정 — WDC 0:12066 기준 (2026-05-30)
- [x] 투표 플로우 Figma 제안상세1~4 정합화 — 완료 모달("투표가 완료되었습니다", 1.6s 자동닫힘) + 재탭 시 취소 확인 모달("네, 취소할게요"/"아니오, 투표할게요") + 버튼 라벨 "투표하셨습니다" + 투표 시 하트 핑크 (2026-06-10)
- [x] 투표 상태 stale 버그 수정 — 상세 진입 시 GET /proposals/{id}로 has_voted/likes_count/views 동기화 (리스트 prop 의존 제거) (2026-06-10)
- [x] 작성자 색상 #737373→#1e1e1e (Figma 215:13179 text-[#1e1e1e]) (2026-06-13)
- [x] 메타 정보 색상 #888→#1e1e1e, 아이콘 색상 #888→#bfbfbf (Figma 215:13197 기준) (2026-06-13)
- [x] 댓글 내용 font-size 12→16px, color #444→#242424 (Figma 기준) (2026-06-13)
- [x] 답글쓰기 버튼 color #888→#1e1e1e, font-size 11→14px (Figma 215:13182) (2026-06-13)
- [x] 댓글 입력행 margin-left/right -10px (Figma left:10px / w:373px 전체폭 기준) (2026-06-13)
- [x] VoteBallotIcon SVG — Figma Union path 기반 문서 아이콘으로 정확도 향상 (2026-06-13)

### 제안 폼 (`MProposalForm.jsx`)
- [x] 사진 업로드 API 연결 — POST /api/reports/upload 호출 + files/image_url payload (2026-05-21)
- [x] back 버튼 텍스트 "목록으로"→"홈으로" — WDC 0:11948 기준 (2026-05-30)
- [x] 위치정보 아이콘 맵핀 → 크로스헤어 타깃 (Figma TCuOzEqNhoLKjhF0reBDks:0:11900 기준) (2026-05-30)
- [x] 섹션 타이틀 15px→18px semibold — WDC 0:11903/11921/11923 기준 (2026-05-30)
- [x] input/textarea border-radius 10→15px, height 46→55px — WDC 0:11926/11927 기준 (2026-05-30)
- [x] input/textarea font-size 13→16px — WDC 기준 (2026-05-30)
- [x] placeholder 색상 #b0b0b0→#a6a6a6 — WDC 기준 (2026-05-30)
- [x] 임시저장 버튼 width 103px, 작성완료 flex:1 — WDC 0:11944/11945 기준 (2026-05-30)
- [x] 버튼 height 48→59px, border-radius 24→15px — WDC 기준 (2026-05-30)
- [x] 카테고리 레이블 "산업·일자리"→"산업 및 고용", "문화·여가"→"문화 및 레저", "보건·복지"→"보건 및 복지" — WDC 0:11914/11918/11920 기준 (2026-05-30)
- [x] 제목 마침표 복원 "제안해보세요"→"제안해보세요." — WDC 0:13562 확인 (2026-06-04)
- [x] 제목 마침표 재제거 "제안해보세요."→"제안해보세요" — TCuOzEqNhoLKjhF0reBDks 215:13047 최신 프레임에 마침표 없음 (2026-06-13)
- [x] .m-form-submit 중복 CSS 규칙 제거 — background:#ffdde7 덮어쓰기 버그 수정 (2026-06-13)
- [x] 섹션 타이틀 font-weight 700→600 (semibold) — WDC 0:13564 기준 (2026-06-04)
- [x] body padding 8px 24px→20px 20px, topbar padding 16px→20px — WDC offset 기준 (2026-06-04)
- [x] 첨부자료 thumb/add box 64→80px — WDC 0:13609 기준 (2026-06-04)
- [x] 임시저장 버튼 font-weight 800→400, gap 12→10px — WDC 0:13608 기준 (2026-06-04)
- [x] 폼 타이틀 color #1a1a1b→#242424, line-height 1.35→1.4 (2026-06-04)
- ⚠️ 카테고리 레이블 DB 불일치 보류: Figma "산업 및 고용/모빌리티/문화 및 레저/보건 및 복지" vs 코드 "산업·일자리/문화·여가/보건·복지" — DB enum 우선 유지

### 제안 완료 (`MProposalDone.jsx`)
- [x] 일러스트 체크 원 위치: 우하단(-10,-10)→두루마리 위에 오버레이(left=40,top=26) — WDC 0:14119 기준 (2026-05-30)
- [x] 두루마리 일러스트 실제 Figma SVG 경로 데이터로 교체 (TCuOzEqNhoLKjhF0reBDks:0:14117/14119) (2026-05-30)
- [x] title 22→24px, buttons height 52→59px, border-radius 26→15px — WDC 0:14112/14113 기준 (2026-05-30)
- [x] buttons width 291px, gap 10px — WDC 0:14113/14114 기준 (2026-05-30)
- [x] title font-weight 800→700 (bold), secondary button 18px 800→16px 600 — WDC 0:14115/14116 기준 (2026-06-04)
- [x] 일러스트 inline SVG → external SVG 파일 사용 (proposal-done-scroll.svg, proposal-done-check.svg) (2026-06-04)
- [x] Done 페이지 레이아웃 justify-content:center→flex-start+padding-top:25vh (Figma 219px 상단 위치) (2026-06-13)

### 제안 리스트 (`MProposalList.jsx`)
- [x] 페이지 배경색 #ebe5d4 → #fff (Figma 기준 흰 배경) (2026-05-30)
- [x] 패널 핸들 — 리스트 열림 시 레이블 숨김, 핸들바만 최소 노출 (2026-05-30)
- [x] 카테고리 칩 14→16px, height 33px — WDC 0:11500 기준 (2026-05-30)
- [x] 정렬 버튼 14→16px — WDC 0:11471 기준 (2026-05-30)
- [x] 투표 아이콘 checkmark→heart — WDC 기준 (2026-05-30)
- [x] map layer + 슬라이딩 패널 제거 → 단독 standalone 목록 페이지로 재구성 (WDC 0:11429 기준) (2026-05-30)
- [x] cat tag font-size 12→14px, 카드 heart/comment icon → figma-assets/icons 사용 (2026-05-30)
- [x] 지도보기 pill height 36px, font-size 14px, pin icon 사용 (2026-05-30)
- [x] 지역 화살표 circle 22→24px (2026-05-30)
- [x] 정렬 icon → icon_sort_chevron.svg (2026-05-30)
- [x] region btn font-weight 800→700, region row padding 8→14px (2026-06-04)

### 제안 지도 (`MProposalMap.jsx`)
- [x] 정렬(최신/조회/투표) 실제 반영 — useMemo에 sort 로직 추가 (2026-05-21)
- [x] 카드 이미지 빈 div → backgroundImage 설정 (2026-05-21)
- [x] back 버튼 → `mProposalList` 수정 (2026-05-28)
- [x] 카드 투표 아이콘 checkmark→heart — WDC 기준 (2026-05-30)
- [x] 검색바 height 44→55px, border-radius 8→15px, shadow 0 0 10px rgba(0,0,0,0.25) — WDC 0:11857 기준 (2026-05-30)
- [x] 검색바 placeholder "검색", back 버튼 제거 (WDC 0:11858 기준) (2026-05-30)
- [x] 시트 border-radius 18→30px — WDC 0:11786 기준 (2026-05-30)
- [x] 시트 region 버튼 font-size 18→22px bold — WDC 0:11860 기준 (2026-05-30)
- [x] 지도 핀 색 제보와 통일 — #E6235A → #F74E7E (제보·제안 동일 핑크) (2026-06-10)
- [x] 내위치 버튼 — 흰 원 FAB → 검정 크로스헤어 24px 단독 아이콘 (WDC 0:12150 기준) (2026-06-10)
- [x] 카드 heart/comment icon → figma-assets/icons 사용 (2026-05-30)
- [x] 카드 구조 m-report-tags + m-report-author-stat-row 일치화 (2026-05-30)
- [x] 시트 region 버튼 font-weight 800→700 — WDC 0:11860 기준 (2026-06-04)

### 나의 제안 (`MyProposals.jsx`)
- [x] 클릭 시 구버전 ProposalDetail → 기기별 pcMyProposalDetail/mProposalDetail 분기 (2026-05-21)
- [x] console.log 제거 (2026-05-21)

---

## 🟨 진단 — 미완료

- [x] `MDiagnosisForm` 제목 마침표 제거 "진단해보세요." → "진단해보세요" (2026-05-06)
- [x] `MDiagnosisList` 전문가 탭 필터 연결 — mode state → API ?target 파라미터 + filtered 로직 반영 (2026-05-21)
- [x] `MDiagnosisForm` 뒤로가기 `home` → `mDiagnosisList` 수정 (2026-05-21)
- [x] `MDiagnosisForm` submitting 중복제출 방지 (2026-05-21)
- [x] `MDiagnosisForm` FACILITY_CHIP_MAP → 표준 대분류 매핑 + QUESTIONS_BY_SUB 동적 질문 (2026-05-21)
- [x] `MDiagnosisResult` 레이더 차트 실제 데이터 — GET /checklist/{resultId} + answers 파싱 (2026-05-21)
- [x] `MDiagnosisResult` 날짜 하드코딩 제거 (2026-05-21)
- [x] `MDiagnosisResult` 세부정보 버튼 alert → disabled 처리 (2026-05-21)
- [x] `MDiagnosisResult` 레이더 차트 fill/stroke 색 `#06AB69` → `#E6235A` (Figma+token 일치) (2026-05-28)
- [x] `MDiagnosisList` 헤더 검색바 → Figma 기준 뒤로가기+모드명+구 드롭다운으로 교체 (2026-05-28)
- [x] `MDiagnosisList` 카테고리 칩 font-size 16px 수정 (2026-05-28)
- [x] `MDiagnosisResult` 세부정보 버튼 3개 모두 green 통일 (2026-05-28)
- [x] `MDiagnosisResult` title font-size 28px (2026-05-28)
- [x] `MDiagnosisForm` title "진단하기" pink #E6235A 28px, 섹션 라벨 번호 형식 추가 (2026-05-28)
- [x] `MDiagnosisForm` CTA 버튼 green→pink #E6235A, height 56px, font-size 18px (2026-05-28)
- [x] `MDiagnosisDone`/`CheckDone` 아이콘 60px→40px, 타이틀 24px→28px, 설명 16px→14px (2026-05-28)
- [x] `MDiagnosisResult` 테이블 레이아웃 + 4개 레이더차트 구조로 전면 재작성 (2026-05-28)
- [x] `MDiagnosisList` 헤더 모드탭 — 시트 내 탭 제거, 헤더에 시민/전문가 탭 이동 (Figma 22:6281 기준) (2026-05-30)
- [x] `MDiagnosisList` 카드 box-shadow → border 1px solid #f0f0f0 교체 (2026-05-30) — ⚠️ 재검증 후 Figma 기준 shadow 복원 (2026-05-30)
- [x] `MDiagnosisForm` 진단위치 섹션 제거 — Figma에 없는 요소 (2026-05-30)
- [x] `MDiagnosisForm` 서브타이틀 font-size 22px→24px (Figma 22:6734 기준) (2026-05-30)
- [x] `MDiagnosisResult` 헤더 타이틀 "시민 진단 결과" 추가 (Figma 22:6387 기준) (2026-05-30)
- [x] `MDiagnosisDone` 컬러 #06AB69(green) → #23BDBB(teal) + 네비 mDiagnosisList로 수정 (Figma 22:7205 기준) (2026-05-30)
- [x] 진단 전체 컬러 토큰 green(#06AB69) → teal(#23BDBB) 전면 교체 — MDiagnosisList/Form/Result 모든 accent 컬러 (Figma 22:6281/6387/6734/7205 기준) (2026-05-30)
- [x] `MDiagnosisList` 카드 border → box-shadow 0 0 10px rgba(0,0,0,0.1) 복원 (Figma 22:6281) (2026-05-30)
- [x] `MDiagnosisList` 카드 태그 배경 #E1F6EC → #DFF8F8 (teal-tinted, Figma 기준) (2026-05-30)
- [x] `MDiagnosisForm` CTA 버튼 pink→teal #23BDBB (Figma 22:6734 기준) (2026-05-30)
- [x] `MDiagnosisForm` 섹션 라벨 font-size 20px→18px, font-weight 800→600 (Figma 22:6734 기준) (2026-05-30)
- [x] `MDiagnosisForm` 사진박스 110px→80px, dashed→solid border, border-radius 8px→15px (Figma 22:6734 기준) (2026-05-30)
- [x] `MDiagnosisForm` 입력창 h-44px→52px, border-radius 8px→15px (Figma 22:6734 기준) (2026-05-30)
- [x] `MDiagnosisForm` 칩 h-30px→33px, font-size 13px→16px, border-radius→16.5px (Figma 22:6734 기준) (2026-05-30)
- [x] `MDiagnosisForm` Q-num 원 색상 green→black #242424 (Figma 22:6734 기준) (2026-05-30)
- [x] `MDiagnosisResult` 테이블 라벨 배경 #fafafa→#e6e6e6, 색상 #888→#242424, font-size 14px→12px, weight 400→600, 가운데 정렬 (Figma 22:6387 기준) (2026-05-30)
- [x] `MDiagnosisResult` 테이블 값 color #242424→#737373, font-size 14px→12px (Figma 22:6387 기준) (2026-05-30)
- [x] `MDiagnosisResult` 테이블 border-color #f0f0f0→#e6e6e6 (Figma 22:6387 기준) (2026-05-30)
- [x] `MDiagnosisResult` 사진 썸네일 border-radius 4px→8px (Figma 22:6387 기준) (2026-05-30)
- [x] `MDiagnosisResult` 헤더 타이틀 text-align center→left (Figma 22:6387 기준, left-aligned next to back btn) (2026-05-30)
- [x] `CheckDone` footer padding 0 24px→0 16px (343px button width, Figma 22:7205 기준) (2026-05-30)
- [x] `MDiagnosisResult` 레이더 차트 fill/stroke #E6235A(pink) → #23BDBB(teal) — Figma 22:6387 기준 (2026-05-30)
- [x] `MDiagnosisResult` 좋아요/댓글 섹션 추가 — Figma 22:6387 하단, 정적 mock (백엔드 미연결 보류) (2026-05-30)
- [x] `MDiagnosisList` 헤더 back+모드탭 같은 행, district compact badge 스타일 — Figma 22:6281 기준 (2026-05-30)
- [ ] `MDiagnosisResult` "관련 시민 제안" 섹션: Figma에 없는 코드 전용 섹션. keep/remove **결정 대기**
- [ ] 모바일 전문가 진단 전용 플로우 — 현재 mode 전달만, 전용 화면 없음
- [?] PC 셸 (A안 통합) Figma `941:10538`/`12315`/`12749` 재검증
- [ ] `MDiagnosisList` 지도 없는 순수 리스트 뷰 (Figma 22:6281 최신 버전) — 현재 map+sheet 구조. 아키텍처 변경 필요, **결정 대기**

---

## 🟨 설문 — Figma diff 보류

- [x] **설문 도메인 전체 재검수** — 6개 화면 Figma TCuOzEqNhoLKjhF0reBDks 픽셀 일치 완료 (2026-06-04)
- [x] `MSurveyJoin` "다음" → 전체 응답 완료 시 "제출" 변경 (allAnswered 조건) (2026-06-04)
- [x] `MSurveyJoin` 유효성 오류 메시지 자동 해제 — 라디오/체크박스/텍스트 입력 시 즉시 dismiss (2026-06-04)
- [x] `MSurveyJoin` 유효성 오류 bottom 148px→160px — 고정 footer(76px+80px=156px) 아래 가려짐 수정 (2026-06-04)
- [x] `MSurveyResults` 중복 로딩 스피너 제거 — `!resultsData` 조건 spinner가 상단 loading/empty 메시지와 중복 렌더링되는 버그 수정 (2026-06-04)
- [x] `MSurveyList` 탭 3개(진행중/결과/마감) → 2개(진행중/결과) Figma 일치 (2026-06-04)
- [x] `MSurveyDetail1/2` 히어로 min-height 230→285px, 카드 overlap -64→-105px, word-break keep-all (2026-06-04)
- [x] `MSurveyDetail2` 동의 체크박스 색상 #542AA3→#43c1c1(teal, Figma 실측), 필수표시(*) #E6235A→#23bdbb (2026-06-04)
- [x] `MSurveyDetail2` 동의 카드 타이틀 색상 purple→black (#111, Figma 실측) (2026-06-04)
- [x] `MSurveyDone` MobileBottomNav 제거 — Figma 스펙: done 화면에 bottom nav 없음 (2026-06-04)
- [x] `MSurveyJoin` 선택 옵션 체크 SVG stroke #542AA3→#fff (purple bg에서 white 체크, Figma 일치) (2026-06-04)
- [x] `MSurveyJoin` 진행 표시: Figma 확인 결과 linear fill bar (dot indicator 아님) — 코드 일치. 색상 #542AA3, height 10px, 헤더 inline-right 160px 배치 (2026-05-30)
- [x] `MSurveyDone` MobileBottomNav 추가 + 홈 버튼 인라인 스타일 → CSS 클래스 (2026-05-21)
- [x] `MSurveyDone` 하단 여백 과다 수정 — padding 160px → 0, actions padding 조정 (2026-05-28)
- [x] `MSurveyDone` padding-bottom 76px 추가 — MobileBottomNav 아래 버튼 가려짐 수정 (2026-05-30)
- [x] `MSurveyDone` 픽셀 재일치 — check circle 56→40px, 제목 22→28px, 부제목 15→20px, 설명 12→14px #737373, 버튼 pill→8px radius/56px (2026-05-30)
- [x] `MSurveyJoin` 필수 응답 검증 추가 — 미응답 시 제출 차단 (2026-05-21)
- [x] `MSurveyJoin` submitting 중복제출 방지 + localStorage 이어하기 저장 (2026-05-21)
- [x] `MSurveyJoin` 상단 뒤로가기 버튼 추가 — Figma `<` 아이콘 + 헤더 레이아웃 (2026-05-30)
- [x] `MSurveyJoin` 픽셀 재일치 — 제목 24px #542AA3, option 16px/8px-radius/e6e6e6, 버튼 56px/8px-radius/130px, 섹션 5px #f4f4f4 divider (2026-05-30)
- [x] `MSurveyDetail2` demographics(성별/연령/기기/직업) MSurveyJoin으로 전달 → 백엔드 저장 (2026-05-21)
- [x] `MSurveyDetail2` 동의 입력 스타일 circle radio → square checkbox (Figma 스펙) (2026-05-28)
- [x] `MSurveyDetail2` 직업(소속) 2-column grid → 1-column (Figma 스펙) (2026-05-28)
- [x] `MSurveyDetail2` 폼 레이블 font-size 16px, 블록 레이아웃으로 변경 (Figma 스펙) (2026-05-30)
- [x] `MSurveyDetail2` 동의 체크박스/라디오 색상 #5B2EAB→#542AA3 수정 (2026-05-30)
- [x] `MSurveyDetail1` 히어로 min-height 230px, 카드 overlap -64px, 제목 margin-top 32px (Figma 스펙) (2026-05-30)
- [x] 설문 전 도메인 primary color #5B2EAB→#542AA3 통일 (Figma TCuOzEqNhoLKjhF0reBDks 실측값) (2026-05-30)
- [x] 백엔드 SurveyResponse.demographics JSON 컬럼 추가 (2026-05-21)
- [x] `MSurveyResults` "자세히보기" alert → disabled 처리 (2026-05-21)
- [x] `MSurveyResults` 히어로 타이틀 raw title → "YYYY년,\n[title] 결과는?" 형식 (Figma 스펙) (2026-05-28)
- [x] `MSurveyResults` 히어로 min-height 211px, pill margin-bottom -27px, 제목 margin-top 32px (2026-05-30)
- [x] `PCSurveyResults` open toggle → 실제 콘텐츠 show/hide 구현 (2026-05-21)
- [x] `MSurveyDetail1` 이용약관/개인정보처리방침 span → onClick alert + cursor:pointer (2026-05-21)
- [x] `MSurveyDetail1` 조사기간 ~종료일 포맷, 본문 16px, 불릿 chevron, CTA 152px pill (Figma 스펙) (2026-05-30)
- [x] `MSurveyList` 카드 font-size 18px/16px, border-radius 15px, 탭 height 43px/border-radius 10px (Figma 스펙) (2026-05-30)
- [x] `MSurveyList` 탭 active/arrow/respondents 색상 #542AA3, 뒤로가기 16px #555 (2026-05-30)
- [x] `PCSurveyJoin` submitting guard → 중복 제출 방지 (2026-05-28)
- [ ] 중복 응답 방지: 백엔드 unique constraint 미적용 — 추가 필요

---

## 🟨 마이활동 — Figma 노드 미식별

- [x] `MyPage.jsx` — Figma 215:2136 기준 전면 리뉴얼 (2026-06-13): 필드 추가(닉네임/이메일/주소), PC 카드 레이아웃(border+rounded-20px), teal #23bdbb 수정하기 버튼, 모바일 back 헤더
- [x] `MySurveys.jsx` (신규) — Figma 215:2435(PC)/215:14747(모바일) 기준 신규 구현 (2026-06-13): 기간 필터(1개월/6개월/1년), PC 2열 그리드, 상태 배지(완료/스크린아웃/응답중), 종합결과보기 버튼, 모바일 보라 #542aa3 / PC teal #23bdbb 기간 선택
- [x] `MyActivityHub.jsx` — 진단 내역 카드 추가 (2026-05-21)
- [x] `MyActivityHub.jsx` — Figma 215:13979 기준 전면 리뉴얼 (2026-06-13): 프로필 카드(그림자 카드/이름/마지막접속/인증뱃지), 관심목록·최근본글·자주본글 pill 버튼, 나의활동 카테고리 칩 필터, 2×2 통계 그리드(제보·제안·설문·진단 건수·Figma 색상), PC 분기 및 MobileBottomNav 보존
- [x] `MyActivity.jsx` — 정렬 로직 구현 + 이메일 API 연동 + 북마크 탭 안내 메시지 + console.log 제거 (2026-05-21)
- [x] `MyActivity.jsx` + `DiagnosisCard.jsx` Figma 기준 대규모 스타일 수정 (2026-05-28):
  - 타이틀 `나의 활동` pink #E6235A
  - 카드 border 1px solid #e6e6e6, border-radius 8px, padding 12px, no shadow
  - 타입 뱃지 fill→outline border style (일반인 #E6235A, 전문가 #542AA3)
  - 이미지 100px→120px, border-radius 8px
  - 점수/결과 24px bold GmarketSans
  - 스코어 박스 #F2F2F2 bg, 6-col grid
  - 구분선 dashed #e6e6e6
  - 좌표 12px #737373
  - 탭 버튼 pill shape 36px, 14px, border-radius 9999px
  - 프로필 아바타 gray #e6e6e6, gap 20px
- [x] `MyReports.jsx` — 헤더 "홈으로" → "나의 활동" 수정 (2026-05-21)
- [?] `MyProposals.jsx` (모바일 나의 제안) — PC 버전 `830:7090` 참고 가능

---

## 🟨 홈 / 로그인 / 회원가입

- [ ] `Home.jsx` 통계/차트 섹션 활성화 — **사용자 결정 대기**
- [x] Figma 모바일 홈 노드 `575:22588` 확인 완료 (2026-05-28)
- [x] `Home.jsx` 제안하기 카드 색상 green→teal #23BDBB 수정 (2026-05-28)
- [x] `Login.jsx` console.log 제거 (2026-05-21)
- [x] `Signup.jsx` console.log 제거 (2026-05-21)
- [x] `PCHeader.jsx` — '나의 활동' 메뉴 추가 → myActivityHub (2026-05-21)
- [?] `PCHeader.jsx` 검색바 UI 설계 — `GET /api/search` 연결 필요
- [?] PC 헤더/푸터 Figma 비교

---

## 🟦 Admin — 미구현

- [x] AI가상시민 PC (`PCAICitizen`) + 모바일 (`MAICitizen`) 구현 완료 (2026-05-08) — `backend/routers/ai_citizens.py` mock 10명
- [x] AI가상시민 Figma Diff 보강 (2026-05-09): 아바타 인물실루엣, 카테고리 active 아이콘 filter teal, "문화·여가"/"보건·복지" 라벨, district placeholder, 말풍선 흰색/2행 클램프, PC 수평 캐러셀+원형 "›" 버튼
- [x] MobileBottomNav 탭 순서 변경: 진단/제보·제안/홈/가상시민/나의 활동 (2026-05-08)
- [x] `MDiagnosisList` 지도+패널 리디자인 (2026-05-09): 검색바 플로팅, 카테고리칩 지도 위, 시민/전문가 모드탭, Figma 카드 스타일
- [x] `PCDiagnosisMap` 우측 패널 보강 (2026-05-09): 시민/전문가 탭, teal name+score 카드 스타일 — `PCDiagPanelDetail` radar chart 이미 구현됨
- [x] AI가상시민 PC `FigmaDistrictMap` 하단구역 클리핑 수정 (2026-05-21): `scale(width/1920)` → `Math.min(scaleW, scaleH)` + 중앙 정렬 — 1440px~1920px 모든 뷰포트에서 영도구/사하구/서구 완전 표시
- [x] AI가상시민 모바일(`MAICitizen`) 지도 스크롤 차단 수정 (2026-05-21): `.leaflet-container`에 `touch-action: pan-y` 추가
- [x] `MAICitizenDetail` 전면 재작성 — 히어로/프로필그리드/시민목소리/핵심이슈/여정지도/정책신호등/참여현황/레이더차트 (2026-05-28)
- [x] `MAICitizen` 말풍선에 아바타 이미지 추가 (2026-05-28)
- [x] `PCAICitizen` 참여현황 차트·카드 스타일 개선 (2026-05-28)
- [x] `PCMapCanvas` 진단 핀 원형→teardrop (시민=회색 solid / 전문가=청록 outline) (2026-05-28)
- [x] `PCMapShared.css` / `PCDiagnosisMap.css` teardrop 핀 CSS + 툴바 위치 수정 (2026-05-28)
- [?] AI가상시민 실제 DB 연동 (현재 mock 데이터)
- [?] 공공디자인 현황 메가 대시보드 미구현
- [?] 진단정보 / 정책정보 / 공공데이터 / 디자인생태 페이지 미구현

---

## 🐛 신규 버그 (2026-05-30)

- [x] **PCProposeMap 제안 이미지 미표시** — `p.image` 참조 버그: `NewProposalRead`에 `image` 필드 없음 → `p.files[0]` 사용으로 수정 (2026-05-30)
- [x] **seed_full_mock 제안 lat/lng 누락** — 시드된 제안이 `proposal-pins` 엔드포인트에 미반환 → `lat/lng` 추가 (2026-05-30)

---

## 🐛 신규 버그 (2026-05-21)

- [x] **제안 지도 핀 미표시** — `MProposalForm` lat/lng 미전송 수정, `MProposalMap`/`PCProposeMap` DISTRICT_CENTERS fallback + Busan center fallback 추가, deterministic jitter (2026-05-21)
- [x] **댓글 2개씩 등록** — `MProposalDetail`/`MReportDetail`/`PCProposeDetail`/`PCReportDetail` 모두 `commenting` guard 추가 (2026-05-21)
- [x] **조회수 미연동** — `PCReportDetail` `views_count` → `views ?? views_count` 필드명 수정 (2026-05-21)
- [x] **제안 처음 진입 시 정책정보 불필요 노출** — `PCProposeMap` `policyDismissed` 기본값 `true`로 변경 (2026-05-21)
- [x] **진단 제출 후 핑 추가 안됨** — `PCDiagnosisMap` `refreshKey` state 추가, `goDone()` 시 increment → useEffect 재실행 (2026-05-21)
- [x] **제보/제안 핑 추가 안됨** — `MReportForm` lat/lng 항상 전송 수정 (2026-05-21)
- [x] **진단 만족도 2,4번 선택지 이미지 제거** — `diagnosis.js` face: null for values 2,4; `PCDiagPanelForm` 조건부 렌더 (2026-05-21)
- [x] **MSurveyResults 앱 크래시** — `respondentCount`·`compositeData` 등 `const` 선언 순서 오류(TDZ) 수정: `handleCopy` useCallback을 모든 파생값 선언 이후로 이동 (2026-05-28)
- [x] **MReportDetail author 2-line 레이아웃** — Figma 848:19789 기준 작성자/날짜 2줄 구조로 수정 (2026-05-28)
- [x] **MReportDetail created_at 필드 매핑 누락** — `report?.created_at` fallback 추가 (2026-05-28)
- [x] **MFilterSheets RegionSheet/SortSheet 아이콘** — checkmark → chevron-down (always visible, pink when active) — Figma 848:19327·848:19455 기준 (2026-05-28)
- [x] **MReportForm 카테고리 칩 스타일** — bordered white style로 수정 (Figma 848:18955 기준) (2026-05-28)

---

## 🚨 횡단 이슈 — 미완료

- [x] **MProposalForm 제목 마침표**: "제안해보세요." → "제안해보세요" 수정 완료 (2026-05-06)
- [x] **Detail 히어로 이미지**: MReportDetail/MProposalDetail `image` 필드 → background-image 적용 (2026-05-06)
- [ ] **CAT 종류 통일**: 제보 카테고리 4개 vs 제안 카테고리 8개 vs 필터 9개 — 명세 확정 필요
- [ ] **위치 좌표 노출**: `위도/경도` 수치 노출 → 실서비스는 reverse-geocoded 주소 필요
- [ ] **인증 가드 토큰 리다이렉트**: auth-gated 뷰 미인증 시 login 리다이렉트 verify 토큰 헬퍼 미구현
- [ ] **임시저장 다중 키**: `mProposalForm:draft` 단일 키 — 사용자별 분리 미고려
- [?] **ESLint 설정 미비**: `.eslintrc` 파일 없음, `eslint` 미설치. Vite 기본 설정만 존재

---

## ⏳ 정책·기획 결정 대기 (코드 작업 불가)

| 항목 | 파일 | 내용 |
|---|---|---|
| ~~MReportForm 카테고리 수~~ | ~~`MReportForm.jsx`~~ | ~~해결됨: WDC Figma 기준 8개 확인 (2026-05-30)~~ |
| CAT 종류 통일 | 전체 | 제보 카테고리 8개 확정, 필터 9개(전체 포함) — 이미 코드 일치 |
| MReportDetail cat 태그 색상 | `MReportDetail.jsx` | Figma=노랑(#ffef8a), 리스트=청록(CAT_STYLES) — 현재 코드는 리스트 컬러 유지 정책 |
| MProposalDetail cat 태그 색상 | `MProposalDetail.jsx` | variant마다 다름 — catStyles.js 재검증 |
| MReportDetail 단계바 클릭 | `MReportDetail.jsx` | "결과안내" 외 단계 클릭 가능 여부 |
| MProposalDetail 댓글 페이지네이션 | `MProposalDetail.jsx` | Figma long variant 기준 더보기 구현 여부 |
| MDiagnosisResult "관련 시민 제안" 섹션 | `MDiagnosisResult.jsx` | Figma에 없는 코드 전용 섹션 — keep/remove |
| MSurveyJoin 진행 표시 | `MSurveyJoin.jsx` | Figma=보라 dot indicator, 코드=linear fill bar |
| mDiagnosisResult vs mDiagnosisDetail | `App.jsx` | 두 view 동일 컴포넌트 공유 — 분리 여부 |
| Home 통계 섹션 활성화 | `Home.jsx:186-273` | `{false && ...}` 블록 활성화 여부 |

---

## 🗺️ Figma 노드 인덱스 (제보·제안)

| Figma 노드 | 화면 | 컴포넌트 |
|---|---|---|
| `848:17364` | 제안 리스트 | `MProposalList.jsx` |
| `848:17890` | 제안 지도 | `MProposalMap.jsx` |
| `848:17301` | 제안하기01 | `MProposalForm.jsx` |
| `848:17812` | 제안상세1 | `MProposalDetail.jsx` |
| `848:18075` | 제안상세 전체 (long) | (variant) |
| `848:18712` | 제안완료 | `MProposalDone.jsx` |
| `848:19015` | 제보 지도 | `MReportMap.jsx` |
| `848:19157` | 제보 리스트 | `MReportList.jsx` |
| `848:18955` | 제보하기01 | `MReportForm.jsx` |
| `848:19789` | 제보상세 | `MReportDetail.jsx` |
| `848:19843` | 제보상세>좋아요 | (variant) |
| `848:19897` | 제보상세>제보결과 | (모달) |
| `848:20468` | 제보완료 | `MReportDone.jsx` |

---

## 📋 섹션3·4 전수조사 결과 신규 항목 (2026-05-06)

### 🔴 P0
- [x] **어드민 메인 카드 아이콘 404** — 실제 SVG 파일 존재 확인 (HTTP 200). 오탐이었음 (2026-05-06)

### 🔴 P1
- [x] **어드민 메인 disabled 카드 hover teal 오류** — `:not(.disabled)` CSS 추가로 comingSoon 카드 hover teal 방지 (2026-05-06)
- [x] **PC 제안/제보하기 작성완료 버튼 색** — 코드 `#E6235A`가 프로젝트 디자인 토큰. Figma 오탐 (2026-05-06)
- [x] **어드민 설문 상태 텍스트** — STATUS_LABEL 수정 완료 (2026-05-06)
- [x] **어드민 설문 액션 UI** — `···` 드롭다운 컴포넌트로 교체 완료 (2026-05-06)
- [?] **PC 제안/제보 상세 상단 카테고리 pills** — 코드에 이미 tags row 존재. Figma 재확인 필요

### 🟡 P2
- [x] **어드민 제안/제보 페이지 타이틀** — "제안현황"/"제보현황"으로 수정 완료 (2026-05-06)
- [x] **어드민 제안/제보 검색 필드** — 회원검색 필드 추가 완료 (2026-05-06)
- [x] **어드민 설문 생성 버튼** — outline 스타일 "+ 새 설문 만들기"로 변경 완료 (2026-05-06)
- [x] **PC 설문목록 배너 너비** — 코드에 이미 max-width:1080px; margin:0 auto 적용 확인. 오탐 (2026-05-06)
- [x] **PC 설문목록 날짜 포맷** — `~종료일` 형식으로 변경 완료 (2026-05-06)
- [x] **PC 제안/제보 폼 배너 너비** — 코드에 이미 max-width:700px; margin:0 auto 적용 확인. 오탐 (2026-05-06)
