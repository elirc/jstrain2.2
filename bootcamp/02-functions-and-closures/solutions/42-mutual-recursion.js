// ─────────────────────────────────────────────────────────────────────────
//  42 · mutual recursion — SOLUTION                        ★★★ stretch
//  run: node 42-mutual-recursion.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `isEven`/`isOdd` is the smallest possible state machine —
//  each call moves one step closer to a base case and switches which
//  function is asking. It works at all because function declarations are
//  hoisted: the body of `isEven` only looks `isOdd` up when it runs, by
//  which time both exist. (`const` arrows work too, for the same reason:
//  the TDZ has ended long before the first call.)
//  `splitRuns` is the same idea with a real payoff. Instead of one reader
//  with a mode flag, the two states ARE the two functions, and each ends by
//  delegating the remaining input to the other. That is how a recursive
//  descent parser is built — `parseExpression` calls `parseTerm` calls
//  `parseFactor`, which calls back into `parseExpression` for a
//  parenthesised group.
//  The catch is the same as for any recursion: depth. `isEven(200000)`
//  would blow the stack, which is exactly the problem the trampoline in the
//  previous file solves.

import { test, eq, ok } from '../../_lib/check.js';

export function isEven(n) {
  return n === 0 ? true : isOdd(n - 1);
}

export function isOdd(n) {
  return n === 0 ? false : isEven(n - 1);
}

export function splitRuns(text) {
  const isDigit = (ch) => ch >= '0' && ch <= '9';
  const runs = [];

  const digits = (i) => {
    let j = i;
    while (j < text.length && isDigit(text[j])) j += 1;
    if (j > i) runs.push(text.slice(i, j));
    return j < text.length ? letters(j) : runs;
  };

  const letters = (i) => {
    let j = i;
    while (j < text.length && !isDigit(text[j])) j += 1;
    if (j > i) runs.push(text.slice(i, j));
    return j < text.length ? digits(j) : runs;
  };

  return text === '' ? [] : digits(0);
}

// ──────────────────────────── tests ──────────────────────────────────────

test('isEven answers for the small cases', () => {
  eq(isEven(0), true);
  eq(isEven(3), false);
  eq(isEven(4), true);
});

test('isOdd answers for the small cases', () => {
  eq(isOdd(0), false);
  eq(isOdd(3), true);
  eq(isOdd(4), false);
});

test('the two never agree', () => {
  for (let n = 0; n <= 9; n += 1) {
    ok(isEven(n) !== isOdd(n), `they agreed about ${n}`);
  }
});

test('the ping-pong survives a few hundred hand-offs', () => {
  eq(isEven(500), true);
  eq(isOdd(501), true);
});

test('splitRuns alternates between digit runs and letter runs', () => {
  eq(splitRuns('12ab3'), ['12', 'ab', '3']);
});

test('splitRuns copes with text that starts with letters', () => {
  eq(splitRuns('ab12'), ['ab', '12']);
  eq(splitRuns('a1b2'), ['a', '1', 'b', '2']);
});

test('a single run, and no runs at all', () => {
  eq(splitRuns('ab'), ['ab']);
  eq(splitRuns('42'), ['42']);
  eq(splitRuns(''), []);
});

test('every character ends up in exactly one run', () => {
  const text = 'v2-final7x';
  eq(splitRuns(text).join(''), text);
});
