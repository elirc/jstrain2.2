// ─────────────────────────────────────────────────────────────────────────
//  36 · temperature units                                     ★★☆ core
//  concepts: accessors · unit conversion · validation
//  run: node 36-temperature-units.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A number without a unit is a bug waiting for a rocket. Wrap it: store
//  ONE canonical value (kelvin) and expose every unit as an accessor pair,
//  so all three views can never disagree.
//
//      const t = Temperature.fromCelsius(100);
//      t.fahrenheit        → 212
//      t.kelvin            → 373.15
//      t.fahrenheit = 32;
//      t.celsius           → 0        (one source of truth moved)
//      String(t)           → '0.0°C'
//
//      Temperature.fromFahrenheit(-40).celsius  → -40
//      t.celsius = -300    → RangeError 'below absolute zero'
//      t.kelvin  = '300'   → TypeError 'temperature must be a number'
//
//  celsius = kelvin - 273.15, fahrenheit = celsius * 9 / 5 + 32. Every
//  entry point — the constructor, all three setters, all three statics —
//  has to pass the same two guards, so write them ONCE and route
//  everything else through them. NaN and Infinity fail the number
//  guard too — finite or nothing.
//
//  hint: `this.kelvin = …` inside the class calls the setter;
//  `this.#kelvin = …` skips it, and with it the guard

import { test, eq, ok, approx, throws } from '../../_lib/check.js';

export class Temperature {
  #kelvin;

  constructor(kelvin) {
    throw new Error('TODO');
  }

  static fromKelvin(value) {
    throw new Error('TODO');
  }

  static fromCelsius(value) {
    throw new Error('TODO');
  }

  static fromFahrenheit(value) {
    throw new Error('TODO');
  }

  get kelvin() {
    throw new Error('TODO');
  }

  set kelvin(value) {
    throw new Error('TODO');
  }

  get celsius() {
    throw new Error('TODO');
  }

  set celsius(value) {
    throw new Error('TODO');
  }

  get fahrenheit() {
    throw new Error('TODO');
  }

  set fahrenheit(value) {
    throw new Error('TODO');
  }

  toString() {
    throw new Error('TODO');
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
