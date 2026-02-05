# Sync Timer (Room-based)

A simple room-based tool where multiple clients see the same countdown and hit **0** as simultaneously as possible using a small WebSocket coordinator.

## Dev Note:
This project is fully implemented with Chatgpt 5.2 Thinking (extended) in web UI to investigate the initial idea. <br>
Imlementator: Junie CLI v.624.1 with Codex 5.2. 
```
Session Cost                                                                                                                                                                                                      
 Here is a breakdown of the cost for the current session:                                                                                                                                                          
                                                                                                                                                                                                                   
 Total usage                                                                                                                                                                                                       
 ───────────                                                                                                                                                                                                       
 Total cost:        $1.34                                                                                                                                                                                          
 Total tokens used: 308484                                                                                                                                                                                         
                                                                                                                                                                                                                   
 Usage by model                                                                                                                                                                                                    
 ──────────────                                                                                                                                                                                                    
 gpt-5.2-codex:           243482 tokens used, 2167168 cached tokens, 0 cached tokens created, $1.3                                                                                                                 
 gpt-4.1-mini-2025-04-14: 52949 tokens used, 3328 cached tokens, 0 cached tokens created, $0.0239                                                                                                                  
 gpt-5-2025-08-07:        12053 tokens used, 1536 cached tokens, 0 cached tokens created, $0.0159   
```
Initially this repo contained only file "reqs.md" and AI Agent was run with prompt `need to impleemnt the project using reueiremntes from @reqs.md`



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
