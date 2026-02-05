import "./styles.css";
import { createSample, selectBestSample } from "./timeSync";


const statusEl = document.getElementById("connection-status") as HTMLSpanElement;
const serverUrlInput = document.getElementById("server-url") as HTMLInputElement;
const connectButton = document.getElementById("connect") as HTMLButtonElement;
const createRoomButton = document.getElementById("create-room") as HTMLButtonElement;
const joinRoomButton = document.getElementById("join-room") as HTMLButtonElement;
const roomIdInput = document.getElementById("room-id") as HTMLInputElement;
const shareLinkInput = document.getElementById("share-link") as HTMLInputElement;
const countdownEl = document.getElementById("countdown") as HTMLDivElement;
const delayInput = document.getElementById("delay-ms") as HTMLInputElement;
const startButton = document.getElementById("start") as HTMLButtonElement;

let socket: WebSocket | null = null;
let reconnectTimeout: number | null = null;
let reconnectAttempts = 0;
let currentRoomId: string | null = null;
let offsetMs = 0;
let startAt: number | null = null;
let countdownFrame: number | null = null;
let countdownTimeout: number | null = null;
let activeSamples: ReturnType<typeof createSample>[] | null = null;
let timeSyncInterval: number | null = null;

const pendingPings = new Map<number, boolean>();

const setStatus = (state: "connected" | "reconnecting" | "disconnected") => {
  statusEl.textContent = state;
  statusEl.className = `status ${state}`;
};

const getStoredServerUrl = () => {
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get("server");
  if (fromQuery) {
    return fromQuery;
  }
  const stored = localStorage.getItem("serverUrl");
  if (stored) {
    return stored;
  }
  return import.meta.env.VITE_SERVER_URL ?? "ws://localhost:8080";
};

const updateShareLink = () => {
  if (!currentRoomId) {
    shareLinkInput.value = "";
    return;
  }
  const serverUrl = serverUrlInput.value.trim();
  const link = `${window.location.origin}${window.location.pathname}?server=${encodeURIComponent(
    serverUrl
  )}&room=${encodeURIComponent(currentRoomId)}`;
  shareLinkInput.value = link;
};

const sendMessage = (payload: object) => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(payload));
  }
};

const joinRoom = (roomId: string) => {
  currentRoomId = roomId;
  roomIdInput.value = roomId;
  updateShareLink();
  sendMessage({ type: "JOIN", roomId });
};

const scheduleReconnect = () => {
  if (reconnectTimeout) {
    window.clearTimeout(reconnectTimeout);
  }
  setStatus("reconnecting");
  const delay = Math.min(5000, 500 + reconnectAttempts * 500);
  reconnectTimeout = window.setTimeout(() => {
    reconnectAttempts += 1;
    connect();
  }, delay);
};

const handleCountdown = () => {
  if (!startAt) {
    countdownEl.textContent = "--";
    return;
  }

  const now = Date.now() + offsetMs;
  const msLeft = startAt - now;

  if (msLeft <= 0) {
    countdownEl.textContent = "GO!";
    return;
  }

  countdownEl.textContent = (msLeft / 1000).toFixed(3);

  if (msLeft > 150) {
    const nextTick = Math.min(100, msLeft - 100);
    countdownTimeout = window.setTimeout(() => {
      handleCountdown();
    }, nextTick);
  } else {
    countdownFrame = window.requestAnimationFrame(() => handleCountdown());
  }
};

const startCountdown = (startAtMs: number) => {
  startAt = startAtMs;
  if (countdownFrame) {
    cancelAnimationFrame(countdownFrame);
  }
  if (countdownTimeout) {
    window.clearTimeout(countdownTimeout);
  }
  handleCountdown();
};

const requestTimeSync = async () => {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    return;
  }
  pendingPings.clear();
  const samples: ReturnType<typeof createSample>[] = [];
  activeSamples = samples;
  const totalSamples = 12;

  for (let i = 0; i < totalSamples; i += 1) {
    const t0 = Date.now();
    pendingPings.set(t0, true);
    sendMessage({ type: "PING", t0 });
    await new Promise((resolve) => setTimeout(resolve, 40));
  }

  await new Promise((resolve) => setTimeout(resolve, 500));
  pendingPings.clear();

  if (samples.length > 0) {
    const best = selectBestSample(samples);
    if (best) {
      offsetMs = best.offset;
    }
  }
  activeSamples = null;
};

const connect = () => {
  const serverUrl = serverUrlInput.value.trim();
  if (!serverUrl) {
    return;
  }
  if (reconnectTimeout) {
    window.clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
  if (socket) {
    socket.close();
  }
  socket = new WebSocket(serverUrl);
  const activeSocket = socket;
  setStatus("reconnecting");

  socket.addEventListener("open", async () => {
    if (activeSocket !== socket) {
      return;
    }
    reconnectAttempts = 0;
    setStatus("connected");
    localStorage.setItem("serverUrl", serverUrl);
    await requestTimeSync();
    if (timeSyncInterval) {
      window.clearInterval(timeSyncInterval);
    }
    timeSyncInterval = window.setInterval(() => {
      requestTimeSync();
    }, 60_000);
    if (currentRoomId) {
      joinRoom(currentRoomId);
    }
  });

  socket.addEventListener("message", (event) => {
    if (activeSocket !== socket) {
      return;
    }
    try {
      const message = JSON.parse(event.data) as { type?: string; [key: string]: unknown };
      if (message.type === "JOINED") {
        return;
      }
      if (message.type === "PONG") {
        const t0 = typeof message.t0 === "number" ? message.t0 : null;
        const t1 = typeof message.t1 === "number" ? message.t1 : null;
        if (t0 === null || t1 === null) {
          return;
        }
        const ping = pendingPings.get(t0);
        if (!ping) {
          return;
        }
        const t2 = Date.now();
        pendingPings.delete(t0);
        const sample = createSample(t0, t1, t2);
        if (activeSamples) {
          activeSamples.push(sample);
        }
        return;
      }
      if (message.type === "START") {
        const startAtMs = typeof message.startAt === "number" ? message.startAt : null;
        if (startAtMs !== null) {
          startCountdown(startAtMs);
        }
      }
    } catch {
      return;
    }
  });

  socket.addEventListener("close", () => {
    if (activeSocket !== socket) {
      return;
    }
    setStatus("disconnected");
    if (timeSyncInterval) {
      window.clearInterval(timeSyncInterval);
      timeSyncInterval = null;
    }
    scheduleReconnect();
  });
};

connectButton.addEventListener("click", () => connect());
serverUrlInput.addEventListener("change", () => updateShareLink());

createRoomButton.addEventListener("click", () => {
  const roomId = Math.random().toString(36).slice(2, 8);
  joinRoom(roomId);
});

joinRoomButton.addEventListener("click", () => {
  const roomId = roomIdInput.value.trim();
  if (roomId) {
    joinRoom(roomId);
  }
});

startButton.addEventListener("click", () => {
  const delayMs = Number(delayInput.value);
  sendMessage({ type: "START_REQ", delayMs });
});

serverUrlInput.value = getStoredServerUrl();
const params = new URLSearchParams(window.location.search);
const roomFromQuery = params.get("room");
if (roomFromQuery) {
  currentRoomId = roomFromQuery;
  roomIdInput.value = roomFromQuery;
  updateShareLink();
}

connect();
