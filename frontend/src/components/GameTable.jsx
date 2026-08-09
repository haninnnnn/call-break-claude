import React, { useState, useMemo } from "react";
import { Card } from "./Card.jsx";

const SUIT_SYMBOL = { S: "♠", H: "♥", D: "♦", C: "♣" };

export function GameTable({ state, room, selfId, onBid, onPlayCard }) {
  const [bidValue, setBidValue] = useState(4);

  const players = room.players; // [{id, name, seat}]
  const selfSeat = players.find((p) => p.id === selfId)?.seat ?? 0;

  // Order players relative to self: self at bottom, then left, top, right
  const ordered = useMemo(() => {
    const bySeat = [...players].sort((a, b) => a.seat - b.seat);
    const idx = bySeat.findIndex((p) => p.id === selfId);
    return [0, 1, 2, 3].map((i) => bySeat[(idx + i) % 4]);
  }, [players, selfId]);

  const [bottom, left, top, right] = ordered;

  const isMyTurn = state.turnPlayerId === selfId;
  const trickByPlayer = Object.fromEntries(state.currentTrick.map((t) => [t.playerId, t.card]));

  function seatLabel(player) {
    if (!player) return null;
    const isTurn = state.turnPlayerId === player.id;
    const bid = state.bids[player.id];
    const won = state.tricksWon[player.id];
    return (
      <div className={`seat-tag ${isTurn ? "turn" : ""} ${!player.connected ? "disconnected" : ""}`}>
        <span className="seat-tag-name">{player.name}{player.id === selfId ? " (you)" : ""}</span>
        <span className="seat-tag-stats mono">
          {bid !== undefined ? `bid ${bid}` : "—"} · won {won}
        </span>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <div className="table-topbar">
        <span className="mono">Round {state.currentRoundNumber} / {state.totalRounds}</span>
        <span className="mono">Room {room.id}</span>
      </div>

      <div className="felt-table">
        <div className="seat-pos seat-top">
          {seatLabel(top)}
          <div className="opp-hand">
            {Array.from({ length: state.handCounts[top?.id] || 0 }).map((_, i) => (
              <Card key={i} faceDown size="sm" />
            ))}
          </div>
        </div>

        <div className="seat-pos seat-left">
          {seatLabel(left)}
          <div className="opp-hand vertical">
            {Array.from({ length: state.handCounts[left?.id] || 0 }).map((_, i) => (
              <Card key={i} faceDown size="sm" />
            ))}
          </div>
        </div>

        <div className="seat-pos seat-right">
          {seatLabel(right)}
          <div className="opp-hand vertical">
            {Array.from({ length: state.handCounts[right?.id] || 0 }).map((_, i) => (
              <Card key={i} faceDown size="sm" />
            ))}
          </div>
        </div>

        <div className="trick-pit">
          {[top, right, bottom, left].map((p) =>
            p && trickByPlayer[p.id] ? (
              <div
                key={p.id}
                className={`pit-card pit-center ${
                  state.phase === "trickComplete" && state.trickWinnerId === p.id
                    ? "trick-winner"
                    : ""
                } ${state.phase === "trickComplete" ? "slide-to-winner" : ""}`}
              >
                <Card card={trickByPlayer[p.id]} size="sm" />
              </div>
            ) : null
          )}
          {state.phase === "bidding" && <p className="pit-message">Bidding…</p>}
          {state.phase === "roundOver" && (
            <p className="pit-message round-over-msg">Round over! Next round starting…</p>
          )}
        </div>

        <div className="seat-pos seat-bottom">{seatLabel(bottom)}</div>
      </div>

      <div className="hand-area">
        {state.phase === "bidding" && isMyTurn && (
          <div className="bid-panel">
            <p className="bid-prompt">How many tricks will you win this round?</p>
            <div className="bid-controls">
              <button className="btn btn-ghost" onClick={() => setBidValue((v) => Math.max(1, v - 1))}>−</button>
              <span className="bid-value mono">{bidValue}</span>
              <button className="btn btn-ghost" onClick={() => setBidValue((v) => Math.min(13, v + 1))}>+</button>
              <button className="btn btn-primary" onClick={() => onBid(bidValue)}>Place bid</button>
            </div>
          </div>
        )}
        {state.phase === "bidding" && !isMyTurn && (
          <p className="wait-message">Waiting for {players.find((p) => p.id === state.turnPlayerId)?.name} to bid…</p>
        )}
        {state.phase === "playing" && !isMyTurn && (
          <p className="wait-message">Waiting for {players.find((p) => p.id === state.turnPlayerId)?.name} to play…</p>
        )}

        <div className="my-hand">
          {state.yourHand.map((card) => {
            const legal = state.legalMoves.some((c) => c.id === card.id);
            const playable = state.phase === "playing" && isMyTurn && legal;
            return (
              <Card
                key={card.id}
                card={card}
                disabled={state.phase === "playing" && isMyTurn && !legal}
                onClick={playable ? () => onPlayCard(card) : undefined}
              />
            );
          })}
        </div>
      </div>

      <ScoreStrip state={state} players={players} selfId={selfId} />
    </div>
  );
}

function ScoreStrip({ state, players, selfId }) {
  return (
    <div className="score-strip">
      {players.map((p) => (
        <div key={p.id} className={`score-chip ${p.id === selfId ? "self" : ""}`}>
          <span className="score-chip-name">{p.name}</span>
          <span className="score-chip-value mono">{state.totalScores[p.id]?.toFixed(1)}</span>
        </div>
      ))}
    </div>
  );
}
