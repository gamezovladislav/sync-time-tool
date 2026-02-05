# Sync Timer (Room-based) — Specification

This document is the living specification for the MVP.

Goal: a simple room-based tool where multiple clients see the same countdown and hit **0** as simultaneously as possible using a small WebSocket coordinator.

---

## 1) Scope

### In scope (MVP)

* Client UI that can:

    * connect to a configurable server URL
    * create/join a **room**
    * display a synchronized countdown to a shared target time
    * start a countdown (default **5s**) from one client and have all clients converge to the same **finish moment**
* Server that can:

    * maintain rooms and their connected participants
    * provide a simple time-sync endpoint over WebSocket (ping/pong)
    * broadcast `START` commands with an **absolute** server timestamp (`startAt`)
* Separate builds/runs for **client** and **server**
* Production-ready baseline: linting, formatting, typing, health checks, Docker, CI skeleton

### Out of scope (explicitly not required)

* User accounts, roles, permissions
* Delivery guarantees, confirmations, anti-cheat
* Persistent storage (rooms may be in-memory)
* Complex scheduling (“run at 21:00 tomorrow”) — optional later

---

## 2) Key Concepts

### Rooms

* A room is identified by a `roomId` (short string).
* Any client can create a new room; other clients join using the same `roomId`.
* The UI should generate a **share link** that contains `roomId` and `serverUrl` (or at least the roomId).

### Synchronized start

* Do **not** start timers “now”.
* Instead, server computes a common absolute time:

    * `startAt = server_now_ms + max(requested_delay_ms, min_lead_ms)`
* Server broadcasts `{ startAt }` to all room members.
* Each client renders countdown using:

    * `true_now = client_now + offset_ms`
    * `ms_left = startAt - true_now`

### Time sync (offset estimation)

* Client estimates `offset_ms = server_now - client_now` using multiple samples:

    * client sends `{t0}`
    * server replies `{t0, t1}` where `t1 = server_now`
    * client receives at `t2`
    * `offset_est = t1 - (t0 + t2)/2`
* Collect ~10–20 samples; pick the sample with lowest RTT (or median).

---

## 3) Functional Requirements

### Client

* Configurable server URL:

    * editable field in UI (default from env or query param)
    * stored in localStorage for convenience
* Room flow:

    * “Create room” button → generates roomId (client-side) and joins
    * “Join room” by entering roomId or opening a share link
    * UI shows a shareable link for the current room
* Countdown:

    * show remaining time in seconds with milliseconds (e.g. `3.214`)
    * show “GO!” at zero
    * remain responsive while counting down
* Start:

    * button “Start 5s” (default)
    * optional input `delay_ms` (e.g. 3000–30000)
* Connection states:

    * connected / reconnecting / disconnected indicators
    * on reconnect: re-join room automatically if possible

### Server

* WebSocket endpoints:

    * accept client connections
    * support `JOIN`, `PING`, `START_REQ`
    * broadcast `START` to all clients in a room
* Room management:

    * in-memory map `roomId -> set(connections)`
    * remove empty rooms
* Safety:

    * validate message schema
    * basic rate limits (per connection) for PING / START_REQ
    * reject overly large payloads
* Observability:

    * structured logs (JSON) with roomId/eventType
    * optional `/healthz` HTTP endpoint

---

## 4) Non-Functional Requirements (Production-ready baseline)

### Code quality & architecture (must-have)

* Well-structured, maintainable code aligned with common engineering principles:

    * **SOLID**, **DRY**, **KISS**, **YAGNI**
    * clear separation of concerns (UI / transport / domain / utilities)
    * small modules, explicit boundaries, dependency injection where it helps
    * avoid “god objects”; prefer composition over inheritance
* OOP where it makes sense (esp. server services), but keep MVP pragmatic.
* Error handling and user-facing states are not optional.
* Consistent naming, folder layout, and minimal-but-meaningful comments.
* No hidden “magic”: configuration should be explicit and documented.

### Tooling & reliability

* **TypeScript** preferred (client + server), or Python for server if chosen.
* Lint/format:

    * TS: ESLint + Prettier
* Testing:

    * unit tests for time-sync math and room broadcasting
* Build separation:

    * `apps/server` and `apps/client` with independent `dev` and `build` scripts
* Config:

    * `.env` supported
    * client must allow overriding server URL at runtime
* Deployment friendliness:

    * Dockerfiles for client and server
    * docker-compose for local run
* Security basics:

    * CORS / allowed origins config (for WebSocket, origin checks)
    * no secrets in URLs (MVP uses roomId only)

### Repository docs & meta files (must-have)

