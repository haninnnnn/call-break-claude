const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { RoomManager } = require("./room");

const app = express();
const server = http.createServer(app);
// Set FRONTEND_URL in Render's environment variables once your frontend is deployed.
// Falls back to "*" (any origin) so local testing works before that's set.
const allowedOrigin = process.env.FRONTEND_URL || "*";
const io = new Server(server, {
  cors: { origin: allowedOrigin },
});

const roomManager = new RoomManager();
// Track which room + name each socket belongs to, for disconnect handling
const socketMeta = new Map(); // socketId -> { roomCode, playerId }

function broadcastRoom(room) {
  io.to(room.id).emit("room:update", room.toSummary());
}

// Send each player their own private view (hand + legal moves), and a shared public view
function broadcastGameState(room) {
  if (!room.game) return;
  for (const player of room.players) {
    io.to(player.id).emit("game:state", room.game.getStateForPlayer(player.id));
  }
}

io.on("connection", (socket) => {
  // --- Create room ---
  socket.on("room:create", ({ name, totalRounds }, callback) => {
    try {
      const room = roomManager.createRoom(socket.id, name, totalRounds || 5);
      socket.join(room.id);
      socketMeta.set(socket.id, { roomCode: room.id, playerId: socket.id });
      callback({ ok: true, room: room.toSummary() });
    } catch (err) {
      callback({ ok: false, error: err.message });
    }
  });

  // --- Join room by code ---
  socket.on("room:join", ({ code, name }, callback) => {
    try {
      const room = roomManager.getRoom(code);
      if (!room) throw new Error("Room not found");
      room.addPlayer(socket.id, name);
      socket.join(room.id);
      socketMeta.set(socket.id, { roomCode: room.id, playerId: socket.id });
      callback({ ok: true, room: room.toSummary() });
      broadcastRoom(room);
    } catch (err) {
      callback({ ok: false, error: err.message });
    }
  });

  // --- Host starts the game ---
  socket.on("room:start", (_, callback) => {
    try {
      const meta = socketMeta.get(socket.id);
      const room = roomManager.getRoom(meta?.roomCode);
      if (!room) throw new Error("Room not found");
      if (room.hostId !== socket.id) throw new Error("Only the host can start the game");
      room.start();
      callback({ ok: true });
      broadcastRoom(room);
      broadcastGameState(room);
    } catch (err) {
      callback({ ok: false, error: err.message });
    }
  });

  // --- Bidding ---
  socket.on("game:bid", ({ bid }, callback) => {
    try {
      const meta = socketMeta.get(socket.id);
      const room = roomManager.getRoom(meta?.roomCode);
      if (!room?.game) throw new Error("Game not in progress");
      room.game.submitBid(socket.id, bid);
      callback({ ok: true });
      broadcastGameState(room);
    } catch (err) {
      callback({ ok: false, error: err.message });
    }
  });

  // --- Play a card ---
  socket.on("game:playCard", ({ card }, callback) => {
    try {
      const meta = socketMeta.get(socket.id);
      const room = roomManager.getRoom(meta?.roomCode);
      if (!room?.game) throw new Error("Game not in progress");
      room.game.playCard(socket.id, card);
      callback({ ok: true });
      broadcastGameState(room); // broadcast trickComplete phase (shows all 4 cards)

      if (room.game.phase === "trickComplete") {
        // 0.75s — let clients animate cards sliding to winner
        setTimeout(() => {
          if (!room.game) return;
          room.game.resolveTrickComplete();
          broadcastGameState(room);

          if (room.game.phase === "roundOver") {
            // 3s — show round summary before next round starts
            setTimeout(() => {
              if (!room.game) return;
              room.game.startNextRound();
              broadcastGameState(room);
            }, 3000);
          }

          if (room.game.phase === "gameOver") {
            room.status = "finished";
            broadcastRoom(room);
          }
        }, 750);
      }

      if (room.game.phase === "gameOver") {
        room.status = "finished";
        broadcastRoom(room);
      }
    } catch (err) {
      callback({ ok: false, error: err.message });
    }
  });

  // --- Disconnect handling ---
  socket.on("disconnect", () => {
    const meta = socketMeta.get(socket.id);
    if (!meta) return;
    const room = roomManager.getRoom(meta.roomCode);
    if (!room) return;

    room.removePlayer(socket.id);
    socketMeta.delete(socket.id);

    if (room.players.length === 0) {
      roomManager.deleteRoom(room.id);
    } else {
      broadcastRoom(room);
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Call Break server running on port ${PORT}`));

module.exports = { app, server, io, roomManager };
