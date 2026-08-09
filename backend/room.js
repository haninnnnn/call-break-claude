const { GameState } = require("./gameState");

function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no O/0/I/1 to avoid confusion
  let code = "";
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

class Room {
  constructor(hostId, hostName, totalRounds) {
    this.id = generateRoomCode();
    this.hostId = hostId;
    this.totalRounds = totalRounds;
    this.status = "waiting"; // "waiting" | "in_progress" | "finished"
    this.players = [{ id: hostId, name: hostName, seat: 0, connected: true }];
    this.game = null; // GameState, created when the game starts
  }

  addPlayer(playerId, name) {
    if (this.status !== "waiting") throw new Error("Game already started");
    if (this.players.length >= 4) throw new Error("Room is full");
    if (this.players.some((p) => p.id === playerId)) throw new Error("Already in this room");
    this.players.push({ id: playerId, name, seat: this.players.length, connected: true });
  }

  removePlayer(playerId) {
    if (this.status === "waiting") {
      this.players = this.players.filter((p) => p.id !== playerId);
      // reassign seats
      this.players.forEach((p, i) => (p.seat = i));
      if (this.hostId === playerId && this.players.length > 0) {
        this.hostId = this.players[0].id; // host transfers to next player
      }
    } else {
      // mid-game: mark disconnected, keep seat reserved for reconnect
      const p = this.players.find((p) => p.id === playerId);
      if (p) p.connected = false;
    }
  }

  reconnectPlayer(playerId) {
    const p = this.players.find((p) => p.id === playerId);
    if (p) p.connected = true;
  }

  canStart() {
    return this.status === "waiting" && this.players.length === 4;
  }

  start() {
    if (!this.canStart()) throw new Error("Room is not ready to start");
    const playerIds = this.players.sort((a, b) => a.seat - b.seat).map((p) => p.id);
    this.game = new GameState(playerIds, this.totalRounds);
    this.status = "in_progress";
  }

  playerName(playerId) {
    return this.players.find((p) => p.id === playerId)?.name;
  }

  toSummary() {
    return {
      id: this.id,
      hostId: this.hostId,
      totalRounds: this.totalRounds,
      status: this.status,
      players: this.players.map((p) => ({ id: p.id, name: p.name, seat: p.seat, connected: p.connected })),
    };
  }
}

class RoomManager {
  constructor() {
    this.rooms = new Map(); // code -> Room
  }

  createRoom(hostId, hostName, totalRounds = 5) {
    let room = new Room(hostId, hostName, totalRounds);
    // extremely unlikely collision, but regenerate if so
    while (this.rooms.has(room.id)) room = new Room(hostId, hostName, totalRounds);
    this.rooms.set(room.id, room);
    return room;
  }

  getRoom(code) {
    return this.rooms.get(code?.toUpperCase());
  }

  deleteRoom(code) {
    this.rooms.delete(code);
  }
}

module.exports = { Room, RoomManager, generateRoomCode };