* `README.md` — what it is, quickstart, scripts, troubleshooting.
* `AGENTS.md` — instructions for contributors/AI agents: architecture, message contract, how to add features, dos/don’ts.
* `SPEC.md` (or `docs/spec.md`) — living specification / requirements (this document in repo).
* `contracts/message-contract.md` — the authoritative wire protocol description.
* `CHANGELOG.md` — record of changes to functionality and protocol.
* `.env.example` — documented env vars for server/client.
* `LICENSE` — pick a license (or placeholder if internal).
* `.gitignore`, `.editorconfig` — consistent workspace hygiene.
* CI config (GitHub Actions / Bitbucket Pipelines) — at least lint + tests + build.

### Keeping the spec up to date (policy)

* The spec + contract are **source of truth**:

    * any change to WebSocket messages or client/server behavior must update:

        * `SPEC.md` (requirements/behavior)
        * `contracts/message-contract.md` (protocol)
        * `CHANGELOG.md` (what changed)
* Prefer small, frequent updates; avoid “spec drift”.
* Releases/build artifacts should reference a version/tag that matches the changelog.

### Release artifacts (must-have)

* The project must produce **build outputs that can run without access to the repo**:

    * **Client build**: static bundle (`dist/`) that can be served by any static server (or as a Docker image).
    * **Server build**: a runnable production bundle (e.g., `dist/` + minimal runtime files), packaged as a zip/tarball **or** a Docker image.
* A short run instruction must exist for each artifact (e.g., `./start.sh` or `docker run ...`).

---

## 5) Suggested Tech Stack (Default)

### Option A (recommended): TypeScript everywhere

* Server: Node.js + `ws` (or `uWebSockets.js` if needed later)
* Client: Vite + TypeScript + minimal UI (vanilla or React)

### Option B: Python server + TS client

* Server: FastAPI WebSocket (uvicorn)
* Client: Vite + TypeScript

---

## 6) Project Structure

> Note: a language-agnostic shared package is optional. If the server is not TypeScript, it’s better to keep a **contract** (schemas/docs) instead of “shared code”.

Recommended structure (works for TS-only or TS+Python): (works for TS-only or TS+Python):

```
repo/
  AGENTS.md
  README.md
  SPEC.md
  CHANGELOG.md
  .env.example
  .editorconfig
  .gitignore
  LICENSE
  apps/
    server/
      src/
      tests/
      package.json
      Dockerfile
    client/
      src/
      public/
      package.json
      Dockerfile
  contracts/
    message-contract.md   # human-readable protocol (JOIN/PING/START...)
    schemas/              # optional JSON Schema for messages
  docker-compose.yml
```

If you choose **TypeScript for both client and server**, you may additionally add:

```
  packages/
    shared/               # optional: TS-only shared types/helpers
```

But it’s not required for MVP.

---

## 7) Message Contract (MVP)

Client → Server

* `JOIN` `{ roomId: string }`
* `PING` `{ t0: number }`
* `START_REQ` `{ delayMs?: number }`

Server → Client

* `JOINED` `{ roomId: string }`
* `PONG` `{ t0: number, t1: number }`
* `START` `{ startAt: number }`

All messages:

* include `type: string`

---

## 8) Client Algorithm Notes

* Perform time sync immediately after connecting (and periodically every ~30–60s).
* Countdown scheduling:

    * coarse sleep until `ms_left - 25ms`
    * final alignment via `requestAnimationFrame` loop
* Keep countdown rendering interval modest (e.g. 30–60ms) to avoid heavy CPU.

---

## 9) Local Development UX

### Commands

* `npm run dev` runs both client and server
* `apps/server`:

    * `dev`: start WS server on `:8080`
* `apps/client`:

    * `dev`: start Vite on `:5173`

### Client runtime configuration

* UI input: `Server URL` (e.g. `ws://localhost:8080`)
* Also accept `?server=ws://...&room=abcd` in URL

---

## 10) Acceptance Criteria (MVP)

* Two browsers on different machines can join the same room via share link.
* Starting countdown from one client makes all clients reach “GO!” within a small observable delta.
* Server URL can be changed in client UI and persists across reload.
* Client and server can be built and run independently.
* Build artifacts can be launched **without repo access** (static client bundle + server bundle and/or Docker images).
* Repo contains baseline docs/configs: `AGENTS.md`, `README.md`, `.env.example`, `LICENSE`, `.editorconfig`, `.gitignore`.

---

## 11) Next Steps (Nice-to-have, later)

* Absolute-time scheduling (pick date/time)
* Room list / recent rooms
* Better time sync: robust filtering, drift tracking
* Multi-region coordinator / edge deployment
