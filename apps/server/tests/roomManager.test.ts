import { describe, expect, it } from "vitest";
import { RoomManager, ClientConnection } from "../src/roomManager.js";

const createConnection = () => {
  const messages: string[] = [];
  const connection: ClientConnection = {
    id: `c_${Math.random()}`,
    isOpen: () => true,
    sendJson: (payload) => {
      messages.push(JSON.stringify(payload));
    }
  };
  return { connection, messages };
};

describe("RoomManager", () => {
  it("broadcasts START to all room members", () => {
    const manager = new RoomManager();
    const first = createConnection();
    const second = createConnection();

    manager.join("room1", first.connection);
    manager.join("room1", second.connection);

    manager.broadcastStart("room1", 12345);

    expect(first.messages).toEqual([JSON.stringify({ type: "START", startAt: 12345 })]);
    expect(second.messages).toEqual([JSON.stringify({ type: "START", startAt: 12345 })]);
  });
});
