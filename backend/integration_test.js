const { io: ioClient } = require("socket.io-client");
require("./server"); // starts the server on PORT

const PORT = process.env.PORT || 3001;
const URL = `http://localhost:${PORT}`;

function connect(name) {
  return new Promise((resolve) => {
    const socket = ioClient(URL);
    socket.on("connect", () => resolve(socket));
  });
}

function emit(socket, event, payload) {
  return new Promise((resolve, reject) => {
    socket.emit(event, payload, (res) => {
      if (res.ok) resolve(res);
      else reject(new Error(res.error));
    });
  });
}

async function run() {
  const sockets = [];
  for (let i = 0; i < 4; i++) sockets.push(await connect(`Player${i + 1}`));

  const latestState = new Map(); // socket -> latest game:state
  sockets.forEach((s) => s.on("game:state", (state) => latestState.set(s, state)));

  // Player 1 creates a room
  const { room } = await emit(sockets[0], "room:create", { name: "Player1", totalRounds: 5 });
  console.log("Room created:", room.id);

  // Others join
  for (let i = 1; i < 4; i++) {
    await emit(sockets[i], "room:join", { code: room.id, name: `Player${i + 1}` });
  }
  console.log("All 4 players joined");

  // Host starts
  await emit(sockets[0], "room:start", {});
  await new Promise((r) => setTimeout(r, 200)); // let broadcasts land
  console.log("Game started, phase:", latestState.get(sockets[0]).phase);

  // Play until game over
  let rounds = 0;
  while (latestState.get(sockets[0]).phase !== "gameOver") {
    const state = latestState.get(sockets[0]);
    const turnPlayerId = state.turnPlayerId;
    const turnSocket = sockets.find((s) => s.id === turnPlayerId);
    const turnState = latestState.get(turnSocket);

    if (turnState.phase === "bidding") {
      const bid = 1 + Math.floor(Math.random() * 13);
      await emit(turnSocket, "game:bid", { bid });
    } else if (turnState.phase === "playing") {
      const legal = turnState.legalMoves;
      const card = legal[Math.floor(Math.random() * legal.length)];
      await emit(turnSocket, "game:playCard", { card });
    }
    await new Promise((r) => setTimeout(r, 5));

    const newRoundNum = latestState.get(sockets[0]).currentRoundNumber;
    if (newRoundNum > rounds) {
      rounds = newRoundNum;
      console.log(`-- entering round ${rounds} --`);
    }
  }

  console.log("\nGame over! Final scores:", latestState.get(sockets[0]).totalScores);
  console.log("Rounds played:", latestState.get(sockets[0]).roundHistory.length);

  // Test illegal move rejection
  console.log("\nTesting illegal move rejection...");
  try {
    await emit(sockets[0], "game:bid", { bid: 99 });
    console.log("FAIL: should have rejected invalid bid");
  } catch (err) {
    console.log("Correctly rejected:", err.message);
  }

  sockets.forEach((s) => s.close());
  process.exit(0);
}

run().catch((err) => {
  console.error("TEST FAILED:", err);
  process.exit(1);
});
