// ─────────────────────────────────────────────────────────────────────────
//  03 · thermometer                                        ★☆☆ warm-up
//  concepts: getters · setters · derived state
//  run: node 03-temperature-getters.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A getter is a function that is read like a property; a setter is a
//  function that is written like one. Use them to expose ONE piece of
//  state (celsius) through TWO views.
//
//  Build makeThermometer(celsius) returning an object with:
//    - `_celsius`   the one stored number
//    - get/set `celsius`      the setter rejects anything below -273.15
//                             with a RangeError: 'below absolute zero'
//    - get/set `fahrenheit`   computed, never stored: c * 9 / 5 + 32
//
//      const t = makeThermometer(100);
//      t.fahrenheit          → 212
//      t.fahrenheit = 32;
//      t.celsius             → 0
//
//  hint: make the fahrenheit setter assign to `this.celsius`, not to
//  `this._celsius` — then the guard is written once

import { test, eq, approx, throws } from '../../_lib/check.js';

export function makeThermometer(celsius = 0) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('reads back the celsius it was built with', () => {
  const t = makeThermometer(21);
  eq(t.celsius, 21);
});

test('fahrenheit is derived from celsius', () => {
  const t = makeThermometer(100);
  approx(t.fahrenheit, 212);
  t.celsius = 37;
  approx(t.fahrenheit, 98.6, 1e-9);
});

test('writing fahrenheit updates celsius', () => {
  const t = makeThermometer(0);
  t.fahrenheit = 212;
  approx(t.celsius, 100);
});

test('-40 is the same number in both scales', () => {
  const t = makeThermometer(-40);
  approx(t.fahrenheit, -40);
});

test('the celsius setter refuses temperatures below absolute zero', () => {
  const t = makeThermometer(0);
  throws(() => {
    t.celsius = -300;
  }, 'below absolute zero');
  eq(t.celsius, 0, 'a rejected write must not change the state');
});

test('the fahrenheit setter reuses the same guard', () => {
  const t = makeThermometer(0);
  throws(() => {
    t.fahrenheit = -500;
  }, 'below absolute zero');
});
