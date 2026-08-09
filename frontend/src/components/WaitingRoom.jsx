import React, { useState } from "react";

export function WaitingRoom({ room, selfId, onStart }) {
  const [copied, setCopied] = useState(false);
  const isHost = room.hostId === selfId;
  const seats = [0, 1, 2, 3].map((seat) => room.players.find((p) => p.seat === seat) || null);

  function copyCode() {
    navigator.clipboard?.writeText(room.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="waiting-wrap">
      <div className="ticket">
        <div className="ticket-main">
          <p className="ticket-label">Room code</p>
          <button className="ticket-code mono" onClick={copyCode}>
            {room.id.split("").map((ch, i) => (
              <span key={i}>{ch}</span>
            ))}
          </button>
          <p className="ticket-hint">{copied ? "Copied!" : "Tap to copy, share with friends"}</p>
        </div>
        <div className="ticket-stub">
          <span className="ticket-suit">♠</span>
          <span className="mono ticket-rounds">{room.totalRounds} rds</span>
        </div>
      </div>

      <div className="seats">
        {seats.map((player, i) => (
          <div key={i} className={`seat ${player ? "filled" : "empty"}`}>
            {player ? (
              <>
                <div className="seat-avatar">{player.name.slice(0, 1).toUpperCase()}</div>
                <span className="seat-name">
                  {player.name}
                  {player.id === selfId && " (you)"}
                </span>
                {player.id === room.hostId && <span className="seat-host-badge">Host</span>}
              </>
            ) : (
              <span className="seat-waiting">Waiting for player…</span>
            )}
          </div>
        ))}
      </div>

      {isHost ? (
        <button
          className="btn btn-primary"
          disabled={room.players.length < 4}
          onClick={onStart}
        >
          {room.players.length < 4 ? `Waiting for ${4 - room.players.length} more…` : "Start game"}
        </button>
      ) : (
        <p className="waiting-note">Waiting for the host to start the game…</p>
      )}
    </div>
  );
}
