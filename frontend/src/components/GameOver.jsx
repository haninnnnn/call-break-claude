import React from "react";

export function GameOver({ state, room, selfId, onLeave }) {
  const ranked = room.players
    .map((p) => ({ ...p, score: state.totalScores[p.id] ?? 0 }))
    .sort((a, b) => b.score - a.score);

  return (
    <div className="waiting-wrap">
      <div className="ticket" style={{ maxWidth: 460 }}>
        <div className="ticket-main">
          <p className="ticket-label">Game over</p>
          <h2 style={{ fontSize: "1.6rem", margin: "4px 0 18px" }}>{ranked[0].name} wins</h2>
          <div className="final-scores">
            {ranked.map((p, i) => (
              <div key={p.id} className={`final-row ${p.id === selfId ? "self" : ""}`}>
                <span className="final-rank mono">{i + 1}</span>
                <span className="final-name">{p.name}{p.id === selfId ? " (you)" : ""}</span>
                <span className="final-score mono">{p.score.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="ticket-stub">
          <span className="ticket-suit">♠</span>
        </div>
      </div>
      <button className="btn btn-primary" onClick={onLeave}>Back to lobby</button>
    </div>
  );
}
