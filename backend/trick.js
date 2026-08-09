const { cardValue } = require("./deck");

const TRUMP_SUIT = "S"; // Spades are always trump in Call Break

// Determine which cards in `hand` are legal to play given the led suit.
// Rule: must follow suit if you have a card of the led suit. Otherwise, any card (including trump).
function legalMoves(hand, leadSuit) {
  if (!leadSuit) return hand; // first card of the trick — any card is legal
  const followSuit = hand.filter((c) => c.suit === leadSuit);
  return followSuit.length > 0 ? followSuit : hand;
}

function isLegalMove(hand, leadSuit, card) {
  const legal = legalMoves(hand, leadSuit);
  return legal.some((c) => c.id === card.id);
}

// trick: array of { playerId, card }, in play order.
// Returns the playerId who wins the trick.
function resolveTrick(trick) {
  const leadSuit = trick[0].card.suit;

  // Spades in the trick beat everything else
  const spadesPlayed = trick.filter((t) => t.card.suit === TRUMP_SUIT);
  const contenders = spadesPlayed.length > 0
    ? spadesPlayed
    : trick.filter((t) => t.card.suit === leadSuit);

  let winner = contenders[0];
  for (const entry of contenders) {
    if (cardValue(entry.card) > cardValue(winner.card)) {
      winner = entry;
    }
  }
  return winner.playerId;
}

module.exports = { TRUMP_SUIT, legalMoves, isLegalMove, resolveTrick };
