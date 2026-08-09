import React, { useEffect, useState } from "react";
import { socket, emitAsync } from "./socket.js";
import { Lobby } from "./components/Lobby.jsx";
import { WaitingRoom } from "./components/WaitingRoom.jsx";
import { GameTable } from "./components/GameTable.jsx";
import { GameOver } from "./components/GameOver.jsx";
import "./components/Card.css";
import "./components/Lobby.css";
import "./components/WaitingRoom.css";
import "./components/GameTable.css";
import "./components/GameOver.css";

export default function App() {
  const [room, setRoom] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    function handleRoomUpdate(r) {
      setRoom(r);
      if (r.status !== "in_progress" && r.status !== "finished") setGameState(null);
    }
    function handleGameState(s) {
      setGameState(s);
    }
    socket.on("room:update", handleRoomUpdate);
    socket.on("game:state", handleGameState);
    return () => {
      socket.off("room:update", handleRoomUpdate);
      socket.off("game:state", handleGameState);
    };
  }, []);

  async function handleCreate(name, totalRounds) {
    setError("");
    try {
      const res = await emitAsync("room:create", { name, totalRounds });
      setRoom(res.room);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleJoin(name, code) {
    setError("");
    try {
      const res = await emitAsync("room:join", { code, name });
      setRoom(res.room);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleStart() {
    try {
      await emitAsync("room:start", {});
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleBid(bid) {
    try {
      await emitAsync("game:bid", { bid });
    } catch (err) {
      setError(err.message);
    }
  }

  async function handlePlayCard(card) {
    try {
      await emitAsync("game:playCard", { card });
    } catch (err) {
      setError(err.message);
    }
  }

  function handleLeave() {
    window.location.reload();
  }

  if (!room) {
    return <Lobby onCreate={handleCreate} onJoin={handleJoin} error={error} />;
  }

  if (room.status === "waiting") {
    return <WaitingRoom room={room} selfId={socket.id} onStart={handleStart} />;
  }

  if (gameState?.phase === "gameOver") {
    return <GameOver state={gameState} room={room} selfId={socket.id} onLeave={handleLeave} />;
  }

  if (room.status === "in_progress" && gameState) {
    return (
      <GameTable
        state={gameState}
        room={room}
        selfId={socket.id}
        onBid={handleBid}
        onPlayCard={handlePlayCard}
      />
    );
  }

  return (
    <div className="lobby-wrap">
      <p>Loading…</p>
    </div>
  );
}
