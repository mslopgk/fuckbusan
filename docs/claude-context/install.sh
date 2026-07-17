#!/usr/bin/env bash
# Claude Code 프로젝트 컨텍스트(메모리) 이식 스크립트.
#
# 사용법: 레포를 클론한 뒤, 레포 루트에서
#   bash docs/claude-context/install.sh
#
# Claude Code는 프로젝트별 메모리를
#   ~/.claude/projects/<프로젝트-절대경로의 '/'를 '-'로 치환한 슬러그>/memory/
# 에서 읽는다. 이 스크립트는 현재 레포 위치 기준으로 그 경로를 계산해
# docs/claude-context/memory/ 의 파일들을 복사한다.
#
# 주의: 대상 머신에 같은 프로젝트 메모리가 이미 있으면 덮어쓴다(백업 생성).

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SRC="$REPO_ROOT/docs/claude-context/memory"
SLUG="$(echo "$REPO_ROOT" | tr '/' '-')"
DEST="$HOME/.claude/projects/$SLUG/memory"

if [ ! -d "$SRC" ]; then
  echo "오류: $SRC 가 없습니다. 레포 루트에서 실행했는지 확인하세요." >&2
  exit 1
fi

if [ -d "$DEST" ] && [ -n "$(ls -A "$DEST" 2>/dev/null)" ]; then
  BACKUP="$DEST.backup.$(date +%Y%m%d%H%M%S)"
  echo "기존 메모리 발견 → 백업: $BACKUP"
  cp -R "$DEST" "$BACKUP"
fi

mkdir -p "$DEST"
cp "$SRC"/*.md "$DEST"/
echo "설치 완료: $(ls "$SRC" | wc -l | tr -d ' ')개 메모리 → $DEST"
echo
echo "다음 단계:"
echo "  1. 이 레포 루트에서 claude 실행 — CLAUDE.md(레포 루트)와 메모리가 자동 로드됨"
echo "  2. dev 환경 기동: docker compose up -d && (cd backend && python3 -m uvicorn main:app --reload) && npm run dev"
echo "  3. Figma 연동이 필요하면 docs/claude-context/README.md 의 TalkToFigma 섹션 참조"
