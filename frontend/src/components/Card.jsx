import React from "react";

const SUIT_SYMBOL = { S: "♠", H: "♥", D: "♦", C: "♣" };
const RED_SUITS = new Set(["H", "D"]);

export function Card({ card, size = "md", faceDown = false, disabled = false, selected = false, onClick }) {
  const dims = {
    sm: { w: 44, h: 62, font: 13 },
    md: { w: 64, h: 90, font: 17 },
    lg: { w: 84, h: 118, font: 21 },
  }[size];

  const clickable = typeof onClick === "function" && !disabled && !faceDown;

  if (faceDown) {
    return (
      <div
        className="card-back"
        style={{ width: dims.w, height: dims.h }}
        aria-label="Face-down card"
      >
        <div className="card-back-pattern" />
      </div>
    );
  }

  const isRed = RED_SUITS.has(card.suit);
  const symbol = SUIT_SYMBOL[card.suit];

  return (
    <button
      type="button"
      className={`card-face ${isRed ? "card-red" : "card-black"} ${disabled ? "card-disabled" : ""} ${selected ? "card-selected" : ""}`}
      style={{ width: dims.w, height: dims.h, fontSize: dims.font, cursor: clickable ? "pointer" : "default" }}
      onClick={clickable ? () => onClick(card) : undefined}
      disabled={disabled}
      aria-label={`${card.rank} of ${card.suit === "S" ? "Spades" : card.suit === "H" ? "Hearts" : card.suit === "D" ? "Diamonds" : "Clubs"}`}
    >
      <span className="card-corner card-corner-top">
        <span className="card-rank">{card.rank}</span>
        <span className="card-suit-mini">{symbol}</span>
      </span>
      <span className="card-suit-center">{symbol}</span>
      <span className="card-corner card-corner-bottom">
        <span className="card-rank">{card.rank}</span>
        <span className="card-suit-mini">{symbol}</span>
      </span>
    </button>
  );
}
