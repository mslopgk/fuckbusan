# Claude Code 프로젝트 컨텍스트 이식 패키지

이 디렉터리는 이 프로젝트에서 Claude Code로 작업하며 축적된 **프로젝트 컨텍스트(메모리)를
다른 머신/다른 사람에게 그대로 이식**하기 위한 패키지다.

## 구성

| 경로 | 내용 |
|---|---|
| `memory/MEMORY.md` | 메모리 인덱스 — 매 세션 자동 로드되는 한 줄 요약 목록 |
| `memory/*.md` | 개별 메모리 (작업 규칙, Figma 노드 매핑, 프로젝트 상태, 트러블슈팅 노하우 31건) |
| `install.sh` | 대상 머신의 `~/.claude/projects/<slug>/memory/` 로 복사하는 설치 스크립트 |
| (레포 루트) `CLAUDE.md` | 프로젝트 컨벤션 — 레포에 이미 포함, 자동 로드됨 |
| (레포 루트) `TODO.md` | 페이지별 작업 체크리스트 + 디자이너 확인 필요 항목 |

## 설치 (새 머신)

```bash
git clone https://github.com/BlueHair37/fuckbusan && cd fuckbusan
bash docs/claude-context/install.sh   # 메모리 설치 (기존 메모리는 자동 백업)
claude                                 # 레포 루트에서 실행
```

Claude Code는 프로젝트 메모리를 `~/.claude/projects/<프로젝트 절대경로의 '/'→'-' 슬러그>/memory/`
에서 읽으므로, **클론 위치가 달라도 install.sh가 자동 계산**한다.

## 메모리에 담긴 핵심 (요약)

- **작업 규칙**: Figma가 곧 스펙(한 치 오차 금지), 에셋은 무조건 Figma 노드 export(손 SVG 금지),
  빌드만 보고 완료 보고 금지(Playwright 실검증 필수), dev 서버 임의 kill 금지,
  정부 플랫폼이므로 가짜 수치 절대 금지
- **Figma**: WDC 파일(`TCuOzEqNhoLKjhF0reBDks`)이 모바일/PC 스펙 원본. 사용자 페이지 섹션 ID,
  관리자 캔버스 `263:2627`, 프레임 버전 규칙(아래쪽=최신) 등
- **TalkToFigma 브리지**: bun socket 포트 3055 + Figma 플러그인 채널 join.
  대량 스캔/export는 소켓 직결 스크립트가 효율적 — 응답은 progress_update가 섞여 오므로
  `m.result !== undefined`일 때만 resolve (스크립트 패턴은 memory/talk_to_figma_bridge.md)
- **2026-07 전수 정합 상태**: 모바일 8섹션 + 어드민 5영역 Figma 정합 완료 커밋 해시,
  4팀 전수검증(P0/P1 제로) 결과, 잔여 P2 백로그 (memory/project_full_figma_sweep_202607.md)
- **테스트 계정/개발 환경**: memory/dev_servers.md 참조 (admin 단축 로그인, 사용자 테스트 계정,
  Firebase SMS DEV 번호 등 — 전부 개발용)

## 메모리 최신화

작업 중 메모리가 갱신되면 레포에도 반영해 두는 것을 권장:

```bash
cp ~/.claude/projects/$(pwd | tr '/' '-')/memory/*.md docs/claude-context/memory/
git add docs/claude-context/memory && git commit -m "chore: Claude 메모리 스냅샷 갱신"
```

> 참고: 이 레포는 private 전제. 메모리에는 개발용 테스트 계정 정보가 포함되어 있으므로
> 레포를 public으로 전환할 경우 이 디렉터리를 먼저 정리할 것.
