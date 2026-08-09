const { GameState } = require("./gameState");
const { legalMoves } = require("./trick");

function simulateGame(totalRounds = 5) {
  const players = ["p1", "p2", "p3", "p4"];
  const game = new GameState(players, totalRounds);
  let safety = 0;

  while (game.phase !== "gameOver") {
    safety++;
    if (safety > 100000) throw new Error("Infinite loop detected");

    if (game.phase === "bidding") {
      const pid = game.currentPlayerId();
      // random valid bid
      const bid = 1 + Math.floor(Math.random() * 13);
      game.submitBid(pid, bid);
    } else if (game.phase === "playing") {
      const pid = game.currentPlayerId();
      const hand = game.hands[pid];
      const legal = legalMoves(hand, game.leadSuit);
      const card = legal[Math.floor(Math.random() * legal.length)];
      game.playCard(pid, card);
    }
  }

  return game;
}

// Run a few simulations and validate invariants
for (let run = 0; run < 20; run++) {
  const totalRounds = [5, 7, 8][run % 3];
  const game = simulateGame(totalRounds);

  // Invariant checks
  if (game.roundHistory.length !== totalRounds) {
    throw new Error(`Expected ${totalRounds} rounds, got ${game.roundHistory.length}`);
  }

  for (const round of game.roundHistory) {
    const tricksSum = Object.values(round.tricksWon).reduce((a, b) => a + b, 0);
    if (tricksSum !== 13) throw new Error(`Round ${round.roundNumber}: tricks sum to ${tricksSum}, expected 13`);

    // verify score formula
    for (const pid of game.playerIds) {
      const bid = round.bids[pid];
      const won = round.tricksWon[pid];
      const expected = won >= bid ? bid * 10 + (won - bid) * 0.1 : -10 * bid;
      const actual = round.scoresThisRound[pid];
      if (Math.abs(actual - expected) > 1e-9) {
        throw new Error(`Score mismatch: bid=${bid} won=${won} expected=${expected} actual=${actual}`);
      }
    }
  }

  // total score should equal sum of round scores
  for (const pid of game.playerIds) {
    const sum = game.roundHistory.reduce((acc, r) => acc + r.scoresThisRound[pid], 0);
    if (Math.abs(sum - game.totalScores[pid]) > 1e-9) {
      throw new Error(`Total score mismatch for ${pid}: sum=${sum} total=${game.totalScores[pid]}`);
    }
  }

  console.log(`Run ${run + 1}: OK (${totalRounds} rounds) — final scores:`, game.totalScores);
}

console.log("\nAll simulations passed ✅");
