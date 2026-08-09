// Call Break scoring:
// - Hit or exceed bid: bid * 10, plus 0.1 per overtrick
// - Miss bid: -10 * bid
function scoreRound(bid, tricksWon) {
  if (tricksWon >= bid) {
    const overtricks = tricksWon - bid;
    return bid * 1 + overtricks * 0.1;
  }
  return -1 * bid;
}

// bids/tricksWon: { playerId: number }
// Returns { playerId: scoreThisRound }
function scoreRoundForAll(bids, tricksWon) {
  const scores = {};
  for (const playerId of Object.keys(bids)) {
    scores[playerId] = scoreRound(bids[playerId], tricksWon[playerId] || 0);
  }
  return scores;
}

module.exports = { scoreRound, scoreRoundForAll };
