// Evaluates Texas Hold'em hands (7 cards) and returns the best 5-card hand rank and score.
// Cards are objects: { rank: number (2..14), suit: 'H'|'D'|'C'|'S' }
// Ranks: 2-10, 11 (J), 12 (Q), 13 (K), 14 (A)

function getCombinations(array, size) {
  const result = [];
  function helper(start, combo) {
    if (combo.length === size) {
      result.push([...combo]);
      return;
    }
    for (let i = start; i < array.length; i++) {
      combo.push(array[i]);
      helper(i + 1, combo);
      combo.pop();
    }
  }
  helper(0, []);
  return result;
}

function evaluate5CardHand(cards) {
  // Sort cards descending by rank
  const sorted = [...cards].sort((a, b) => b.rank - a.rank);
  const ranks = sorted.map(c => c.rank);
  const suits = sorted.map(c => c.suit);

  const isFlush = suits.every(s => s === suits[0]);
  
  let isStraight = false;
  let straightHigh = 0;
  
  // Check regular straight
  if (ranks[0] - ranks[4] === 4 && new Set(ranks).size === 5) {
    isStraight = true;
    straightHigh = ranks[0];
  } else if (ranks[0] === 14 && ranks[1] === 5 && ranks[2] === 4 && ranks[3] === 3 && ranks[4] === 2) {
    // Wheel straight: 5-4-3-2-A (Ace acts as low)
    isStraight = true;
    straightHigh = 5;
  }

  // Count frequencies of ranks
  const counts = {};
  for (const r of ranks) {
    counts[r] = (counts[r] || 0) + 1;
  }

  const countPairs = Object.entries(counts).map(([rank, count]) => ({
    rank: parseInt(rank),
    count
  })).sort((a, b) => b.count - a.count || b.rank - a.rank);

  // Four of a Kind
  if (countPairs[0].count === 4) {
    return {
      type: "Four of a Kind",
      score: [7, countPairs[0].rank, countPairs[1].rank]
    };
  }

  // Full House
  if (countPairs[0].count === 3 && countPairs[1].count === 2) {
    return {
      type: "Full House",
      score: [6, countPairs[0].rank, countPairs[1].rank]
    };
  }

  // Flush
  if (isFlush) {
    if (isStraight) {
      if (straightHigh === 14) {
        return {
          type: "Royal Flush",
          score: [9, 14]
        };
      }
      return {
        type: "Straight Flush",
        score: [8, straightHigh]
      };
    }
    return {
      type: "Flush",
      score: [5, ...ranks]
    };
  }

  // Straight
  if (isStraight) {
    return {
      type: "Straight",
      score: [4, straightHigh]
    };
  }

  // Three of a Kind
  if (countPairs[0].count === 3) {
    return {
      type: "Three of a Kind",
      score: [3, countPairs[0].rank, countPairs[1].rank, countPairs[2].rank]
    };
  }

  // Two Pair
  if (countPairs[0].count === 2 && countPairs[1].count === 2) {
    return {
      type: "Two Pair",
      score: [2, countPairs[0].rank, countPairs[1].rank, countPairs[2].rank]
    };
  }

  // One Pair
  if (countPairs[0].count === 2) {
    return {
      type: "One Pair",
      score: [1, countPairs[0].rank, countPairs[1].rank, countPairs[2].rank, countPairs[3].rank]
    };
  }

  // High Card
  return {
    type: "High Card",
    score: [0, ...ranks]
  };
}

function compareHands(handA, handB) {
  for (let i = 0; i < handA.score.length; i++) {
    if (handA.score[i] !== handB.score[i]) {
      return handA.score[i] - handB.score[i];
    }
  }
  return 0;
}

function evaluate7CardHand(cards) {
  if (cards.length < 5) {
    throw new Error("Must have at least 5 cards to evaluate a poker hand");
  }
  
  const combos = getCombinations(cards, 5);
  let bestHand = null;

  for (const combo of combos) {
    const hand = evaluate5CardHand(combo);
    hand.cards = combo;
    if (!bestHand || compareHands(hand, bestHand) > 0) {
      bestHand = hand;
    }
  }

  return bestHand;
}

module.exports = {
  evaluate7CardHand,
  compareHands
};
