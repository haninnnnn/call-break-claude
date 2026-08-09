const { cardValue } = require("./deck");

const TRUMP_SUIT = "S"; // Spades are always trump in Call Break

// Legal moves — correct Call Break rules:
// 1. Must follow led suit if you have it
//    AND must play a HIGHER card of that suit if you have one
// 2. If you have no led suit cards, can play ANY card (can save trump for later)
// 3. Trump/Spades always win tricks if played, highest spade wins if multiple spades
function legalMoves(hand, leadSuit, currentTrick) {
  if (!leadSuit) return hand; // leading the trick — any card is legal

  const suitCards = hand.filter((c) => c.suit === leadSuit);

  if (suitCards.length > 0) {
    // Find the current highest card of the led suit on the table
    const trickSuitCards = (currentTrick || [])
      .map((t) => t.card)
      .filter((c) => c.suit === leadSuit);

    // If there are cards of the led suit already played
    if (trickSuitCards.length > 0) {
      const highestOnTable = trickSuitCards.reduce(
        (max, c) => (cardValue(c) > cardValue(max) ? c : max),
        trickSuitCards[0]
      );

      // Must play higher if possible
      const higherCards = suitCards.filter(
        (c) => cardValue(c) > cardValue(highestOnTable)
      );
      
      // If you have higher cards, you MUST play one of them
      if (higherCards.length > 0) {
        return higherCards;
      }
      
      // If you don't have higher cards, you can play any card of the led suit
      return suitCards;
    }

    // First card of led suit on table — must follow suit
    return suitCards;
  }

  // No led suit cards — can play ANY card (including saving trump for later)
  return hand;
}

function isLegalMove(hand, leadSuit, card, currentTrick) {
  const legal = legalMoves(hand, leadSuit, currentTrick);
  return legal.some((c) => c.id === card.id);
}

// trick: array of { playerId, card }, in play order.
// Returns the playerId who wins the trick.
function resolveTrick(trick) {
  const leadSuit = trick[0].card.suit;

  const spadesPlayed = trick.filter((t) => t.card.suit === TRUMP_SUIT);
  const contenders =
    spadesPlayed.length > 0
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
