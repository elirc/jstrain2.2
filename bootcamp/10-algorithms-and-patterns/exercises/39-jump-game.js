// ─────────────────────────────────────────────────────────────────────────
//  39 · canJump                                             ★★☆ core
//  concepts: pattern: greedy (furthest reach) · one pass
//  run: node 39-jump-game.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Each number is the MAXIMUM number of steps you may jump forward from
//  that index (you may jump less). Starting at index 0, can you reach the
//  last index?
//
//      canJump([2, 3, 1, 1, 4])  → true
//      canJump([3, 2, 1, 0, 4])  → false   (index 3 is a dead end)
//      canJump([0])              → true    (already at the end)
//
//  You never have to decide HOW far to jump. Track the furthest index
//  reachable so far and walk forward; the moment you stand past that
//  frontier, the road is out. An empty array counts as reachable.
//
//  hint: `reach = Math.max(reach, i + nums[i])`, and bail out if `i` ever
//        overtakes `reach`

import { test, eq } from '../../_lib/check.js';

export function canJump(nums) {
  throw new Error('TODO');
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
