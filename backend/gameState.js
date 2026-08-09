const { createDeck, shuffle, deal } = require("./deck");
const { isValidBid, allPlayersHaveBid } = require("./bidding");
const { legalMoves, isLegalMove, resolveTrick } = require("./trick");
const { scoreRoundForAll } = require("./scoring");

class GameState {
  // playerIds: array of 4 player ids, in seating order
  // totalRounds: host-selected round count (e.g. 5, 7, 8)
  constructor(playerIds, totalRounds = 5) {
    if (playerIds.length !== 4) throw new Error("Call Break requires exactly 4 players");
    this.playerIds = playerIds;
    this.totalRounds = totalRounds;
    this.currentRoundNumber = 1;
    this.dealerIndex = 0; // rotates each round
    this.totalScores = Object.fromEntries(playerIds.map((id) => [id, 0]));
    this.roundHistory = []; // { roundNumber, bids, tricksWon, scoresThisRound }
    this.phase = "bidding"; // "bidding" | "playing" | "roundOver" | "gameOver"
    this._startRound();
  }

  _startRound() {
    const deck = shuffle(createDeck());
    const hands = deal(deck, 4, 13);
    this.hands = Object.fromEntries(this.playerIds.map((id, i) => [id, hands[i]]));
    this.bids = {};
    this.tricksWon = Object.fromEntries(this.playerIds.map((id) => [id, 0]));
    this.currentTrick = []; // [{ playerId, card }]
    this.leadSuit = null;
    // player left of dealer bids/leads first
    this.turnIndex = (this.dealerIndex + 1) % 4;
    this.phase = "bidding";
  }

  currentPlayerId() {
    return this.playerIds[this.turnIndex];
  }

  submitBid(playerId, bid) {
    if (this.phase !== "bidding") throw new Error("Not in bidding phase");
    if (playerId !== this.currentPlayerId()) throw new Error("Not this player's turn to bid");
    if (!isValidBid(bid)) throw new Error("Invalid bid: must be an integer 1-13");

    this.bids[playerId] = bid;
    this.turnIndex = (this.turnIndex + 1) % 4;

    if (allPlayersHaveBid(this.bids, this.playerIds)) {
      this.phase = "playing";
      this.turnIndex = (this.dealerIndex + 1) % 4; // same player leads first trick
    }
    return this.getPublicState();
  }

  playCard(playerId, card) {
    if (this.phase !== "playing") throw new Error("Not in playing phase");
    if (playerId !== this.currentPlayerId()) throw new Error("Not this player's turn");

    const hand = this.hands[playerId];
    if (!isLegalMove(hand, this.leadSuit, card, this.currentTrick)) {
      throw new Error("Illegal move: must play higher card of led suit if possible, or trump if void");
    }

    // remove card from hand
    this.hands[playerId] = hand.filter((c) => c.id !== card.id);
    this.currentTrick.push({ playerId, card });
    if (this.currentTrick.length === 1) this.leadSuit = card.suit;

    if (this.currentTrick.length === 4) {
      const winnerId = resolveTrick(this.currentTrick);
      this.tricksWon[winnerId] += 1;
      this.trickWinnerId = winnerId;         // expose winner for animation
      this.phase = "trickComplete";          // pause for animation

      // After 0.75s clear trick, after 3s start next round if needed
      // (server handles the setTimeout and calls resolveTrickComplete)
    } else {
      this.turnIndex = (this.turnIndex + 1) % 4;
    }
    return this.getPublicState();
  }

  // Called by server after 0.75s animation delay
  resolveTrickComplete() {
    const winnerId = this.trickWinnerId;
    this.currentTrick = [];
    this.leadSuit = null;
    this.trickWinnerId = null;
    this.turnIndex = this.playerIds.indexOf(winnerId);
    this.phase = "playing";

    const tricksPlayed = Object.values(this.tricksWon).reduce((a, b) => a + b, 0);
    if (tricksPlayed === 13) {
      this._endRound();
    }
    return this.getPublicState();
  }

  _endRound() {
    const scoresThisRound = scoreRoundForAll(this.bids, this.tricksWon);
    for (const id of this.playerIds) {
      this.totalScores[id] += scoresThisRound[id];
    }
    this.roundHistory.push({
      roundNumber: this.currentRoundNumber,
      bids: { ...this.bids },
      tricksWon: { ...this.tricksWon },
      scoresThisRound,
    });

    if (this.currentRoundNumber >= this.totalRounds) {
      this.phase = "gameOver";
    } else {
      this.phase = "roundOver"; // pause 3s before next round (server handles setTimeout)
    }
  }

  // Called by server after 3s round-over delay
  startNextRound() {
    this.currentRoundNumber += 1;
    this.dealerIndex = (this.dealerIndex + 1) % 4;
    this._startRound();
    return this.getPublicState();
  }

  // State safe to broadcast to everyone (no other players' hands)
  getPublicState() {
    return {
      currentRoundNumber: this.currentRoundNumber,
      totalRounds: this.totalRounds,
      phase: this.phase,
      dealerIndex: this.dealerIndex,
      turnPlayerId: this.phase === "gameOver" ? null : this.currentPlayerId(),
      bids: this.bids,
      tricksWon: this.tricksWon,
      currentTrick: this.currentTrick,
      trickWinnerId: this.trickWinnerId ?? null,
      totalScores: this.totalScores,
      roundHistory: this.roundHistory,
      handCounts: Object.fromEntries(this.playerIds.map((id) => [id, this.hands[id].length])),
    };
  }

  // Private state for one player — includes their own hand + legal moves
  getStateForPlayer(playerId) {
    const publicState = this.getPublicState();
    const hand = this.hands[playerId];
    return {
      ...publicState,
      yourHand: hand,
      legalMoves: this.phase === "playing" && playerId === this.currentPlayerId()
        ? legalMoves(hand, this.leadSuit, this.currentTrick)
        : [],
    };
  }
}

module.exports = { GameState };
