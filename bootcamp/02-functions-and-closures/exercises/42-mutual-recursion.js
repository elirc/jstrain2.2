// ─────────────────────────────────────────────────────────────────────────
//  42 · mutual recursion                                   ★★★ stretch
//  concepts: recursion · hoisting · tokenizing
//  run: node 42-mutual-recursion.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Two functions that call each other are still recursion — the problem
//  just has two states to alternate between. The textbook pair first:
//
//      isEven(4)   → true       isEven(0) is true
//      isOdd(4)    → false      isOdd(0) is false
//
//  Neither may use `%`, `/` or a loop: `isEven(n)` answers by asking
//  `isOdd(n - 1)`, and vice versa. Both take whole numbers ≥ 0.
//
//  Then the real-world shape — a tokenizer that ping-pongs between two
//  readers, one for digit runs and one for everything else:
//
//      splitRuns('12ab3')   → ['12', 'ab', '3']
//      splitRuns('ab')      → ['ab']
//      splitRuns('')        → []
//
//  Each reader consumes its own kind of run, then hands the rest of the
//  string to the other one.
//
//  hint: function declarations hoist, so `isEven` can call `isOdd` even
//  though it is written below — and each hand-off must shrink the problem
//  or the ping-pong never stops

import { test, eq, ok } from '../../_lib/check.js';

export function isEven(n) {
  throw new Error('TODO');
}

export function isOdd(n) {
  throw new Error('TODO');
}

export function splitRuns(text) {
  throw new Error('TODO');
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
