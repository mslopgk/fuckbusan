---
name: talk-to-figma-bridge
description: Cursor Talk to Figma 사용법 — WebSocket 브리지 기동 + 플러그인 채널 조인
metadata: 
  node_type: memory
  type: reference
  originSessionId: f0c66c2c-a052-4dbf-b4f3-c6f052084f74
---

공식 figma MCP(읽기/디자인컨텍스트)와 별개로 `TalkToFigma` MCP(Figma 직접 편집)를 쓰려면 WebSocket 브리지가 필요하다. npm dist에는 브리지(`src/socket.ts`)가 없어 레포 소스로 띄워야 함.

**기동:** `~/cursor-talk-to-figma-mcp` 클론됨. `cd ~/cursor-talk-to-figma-mcp && nohup bun socket > /tmp/figma-socket.log 2>&1 &` → 포트 3055. 로그 `/tmp/figma-socket.log`로 클라이언트/채널 확인.

**채널 조인:** Figma 플러그인(Cursor Talk to Figma)에서 Connect → 채널명 표시됨 → `mcp__TalkToFigma__join_channel({channel})`로 같은 채널 조인. 브리지를 재시작하면 플러그인 연결이 끊기니 플러그인에서 재Connect(새 채널명) 후 다시 조인.

**주의:** TalkToFigma 툴은 Claude Code 세션 시작 시점에만 로드됨. 서버를 새로 추가했으면 재시작해야 `mcp__TalkToFigma__*`가 잡힌다. 브리지 없이 직접 붙으려면 ws://localhost:3055에 `{type:'join',channel}` 후 `{type:'message',channel,message:{id,command,params}}` 전송(bun 네이티브 WebSocket 사용, ws 패키지는 bun에서 101 에러).
