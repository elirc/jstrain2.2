// ─────────────────────────────────────────────────────────────────────────
//  23 · fibMemo / climbStairs — SOLUTION                    ★★☆ core
//  concepts: pattern: memoization (recursion + cache) · overlapping calls
//  run: node 23-fib-memo.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough — PATTERN: memoization, i.e. "recursion + cache". Dynamic
//  programming needs two properties, and fib has both: OPTIMAL
//  SUBSTRUCTURE (the answer is built from answers to smaller versions)
//  and OVERLAPPING SUBPROBLEMS (the same smaller version is asked for
//  again and again). The cache turns the second property from a disaster
//  into a nothing.
//  Naive fib is O(2^n) — fib(20) makes 21,891 calls, fib(50) makes about
//  4 * 10^10. With a Map it becomes O(n) time / O(n) space: each of
//  fib(0..n) is computed once and reused, which is exactly what the
//  call-count test measures. That measurement IS the lesson: cache hits
//  are free, cache misses are the real work.
//  Note the Map lives INSIDE the function, so every top-level call starts
//  clean. A module-level cache would be faster across calls but it leaks
//  memory and makes call counts (and tests) depend on history.
//  climbStairs is the same recurrence wearing a different hat: to reach
//  step n you arrived from n-1 or n-2, so ways(n) = ways(n-1) +
//  ways(n-2). Done bottom-up with two rolling variables it is O(n) time
//  and O(1) space — the usual last step of a DP: memo → table → two
//  variables.

import { test, eq, ok, spy } from '../../_lib/check.js';

// given: the exponential version, for comparison
function fibNaive(n, onCall = () => {}) {
  onCall(n);
  if (n < 2) return n;
  return fibNaive(n - 1, onCall) + fibNaive(n - 2, onCall);
}

export function fibMemo(n, onCall = () => {}) {
  const cache = new Map();
  const fib = (k) => {
    if (cache.has(k)) return cache.get(k);
    onCall(k);
    const value = k < 2 ? k : fib(k - 1) + fib(k - 2);
    cache.set(k, value);
    return value;
  };
  return fib(n);
}

export function climbStairs(n) {
  let previous = 1; // ways(0): stand still
  let current = 1; // ways(1): one single step
  for (let step = 2; step <= n; step += 1) {
    const next = current + previous;
    previous = current;
    current = next;
  }
  return current;
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
