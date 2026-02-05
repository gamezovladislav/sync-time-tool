import http from "http";
import { WebSocket, WebSocketServer } from "ws";
import type { IncomingMessage } from "http";
import type { RawData } from "ws";
import { config, isOriginAllowed } from "./config.js";
import { RateLimiter } from "./rateLimiter.js";
import { RoomManager, ClientConnection } from "./roomManager.js";

const MAX_MESSAGE_SIZE = 10_000;
const DEFAULT_DELAY_MS = 5000;

const server = http.createServer((req, res) => {
  if (req.url === "/healthz") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("ok");
    return;
  }
  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("not found");
});

const wss = new WebSocketServer({ server, maxPayload: MAX_MESSAGE_SIZE });
const roomManager = new RoomManager();
let connectionCounter = 0;

const log = (payload: Record<string, unknown>) => {
  console.log(JSON.stringify({ level: "info", ...payload }));
};

const createConnection = (ws: WebSocket): ClientConnection => {
  const id = `c_${Date.now()}_${connectionCounter++}`;
  return {
    id,
    isOpen: () => ws.readyState === WebSocket.OPEN,
    sendJson: (payload: object) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(payload));
      }
    }
  };
};

wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
  const origin = req.headers.origin;
  if (!isOriginAllowed(origin)) {
    ws.close(1008, "Origin not allowed");
    log({ eventType: "ORIGIN_REJECTED", origin });
    return;
  }

  const connection = createConnection(ws);
  const pingLimiter = new RateLimiter(10_000, 25);
  const startLimiter = new RateLimiter(10_000, 5);

  log({ eventType: "CONNECTED", connectionId: connection.id });

  ws.on("message", (data: RawData) => {
    const text = typeof data === "string" ? data : data.toString();
    if (text.length > MAX_MESSAGE_SIZE) {
      ws.close(1009, "Message too large");
      return;
    }
    let message: { type?: string; [key: string]: unknown };
    try {
      message = JSON.parse(text);
    } catch {
      return;
    }

    if (!message.type) {
      return;
    }

    if (message.type === "JOIN") {
      const roomId = typeof message.roomId === "string" ? message.roomId.trim() : "";
      if (!roomId || roomId.length > 32) {
        return;
      }
      roomManager.join(roomId, connection);
      connection.sendJson({ type: "JOINED", roomId });
      log({ eventType: "JOIN", roomId, connectionId: connection.id });
      return;
    }

    if (message.type === "PING") {
      if (!pingLimiter.allow()) {
        return;
      }
      const t0 = typeof message.t0 === "number" ? message.t0 : undefined;
      if (t0 === undefined) {
        return;
      }
      connection.sendJson({ type: "PONG", t0, t1: Date.now() });
      return;
    }

    if (message.type === "START_REQ") {
      if (!startLimiter.allow()) {
        return;
      }
      const delayMs = typeof message.delayMs === "number" ? message.delayMs : DEFAULT_DELAY_MS;
      const clampedDelay = Math.min(Math.max(delayMs, 0), 60_000);
      const roomId = roomManager.getRoomId(connection);
      if (!roomId) {
        return;
      }
      const startAt = Date.now() + Math.max(clampedDelay, config.minLeadMs);
      roomManager.broadcastStart(roomId, startAt);
      log({ eventType: "START", roomId, startAt, connectionId: connection.id });
    }
  });

  ws.on("close", () => {
    roomManager.leave(connection);
    log({ eventType: "DISCONNECTED", connectionId: connection.id });
  });
});

server.listen(config.port, () => {
  log({ eventType: "LISTENING", port: config.port });
});
