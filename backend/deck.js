// Suits and ranks for a standard 52-card deck
const SUITS = ["S", "H", "D", "C"]; // Spades, Hearts, Diamonds, Clubs
const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];

// Rank value for comparing cards (2 lowest, Ace highest)
const RANK_VALUE = RANKS.reduce((acc, rank, i) => {
  acc[rank] = i + 2; // 2 -> 2, 3 -> 3, ..., A -> 14
  return acc;
}, {});

function createCard(rank, suit) {
  return { rank, suit, id: `${rank}${suit}` };
}

function createDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push(createCard(rank, suit));
    }
  }
  return deck;
}

// Fisher-Yates shuffle
function shuffle(deck) {
  const arr = [...deck];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Deal to `numPlayers`, `cardsEach` cards each (Call Break: 4 players, 13 each)
function deal(deck, numPlayers = 4, cardsEach = 13) {
  const hands = Array.from({ length: numPlayers }, () => []);
  for (let i = 0; i < cardsEach; i++) {
    for (let p = 0; p < numPlayers; p++) {
      hands[p].push(deck[i * numPlayers + p]);
    }
  }
  return hands;
}

function cardValue(card) {
  return RANK_VALUE[card.rank];
}

module.exports = { SUITS, RANKS, RANK_VALUE, createCard, createDeck, shuffle, deal, cardValue };
