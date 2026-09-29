// ─────────────────────────────────────────────────────────────────────────
//  03 · thermometer — SOLUTION                             ★☆☆ warm-up
//  run: node 03-temperature-getters.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: one source of truth (`_celsius`), two accessors on top of
//  it. `get fahrenheit` computes on every read, so it can never drift out
//  of sync — the classic bug when you store both numbers as fields.
//
//  The fahrenheit setter converts and then assigns to `this.celsius`, NOT
//  to `this._celsius`. That routes the write back through the celsius
//  setter, so the absolute-zero guard lives in exactly one place. Funnel
//  writes through a single setter and validation never gets bypassed.
//
//  `_celsius` is a naming convention, not protection — anyone can still
//  poke it. Exercise 11 shows the real lock: #private fields.

import { test, eq, approx, throws } from '../../_lib/check.js';

export function makeThermometer(celsius = 0) {
  return {
    _celsius: celsius,

    get celsius() {
      return this._celsius;
    },

    set celsius(value) {
      if (value < -273.15) throw new RangeError('below absolute zero');
      this._celsius = value;
    },

    get fahrenheit() {
      return this._celsius * 9 / 5 + 32;
    },

    set fahrenheit(value) {
      this.celsius = (value - 32) * 5 / 9;
    },
  };
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
