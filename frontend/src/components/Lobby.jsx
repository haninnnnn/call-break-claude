import React, { useState } from "react";

export function Lobby({ onCreate, onJoin, error }) {
  const [mode, setMode] = useState("create"); // "create" | "join"
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [rounds, setRounds] = useState(5);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      if (mode === "create") await onCreate(name.trim(), rounds);
      else await onJoin(name.trim(), code.trim());
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="lobby-wrap">
      <div className="lobby-card">
        <div className="lobby-header">
          <span className="lobby-suit">♠</span>
          <h1>Call Break</h1>
          <p className="lobby-tagline">Deal in your friends. Bid true, break spades.</p>
        </div>

        <div className="lobby-tabs">
          <button
            type="button"
            className={`lobby-tab ${mode === "create" ? "active" : ""}`}
            onClick={() => setMode("create")}
          >
            Create room
          </button>
          <button
            type="button"
            className={`lobby-tab ${mode === "join" ? "active" : ""}`}
            onClick={() => setMode("join")}
          >
            Join room
          </button>
        </div>

        <form onSubmit={handleSubmit} className="lobby-form">
          <label className="lobby-label">
            Your name
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              maxLength={20}
              required
            />
          </label>

          {mode === "create" ? (
            <label className="lobby-label">
              Number of rounds
              <div className="rounds-picker">
                {[5, 7, 8].map((r) => (
                  <button
                    type="button"
                    key={r}
                    className={`rounds-option ${rounds === r ? "active" : ""}`}
                    onClick={() => setRounds(r)}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </label>
          ) : (
            <label className="lobby-label">
              Room code
              <input
                className="input mono"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="X7K9M"
                maxLength={5}
                style={{ letterSpacing: "0.15em", textTransform: "uppercase" }}
                required
              />
            </label>
          )}

          {error && <p className="lobby-error">{error}</p>}

          <button type="submit" className="btn btn-primary" disabled={busy} style={{ width: "100%" }}>
            {busy ? "One moment…" : mode === "create" ? "Create room" : "Join room"}
          </button>
        </form>
      </div>
    </div>
  );
}
