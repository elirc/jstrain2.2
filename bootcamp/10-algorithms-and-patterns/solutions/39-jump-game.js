// ─────────────────────────────────────────────────────────────────────────
//  39 · canJump — SOLUTION                                  ★★☆ core
//  concepts: pattern: greedy (furthest reach) · one pass
//  run: node 39-jump-game.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough — PATTERN: greedy "furthest reach" sweep.
//  Smell: "can I get from here to there" where every choice only ever
//  extends a frontier — no need to try the individual jumps at all.
//  Keep `reach`, the furthest index reachable using the indexes seen so
//  far. Walk left to right: if `i` is past `reach`, nothing can carry you
//  over the gap, so stop. Otherwise widen the frontier with i + nums[i].
//  Survive the walk and the last index is inside the frontier.
//  Time O(n), space O(1). The naive version is a DFS/BFS over every jump
//  length from every index — exponential without memoising, O(n²) with a
//  DP table. Greedy needs neither.
//  Why greedy is safe here: reachability is monotone. If you can reach
//  index j you can reach every index before it, so a single furthest-point
//  number captures everything a set of reachable indexes would.
//  Bite: the frontier check comes BEFORE you widen it, or a dead-end zero
//  gets to extend the reach it should have stopped.

import { test, eq } from '../../_lib/check.js';

export function canJump(nums) {
  let reach = 0;
  for (let i = 0; i < nums.length; i += 1) {
    if (i > reach) return false; // the road ran out before this index
    reach = Math.max(reach, i + nums[i]);
  }
  return true;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('reaches the end when the jumps are big enough', () => {
  eq(canJump([2, 3, 1, 1, 4]), true);
});

test('a zero that traps you means false', () => {
  eq(canJump([3, 2, 1, 0, 4]), false);
  eq(canJump([0, 1]), false);
});

test('a zero you can leap over is fine', () => {
  eq(canJump([2, 0, 1]), true);
});

test('a zero at the last index does not matter', () => {
  eq(canJump([1, 0]), true);
});

test('one big first jump clears everything', () => {
  eq(canJump([5, 0, 0, 0, 0, 1]), true);
});

test('single-step values still reach the end', () => {
  eq(canJump([1, 1, 1, 1]), true);
});

test('trivial inputs are reachable', () => {
  eq(canJump([0]), true);
  eq(canJump([]), true);
});
