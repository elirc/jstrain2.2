// ─────────────────────────────────────────────────────────────────────────
//  27 · instance registry                                  ★★★ stretch
//  concepts: static factories · interning · guarded constructors
//  run: node 27-instance-registry.js
// ─────────────────────────────────────────────────────────────────────────
//
//  There are only so many airports, and 'LAX' always means the same one.
//  So hand out ONE object per code and reuse it — interning. Callers get
//  `===` comparison for free and you stop allocating duplicates.
//
//      Airport.for('LAX') === Airport.for('LAX')  → true   (same object)
//      Airport.for(' lax ').code                  → 'LAX'  (normalised)
//      Airport.count                              → 1
//      new Airport('LAX')  → throws 'use Airport.for()'
//      Airport.for('L')    → throws 'code must be a 3-letter string'
//      Airport.reset()     → empties the registry
//
//  JavaScript has no private constructor, so use the convention: the
//  constructor demands the module-private OPEN token, which only for()
//  can pass. And because everyone shares one instance, freeze it — a
//  caller who could edit `code` would edit it for the whole program.
//
//  hint: for() is find-or-create against Airport.#registry, and both the
//  lookup and the store must use the NORMALISED code as the key

import { test, eq, ok, throws } from '../../_lib/check.js';

// ── scaffolding: not exported, so only this class body can pass it ───────

const OPEN = Symbol('Airport.for');

export class Airport {
  static #registry = new Map();

  constructor(code, token) {
    throw new Error('TODO');
  }

  static #normalise(code) {
    throw new Error('TODO');
  }

  static for(code) {
    throw new Error('TODO');
  }

  static get count() {
    throw new Error('TODO');
  }

  static reset() {
    throw new Error('TODO');
  }

  toString() {
    throw new Error('TODO');
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
