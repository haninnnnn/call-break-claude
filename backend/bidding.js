// Bid must be an integer between 1 and 13 (Call Break: no zero bids in the standard variant)
function isValidBid(bid) {
  return Number.isInteger(bid) && bid >= 1 && bid <= 13;
}

// bids: { playerId: number } — check every player in the round has bid
function allPlayersHaveBid(bids, playerIds) {
  return playerIds.every((id) => typeof bids[id] === "number");
}

module.exports = { isValidBid, allPlayersHaveBid };
