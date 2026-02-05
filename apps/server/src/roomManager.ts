export type SendJson = (payload: object) => void;

export interface ClientConnection {
  id: string;
  isOpen: () => boolean;
  sendJson: SendJson;
}

export class RoomManager {
  private readonly rooms = new Map<string, Set<ClientConnection>>();
  private readonly connectionRooms = new Map<string, string>();

  join(roomId: string, connection: ClientConnection) {
    const existingRoom = this.connectionRooms.get(connection.id);
    if (existingRoom) {
      this.leave(connection);
    }
    const room = this.rooms.get(roomId) ?? new Set<ClientConnection>();
    room.add(connection);
    this.rooms.set(roomId, room);
    this.connectionRooms.set(connection.id, roomId);
  }

  leave(connection: ClientConnection) {
    const roomId = this.connectionRooms.get(connection.id);
    if (!roomId) {
      return;
    }
    const room = this.rooms.get(roomId);
    if (room) {
      room.delete(connection);
      if (room.size === 0) {
        this.rooms.delete(roomId);
      }
    }
    this.connectionRooms.delete(connection.id);
  }

  getRoomId(connection: ClientConnection) {
    return this.connectionRooms.get(connection.id);
  }

  broadcastStart(roomId: string, startAt: number) {
    const room = this.rooms.get(roomId);
    if (!room) {
      return;
    }
    room.forEach((connection) => {
      if (connection.isOpen()) {
        connection.sendJson({ type: "START", startAt });
      }
    });
  }
}
