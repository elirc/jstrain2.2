// ─────────────────────────────────────────────────────────────────────────
//  36 · temperature units — SOLUTION                          ★★☆ core
//  run: node 36-temperature-units.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: exactly one number is stored. celsius and fahrenheit are
//  pure views — computed on read, converted on write — so the three units
//  cannot drift apart, which is the whole reason not to keep three fields.
//
//  Validation follows the same shape. #requireNumber is the one type
//  guard, the kelvin setter is the one range guard, and every other door
//  routes through them: fahrenheit writes to this.celsius, celsius writes
//  to this.kelvin, the statics build through the constructor and the
//  constructor assigns through the setter. Write `this.#kelvin = value`
//  anywhere and you have quietly opened a door with no lock on it.
//
//  The type check earns its keep because arithmetic hides bad input:
//  `'212' - 32` is 180, a perfectly good number, so a guard that only
//  looked for NaN at the end would let a string in. And note the order —
//  type first, then range, so `t.kelvin = '300'` reports the real problem.

import { test, eq, ok, approx, throws } from '../../_lib/check.js';

export class Temperature {
  #kelvin;

  constructor(kelvin) {
    this.kelvin = kelvin;
  }

  static #requireNumber(value) {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new TypeError('temperature must be a number');
    }
    return value;
  }

  static fromKelvin(value) {
    return new Temperature(value);
  }

  static fromCelsius(value) {
    return new Temperature(Temperature.#requireNumber(value) + 273.15);
  }

  static fromFahrenheit(value) {
    const celsius = ((Temperature.#requireNumber(value) - 32) * 5) / 9;
    return Temperature.fromCelsius(celsius);
  }

  get kelvin() {
    return this.#kelvin;
  }

  set kelvin(value) {
    Temperature.#requireNumber(value);
    if (value < 0) throw new RangeError('below absolute zero');
    this.#kelvin = value;
  }

  get celsius() {
    return this.#kelvin - 273.15;
  }

  set celsius(value) {
    this.kelvin = Temperature.#requireNumber(value) + 273.15;
  }

  get fahrenheit() {
    return (this.celsius * 9) / 5 + 32;
  }

  set fahrenheit(value) {
    this.celsius = ((Temperature.#requireNumber(value) - 32) * 5) / 9;
  }

  toString() {
    return `${this.celsius.toFixed(1)}°C`;
  }
}

// ──────────────────────────── tests ──────────────────────────────────────

test('one value, three views', () => {
  const t = Temperature.fromCelsius(0);
  approx(t.celsius, 0);
  approx(t.fahrenheit, 32);
  approx(t.kelvin, 273.15);
});

test('the three factories agree with each other', () => {
  approx(Temperature.fromCelsius(100).fahrenheit, 212, 1e-9);
  approx(Temperature.fromFahrenheit(212).celsius, 100, 1e-9);
  approx(Temperature.fromKelvin(373.15).celsius, 100, 1e-9);
  approx(Temperature.fromFahrenheit(-40).celsius, -40, 1e-9);
});

test('writing any unit moves all of them', () => {
  const t = Temperature.fromCelsius(0);
  t.fahrenheit = 212;
  approx(t.celsius, 100, 1e-9);
  approx(t.kelvin, 373.15, 1e-9);
  t.celsius = 20;
  approx(t.fahrenheit, 68, 1e-9);
  t.kelvin = 273.15;
  approx(t.celsius, 0, 1e-9);
});

test('absolute zero is the floor, whichever door you come through', () => {
  const t = Temperature.fromCelsius(20);
  throws(() => {
    t.celsius = -300;
  }, 'below absolute zero');
  throws(() => {
    t.fahrenheit = -500;
  }, 'below absolute zero');
  throws(() => {
    t.kelvin = -1;
  }, 'below absolute zero');
  throws(() => Temperature.fromCelsius(-274), 'below absolute zero');
  approx(t.celsius, 20, 1e-9, 'a refused write changes nothing');
});

test('non-numbers never get in', () => {
  const t = Temperature.fromCelsius(20);
  throws(() => {
    t.kelvin = '300';
  }, 'temperature must be a number');
  throws(() => {
    t.celsius = NaN;
  }, 'temperature must be a number');
  throws(() => {
    t.fahrenheit = Infinity;
  }, 'temperature must be a number');
  throws(() => new Temperature(null), 'temperature must be a number');
});

test('exactly absolute zero is allowed', () => {
  const t = Temperature.fromKelvin(0);
  approx(t.kelvin, 0);
  approx(t.celsius, -273.15, 1e-9);
});

test('toString shows celsius to one decimal', () => {
  eq(String(Temperature.fromCelsius(21)), '21.0°C');
  eq(String(Temperature.fromCelsius(-3.456)), '-3.5°C');
  eq(`${Temperature.fromFahrenheit(32)}`, '0.0°C');
});

test('the stored value is private — only the accessors are public', () => {
  const t = Temperature.fromCelsius(20);
  eq(Object.keys(t), []);
  eq(JSON.stringify(t), '{}');
  ok('celsius' in t, 'the accessors live on the prototype');
  eq(Object.hasOwn(Temperature.prototype, 'fahrenheit'), true);
});
