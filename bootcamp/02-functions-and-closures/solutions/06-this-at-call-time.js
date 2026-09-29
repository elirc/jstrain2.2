// ─────────────────────────────────────────────────────────────────────────
//  06 · `this` is decided at call time — SOLUTION          ★★☆ core
//  run: node 06-this-at-call-time.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `add` is written as a shorthand method so it gets a fresh
//  `this` per call — `g.add(21)` binds it to g, `const loose = g.add;
//  loose(21)` binds it to undefined (module code is strict) and throws.
//  Inside addAll the callback must NOT get its own `this`, so an arrow is
//  the right tool there; the same arrow used as the method itself is the
//  wrong tool, which is what makeBrokenGauge demonstrates. bind returns a
//  new function welded to one receiver — welded so hard that a second
//  .bind() on it is ignored. call/apply set the receiver for exactly one
//  call and differ only in how you hand over the arguments.

import { test, eq, ok } from '../../_lib/check.js';

export function makeGauge(label) {
  return {
    label,
    readings: [],
    add(value) {
      this.readings.push(value);
      return this.readings.length;
    },
    addAll(values) {
      values.forEach((value) => this.add(value));
      return this.readings.length;
    },
  };
}

export function makeBrokenGauge(label) {
  return {
    label,
    readings: [],
    add: (value) => {
      // `this` here is the module scope's this (undefined), not the gauge
      this.readings.push(value);
      return this.readings.length;
    },
  };
}

export function bindAdd(gauge) {
  return gauge.add.bind(gauge);
}

export function addWith(gauge, value) {
  return gauge.add.call(gauge, value);
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
