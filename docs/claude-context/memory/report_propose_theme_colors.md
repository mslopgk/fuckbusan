---
name: report-propose-theme-colors
description: WDC Figma 기준 제보=보라/제안=핑크 — CLAUDE.md의
metadata: 
  node_type: memory
  type: reference
  originSessionId: f0c66c2c-a052-4dbf-b4f3-c6f052084f74
---

WDC Figma(`TCuOzEqNhoLKjhF0reBDks`)의 제보/제안 화면 실제 테마색 (Figma 스크린샷으로 직접 확인):
- **제보(report) = 보라 `#542aa3`** (작성완료/FAB/active chip/핀/좋아요 등)
- **제안(propose) = 핑크 `#f74e7e`** (작성완료/FAB/active 등)

**Why:** CLAUDE.md 디자인토큰 표는 "제보·제안 #E6235A(핑크)"로 적혀 있지만 이는 outdated. "Figma가 곧 스펙" 원칙상 실제 프레임 색이 정답. 2026-06-13 PC/모바일 제보·제안 전 화면을 이 색으로 정합화함.

**How to apply:** 제보 화면 손볼 때 보라 `#542aa3`, 제안은 핑크 `#f74e7e` 사용. 공유 컴포넌트 `MFilterSheets`(RegionSheet/SortSheet)는 `accent` prop으로 컨텍스트색 전달(제보 보라/제안 핑크). 홈 카드의 제보=#242424/제안=#23bdbb(teal)는 별개(홈 디자인). 관련: [[wdc_mobile_spec]]
