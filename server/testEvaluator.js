const { evaluate7CardHand, compareHands } = require('./handEvaluator');

function runTests() {
  const tests = [
    {
      name: "High Card Test",
      cards: [
        { rank: 2, suit: 'H' },
        { rank: 4, suit: 'D' },
        { rank: 6, suit: 'S' },
        { rank: 8, suit: 'C' },
        { rank: 10, suit: 'H' },
        { rank: 12, suit: 'D' },
        { rank: 3, suit: 'S' }
      ],
      expectedType: "High Card"
    },
    {
      name: "One Pair Test",
      cards: [
        { rank: 14, suit: 'H' },
        { rank: 14, suit: 'D' },
        { rank: 6, suit: 'S' },
        { rank: 8, suit: 'C' },
        { rank: 10, suit: 'H' },
        { rank: 12, suit: 'D' },
        { rank: 3, suit: 'S' }
      ],
      expectedType: "One Pair"
    },
    {
      name: "Two Pair Test",
      cards: [
        { rank: 14, suit: 'H' },
        { rank: 14, suit: 'D' },
        { rank: 10, suit: 'S' },
        { rank: 10, suit: 'C' },
        { rank: 8, suit: 'H' },
        { rank: 12, suit: 'D' },
        { rank: 3, suit: 'S' }
      ],
      expectedType: "Two Pair"
    },
    {
      name: "Three of a Kind Test",
      cards: [
        { rank: 10, suit: 'H' },
        { rank: 10, suit: 'D' },
        { rank: 10, suit: 'S' },
        { rank: 8, suit: 'C' },
        { rank: 14, suit: 'H' },
        { rank: 12, suit: 'D' },
        { rank: 3, suit: 'S' }
      ],
      expectedType: "Three of a Kind"
    },
    {
      name: "Straight Test (Normal)",
      cards: [
        { rank: 5, suit: 'H' },
        { rank: 6, suit: 'D' },
        { rank: 7, suit: 'S' },
        { rank: 8, suit: 'C' },
        { rank: 9, suit: 'H' },
        { rank: 12, suit: 'D' },
        { rank: 14, suit: 'S' }
      ],
      expectedType: "Straight"
    },
    {
      name: "Straight Test (Wheel)",
      cards: [
        { rank: 14, suit: 'H' },
        { rank: 2, suit: 'D' },
        { rank: 3, suit: 'S' },
        { rank: 4, suit: 'C' },
        { rank: 5, suit: 'H' },
        { rank: 12, suit: 'D' },
        { rank: 9, suit: 'S' }
      ],
      expectedType: "Straight"
    },
    {
      name: "Flush Test",
      cards: [
        { rank: 2, suit: 'H' },
        { rank: 5, suit: 'H' },
        { rank: 7, suit: 'H' },
        { rank: 9, suit: 'H' },
        { rank: 11, suit: 'H' },
        { rank: 12, suit: 'D' },
        { rank: 14, suit: 'S' }
      ],
      expectedType: "Flush"
    },
    {
      name: "Full House Test",
      cards: [
        { rank: 8, suit: 'H' },
        { rank: 8, suit: 'D' },
        { rank: 8, suit: 'S' },
        { rank: 9, suit: 'C' },
        { rank: 9, suit: 'H' },
        { rank: 12, suit: 'D' },
        { rank: 14, suit: 'S' }
      ],
      expectedType: "Full House"
    },
    {
      name: "Four of a Kind Test",
      cards: [
        { rank: 8, suit: 'H' },
        { rank: 8, suit: 'D' },
        { rank: 8, suit: 'S' },
        { rank: 8, suit: 'C' },
        { rank: 9, suit: 'H' },
        { rank: 12, suit: 'D' },
        { rank: 14, suit: 'S' }
      ],
      expectedType: "Four of a Kind"
    },
    {
      name: "Straight Flush Test",
      cards: [
        { rank: 5, suit: 'H' },
        { rank: 6, suit: 'H' },
        { rank: 7, suit: 'H' },
        { rank: 8, suit: 'H' },
        { rank: 9, suit: 'H' },
        { rank: 12, suit: 'D' },
        { rank: 14, suit: 'S' }
      ],
      expectedType: "Straight Flush"
    },
    {
      name: "Royal Flush Test",
      cards: [
        { rank: 10, suit: 'H' },
        { rank: 11, suit: 'H' },
        { rank: 12, suit: 'H' },
        { rank: 13, suit: 'H' },
        { rank: 14, suit: 'H' },
        { rank: 2, suit: 'D' },
        { rank: 3, suit: 'S' }
      ],
      expectedType: "Royal Flush"
    }
  ];

  let failed = 0;
  console.log("=== RUNNING HAND EVALUATOR TESTS ===");
  for (const t of tests) {
    const result = evaluate7CardHand(t.cards);
    if (result.type === t.expectedType) {
      console.log(`[PASS] ${t.name} (Evaluated: ${result.type})`);
    } else {
      console.error(`[FAIL] ${t.name} (Expected: ${t.expectedType}, Got: ${result.type})`);
      failed++;
    }
  }

  // Test comparison
  const pairOfAces = evaluate7CardHand([
    { rank: 14, suit: 'H' }, { rank: 14, suit: 'D' }, { rank: 2, suit: 'S' }, { rank: 3, suit: 'C' }, { rank: 4, suit: 'H' }, { rank: 5, suit: 'D' }, { rank: 7, suit: 'S' }
  ]);
  const pairOfKings = evaluate7CardHand([
    { rank: 13, suit: 'H' }, { rank: 13, suit: 'D' }, { rank: 2, suit: 'S' }, { rank: 3, suit: 'C' }, { rank: 4, suit: 'H' }, { rank: 5, suit: 'D' }, { rank: 7, suit: 'S' }
  ]);

  if (compareHands(pairOfAces, pairOfKings) > 0) {
    console.log("[PASS] Pair of Aces > Pair of Kings");
  } else {
    console.error("[FAIL] Pair of Aces comparison check failed");
    failed++;
  }

  console.log(`=== TESTS COMPLETE. FAILED: ${failed} ===`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
