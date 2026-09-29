// ─────────────────────────────────────────────────────────────────────────
//  27 · instance registry — SOLUTION                       ★★★ stretch
//  run: node 27-instance-registry.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: three ideas stacked. (1) Interning — for() is a
//  find-or-create against a Map that lives on the class, so one code maps
//  to one object forever and callers can compare with ===. (2) A guarded
//  constructor — OPEN is a module-local Symbol, so no code outside this
//  file can produce the second argument; that is JavaScript's stand-in for
//  a private constructor, and it forces every caller through the factory
//  where the caching and validation live. (3) Immutability — a shared
//  object that anyone can edit is a global variable in disguise, so the
//  constructor freezes it on the way out.
//
//  Normalising BEFORE the lookup is what makes 'lax' and ' LAX ' the same
//  airport; normalising after would happily register three of them. And
//  validating inside #normalise means the bad-input test can also assert
//  that count never moved — nothing is stored until the code is legal.

import { test, eq, ok, throws } from '../../_lib/check.js';

// ── scaffolding: not exported, so only this class body can pass it ───────

const OPEN = Symbol('Airport.for');

export class Airport {
  static #registry = new Map();

  constructor(code, token) {
    if (token !== OPEN) throw new TypeError('use Airport.for() instead of new');
    this.code = code;
    Object.freeze(this);
  }

  static #normalise(code) {
    if (typeof code !== 'string' || code.trim().length !== 3) {
      throw new TypeError('code must be a 3-letter string');
    }
    return code.trim().toUpperCase();
  }

  static for(code) {
    const key = Airport.#normalise(code);
    let found = Airport.#registry.get(key);
    if (found === undefined) {
      found = new Airport(key, OPEN);
      Airport.#registry.set(key, found);
    }
    return found;
  }

  static get count() {
    return Airport.#registry.size;
  }

  static reset() {
    Airport.#registry.clear();
  }

  toString() {
    return `Airport(${this.code})`;
  }
}

// ──────────────────────────── tests ──────────────────────────────────────

test('for hands back the very same object every time', () => {
  Airport.reset();
  const a = Airport.for('LAX');
  const b = Airport.for('LAX');
  ok(a === b, 'interning: one object per code');
  eq(a.code, 'LAX');
  eq(Airport.count, 1);
});

test('codes are normalised before anything is looked up', () => {
  Airport.reset();
  ok(Airport.for(' lax ') === Airport.for('LAX'));
  eq(Airport.for('lax').code, 'LAX');
  eq(Airport.count, 1, 'three spellings, one airport');
});

test('the factory is the only door — new is refused', () => {
  Airport.reset();
  throws(() => new Airport('LAX'), 'use Airport.for()');
  throws(() => new Airport('LAX', 'please'), 'use Airport.for()');
  eq(Airport.count, 0);
});

test('count grows once per distinct code', () => {
  Airport.reset();
  Airport.for('LAX');
  Airport.for('JFK');
  Airport.for('LAX');
  eq(Airport.count, 2);
});

test('reset empties the registry, so later calls build fresh objects', () => {
  Airport.reset();
  const before = Airport.for('LAX');
  Airport.reset();
  eq(Airport.count, 0);
  const after = Airport.for('LAX');
  ok(before !== after, 'a new registry means a new object');
  eq(after.code, before.code);
});

test('shared instances are frozen, because everyone holds the same one', () => {
  Airport.reset();
  const lax = Airport.for('LAX');
  throws(() => {
    lax.code = 'JFK';
  });
  eq(lax.code, 'LAX');
  eq(Object.isFrozen(lax), true);
  eq(String(lax), 'Airport(LAX)');
});

test('bad codes are rejected before anything is registered', () => {
  Airport.reset();
  throws(() => Airport.for('L'), 'code must be a 3-letter string');
  throws(() => Airport.for('LAXX'), 'code must be a 3-letter string');
  throws(() => Airport.for(123), 'code must be a 3-letter string');
  throws(() => Airport.for(null), 'code must be a 3-letter string');
  eq(Airport.count, 0);
});

test('the registry belongs to the class, not to any instance', () => {
  Airport.reset();
  const lax = Airport.for('LAX');
  eq(lax.count, undefined);
  eq(lax.for, undefined);
  eq(Object.keys(lax), ['code']);
});
