# Sync Timer (Room-based)

A simple room-based tool where multiple clients see the same countdown and hit **0** as simultaneously as possible using a small WebSocket coordinator.

## Quickstart

### Prerequisites

- Node.js 18+
- npm

### Install

```
npm install
```

### Development

```
npm run dev
```

- Server: `ws://localhost:8080`
- Client: `http://localhost:5173`

### Build

```
npm run build
```

Build outputs:

- Client: `apps/client/dist`
- Server: `apps/server/dist`

### Run production server

```
node apps/server/dist/index.js
```

### Docker

```
docker-compose up --build
```

## Scripts

- `npm run dev` — start server + client
- `npm run build` — build server + client
- `npm run test` — run unit tests
- `npm run lint` — lint

## Troubleshooting

- Ensure the client uses the correct `Server URL` (e.g. `ws://localhost:8080`).
- If CORS/origin checks fail, update `ALLOWED_ORIGINS` in `.env`.
