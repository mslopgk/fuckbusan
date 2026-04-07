# 백엔드 설계 및 API 명세서 (Report System)

이 문서는 '부산 해결사' 제보 시스템의 프론트엔드 기능을 지원하기 위한 데이터베이스(DB) 및 API 설계를 정의합니다.

## 1. 데이터베이스 테이블 설계 (DB Schema)

### ① `reports` (제보 메인)
| 필드명 | 타입 | 설명 | 비고 |
| :--- | :--- | :--- | :--- |
| `id` | INT | PK (Auto Increment) | |
| `user_id` | INT | 작성자 고유 ID | FK |
| `category` | VARCHAR | 카테고리 (주거, 환경, 교통 등) | |
| `sub_category` | VARCHAR | 세부 장소 (골목쓰레기통, 공원 등) | |
| `title` | VARCHAR | 제보 제목 | |
| `content` | TEXT | 제보 상세 내용 | |
| `region` | VARCHAR | 구 단위 지역 (수영구, 동래구 등) | |
| `location` | VARCHAR | 상세 주소 명칭 (예: 수안역 3번 출구) | |
| `detailed_address` | VARCHAR | 상세 호수 정보 등 | |
| `lat` | DECIMAL(10,8) | 경도 | GPS 좌표 |
| `lng` | DECIMAL(11,8) | 위도 | GPS 좌표 |
| `status` | ENUM | '개선예정', '개선중', '개선완료' | |
| `progress_step` | INT | 1:접수, 2:검토중, 3:검토완료, 4:결과안내 | |
| `views` | INT | 조회수 | Default 0 |
| `created_at` | TIMESTAMP | 작성 시각 | |

### ② `report_images` (제보 사진)
| 필드명 | 타입 | 설명 | 비고 |
| :--- | :--- | :--- | :--- |
| `id` | INT | PK | |
| `report_id` | INT | 부모 제보 ID | FK (Reports) |
| `image_url` | VARCHAR | 이미지 저장 경로/URL | |

### ③ `report_likes` (좋아요/공감)
| 필드명 | 타입 | 설명 | 비고 |
| :--- | :--- | :--- | :--- |
| `id` | INT | PK | |
| `user_id` | INT | 유저 고유 ID | FK |
| `report_id` | INT | 공감한 제보 ID | FK (Reports) |

> [!IMPORTANT]
> `user_id`와 `report_id` 쌍은 **Unique**해야 하며, 중복 좋아요를 방지해야 합니다.

### ④ `improvement_results` (개선 결과 상세)
| 필드명 | 타입 | 설명 | 비고 |
| :--- | :--- | :--- | :--- |
| `id` | INT | PK | |
| `report_id` | INT | 제보 ID | FK / Unique |
| `title` | VARCHAR | 결과 제목 (예: 정비 완료 보고) | |
| `content` | TEXT | 상세 조치 결과 내용 | |
| `image_url` | VARCHAR | 조치 결과 사진 | |
| `manager_dept` | VARCHAR | 담당 부서 명칭 | |
| `result_date` | DATE | 조치 완료 날짜 | |

---

## 2. 핵심 API 엔드포인트 명세

### [제보 관리]
- `GET /api/reports`: 제보 목록 검색 (필터: `category`, `region`, `status`, `sort`)
- `POST /api/reports`: 신규 제보 등록 (Multpart/form-data)
- `GET /api/reports/:id`: 상세 정보 (이미지, 좋아요 수, 댓글, 개선 결과 포함)
- `PUT /api/reports/:id`: 제보 수정
- `DELETE /api/reports/:id`: 제보 삭제

### [인터랙션]
- `POST /api/reports/:id/like`: 좋아요 토글 (Toggle 방식 추천)
- `POST /api/reports/:id/comments`: 댓글 등록
- `GET /api/reports/:id/comments`: 댓글 리스트 조회

---

## 3. 실무 구현 가이드 (Best Practices)

1. **전역 상태 동기화**: 프론트엔드의 `localStorage` 기반 상태를 실제 API 호출 결과와 매칭시켜 데이터 일관성을 유지합니다.
2. **이미지 최적화**: 업로드 시 썸네일을 생성하거나, 클라우드 CDN(S3 등)을 활용해 전송 효율을 높입니다.
3. **보안 (`ON DELETE CASCADE`)**: 제보글 삭제 시 관련 사진, 좋아요, 개선 결과가 DB 레벨에서 한꺼번에 삭제되도록 무결성을 유지합니다.
