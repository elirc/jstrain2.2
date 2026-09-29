// ─────────────────────────────────────────────────────────────────────────
//  06 · `this` is decided at call time                     ★★☆ core
//  concepts: this · methods · bind/call/apply
//  run: node 06-this-at-call-time.js
// ─────────────────────────────────────────────────────────────────────────
//
//  `this` is not part of a function — it is part of the CALL. Whatever is
//  left of the dot becomes `this`; no dot, no receiver. Arrows opt out of
//  the whole game: they use the `this` of the scope they were written in.
//
//      const g = makeGauge('temp');
//      g.add(21)              → 1        (this === g)
//      g.addAll([22, 23])     → 3        (callback must still see g)
//      const loose = g.add; loose(24)    → TypeError, no receiver
//      bindAdd(g)(24)         → 4        (bound forever to g)
//      addWith(g, 25)         → 5        (borrow it for one call)
//
//  makeGauge(label) → { label, readings: [], add(value), addAll(values) }
//  add pushes and returns the new reading count; addAll adds each value
//  by calling this.add and returns the final count.
//  makeBrokenGauge(label) returns the same shape but writes `add` as an
//  ARROW — it must fail, that is the point.
//  addWith(gauge, value) must use .call or .apply, not gauge.add(value).
//
//  hint: an arrow inside a method keeps the method's `this`

import { test, eq, ok } from '../../_lib/check.js';

export function makeGauge(label) {
  throw new Error('TODO');
}

export function makeBrokenGauge(label) {
  throw new Error('TODO');
}

export function bindAdd(gauge) {
  throw new Error('TODO');
}

export function addWith(gauge, value) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('a method call sets `this` to the object left of the dot', () => {
  const g = makeGauge('temp');
  eq(g.add(21), 1);
  eq(g.add(22), 2);
  eq(g.readings, [21, 22]);
  eq(g.label, 'temp');
});

test('two gauges keep separate readings', () => {
  const a = makeGauge('a');
  const b = makeGauge('b');
  a.add(1);
  b.add(2);
  eq(a.readings, [1]);
  eq(b.readings, [2]);
});

test('addAll keeps `this` inside its callback', () => {
  const g = makeGauge('temp');
  eq(g.addAll([1, 2, 3]), 3);
  eq(g.readings, [1, 2, 3]);
});

test('an arrow written as a method never gets the receiver', () => {
  const broken = makeBrokenGauge('temp');
  let err = null;
  try {
    broken.add(1);
  } catch (e) {
    err = e;
  }
  ok(err instanceof TypeError, 'the arrow method should blow up on `this`');
});

test('a method pulled off its object loses the receiver', () => {
  const g = makeGauge('temp');
  const loose = g.add;
  let err = null;
  try {
    loose(1);
  } catch (e) {
    err = e;
  }
  ok(err instanceof TypeError, 'a bare call has no receiver');
  eq(g.readings, []);
});

test('bind glues the receiver on permanently', () => {
  const g = makeGauge('temp');
  const other = makeGauge('other');
  const bound = bindAdd(g);
  bound(5);
  bound.bind(other)(6);
  eq(g.readings, [5, 6]);
  eq(other.readings, []);
});

test('a bound method survives being handed to forEach', () => {
  const g = makeGauge('temp');
  [1, 2].forEach(bindAdd(g));
  eq(g.readings, [1, 2]);
});

test('call or apply borrows the method for a single call', () => {
  const g = makeGauge('temp');
  eq(addWith(g, 7), 1);
  eq(addWith(g, 8), 2);
  eq(g.readings, [7, 8]);
});
