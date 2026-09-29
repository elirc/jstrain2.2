// ─────────────────────────────────────────────────────────────────────────
//  23 · fibMemo / climbStairs                               ★★☆ core
//  concepts: pattern: memoization (recursion + cache) · overlapping calls
//  run: node 23-fib-memo.js
// ─────────────────────────────────────────────────────────────────────────
//
//  `fibNaive` below recomputes the same values over and over: computing
//  fib(20) calls itself 21,891 times. Fix it with a cache.
//
//      fibMemo(10)   → 55
//      fibMemo(60)   → 1548008755920   (instant, not next Tuesday)
//
//  Call `onCall(k)` exactly once for every value you actually COMPUTE —
//  a cache hit must not call it. So fibMemo(10, onCall) should report 11
//  computations (one each for fib(0) .. fib(10)).
//
//  climbStairs(n): how many ways to climb n stairs taking 1 or 2 steps
//  at a time? Same recurrence, different story.
//
//      climbStairs(1) → 1        climbStairs(4) → 5
//      climbStairs(2) → 2        climbStairs(0) → 1  (one way: don't)
//
//  hint: a Map created INSIDE the function, checked before you recurse

import { test, eq, ok, spy } from '../../_lib/check.js';

// given: the exponential version, for comparison
function fibNaive(n, onCall = () => {}) {
  onCall(n);
  if (n < 2) return n;
  return fibNaive(n - 1, onCall) + fibNaive(n - 2, onCall);
}

export function fibMemo(n, onCall = () => {}) {
  throw new Error('TODO');
}

export function climbStairs(n) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('fibMemo returns the right numbers', () => {
  eq(fibMemo(0), 0);
  eq(fibMemo(1), 1);
  eq(fibMemo(10), 55);
});

test('fibMemo computes each value exactly once', () => {
  const onCall = spy();
  fibMemo(10, onCall);
  eq(onCall.callCount, 11);
});

test('fibMemo answers a big n without blowing up', () => {
  eq(fibMemo(60), 1548008755920);
});

test('fibMemo does astronomically less work than the naive version', () => {
  const naiveCalls = spy();
  const memoCalls = spy();
  eq(fibNaive(20, naiveCalls), fibMemo(20, memoCalls));
  eq(naiveCalls.callCount, 21891);
  eq(memoCalls.callCount, 21);
  ok(memoCalls.callCount * 100 < naiveCalls.callCount, 'memo should win big');
});

test('climbStairs handles the base cases', () => {
  eq(climbStairs(0), 1);
  eq(climbStairs(1), 1);
  eq(climbStairs(2), 2);
});

test('climbStairs counts the small cases by hand', () => {
  eq(climbStairs(3), 3);
  eq(climbStairs(4), 5);
  eq(climbStairs(5), 8);
});

test('climbStairs scales to 40 stairs', () => {
  eq(climbStairs(40), 165580141);
});
