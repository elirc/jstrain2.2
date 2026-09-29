// ─────────────────────────────────────────────────────────────────────────
//  10 · class is sugar                                     ★★☆ core
//  concepts: prototype · own properties · descriptors
//  run: node 10-class-is-sugar.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Prove to yourself that `class` is a spelling, not a new kind of thing.
//  The Tag class below is written for you. Build two X-ray tools:
//
//    whereDoesItLive(obj, key) → 'own' | 'prototype' | 'missing'
//      'own'        the object itself holds the key
//      'prototype'  it is reachable, but from somewhere up the chain
//      'missing'    nowhere on the chain
//
//    methodNames(Ctor) → sorted own property names of Ctor.prototype,
//                        minus 'constructor' (getters count: they are
//                        properties of the prototype too)
//
//      whereDoesItLive(new Tag('a'), 'label')     → 'own'
//      whereDoesItLive(new Tag('a'), 'render')    → 'prototype'
//      whereDoesItLive(new Tag('a'), 'nope')      → 'missing'
//      methodNames(Tag)                           → ['bump','loud','render']
//
//  hint: Object.keys skips non-enumerable properties, and every class
//  method is non-enumerable — use getOwnPropertyNames

import { test, eq } from '../../_lib/check.js';

// ── scaffolding: an ordinary class, already written ──────────────────────

export class Tag {
  clicks = 0;

  constructor(label) {
    this.label = label;
  }

  render() {
    return `<b>${this.label}</b>`;
  }

  bump() {
    this.clicks += 1;
    return this.clicks;
  }

  get loud() {
    return this.label.toUpperCase();
  }
}

export function whereDoesItLive(obj, key) {
  throw new Error('TODO');
}

export function methodNames(Ctor) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('a class field lands on the instance', () => {
  eq(whereDoesItLive(new Tag('a'), 'clicks'), 'own');
});

test('so does anything the constructor assigns', () => {
  eq(whereDoesItLive(new Tag('a'), 'label'), 'own');
});

test('methods do NOT — they live on Tag.prototype', () => {
  eq(whereDoesItLive(new Tag('a'), 'render'), 'prototype');
  eq(whereDoesItLive(new Tag('a'), 'loud'), 'prototype');
});

test('the chain keeps going past Tag.prototype', () => {
  eq(whereDoesItLive(new Tag('a'), 'toString'), 'prototype');
});

test('unknown keys are missing, not own', () => {
  eq(whereDoesItLive(new Tag('a'), 'nope'), 'missing');
});

test('methodNames finds every method the class declared', () => {
  eq(methodNames(Tag), ['bump', 'loud', 'render']);
});

test('it works the same on a constructor function', () => {
  function Legacy() {}
  Legacy.prototype.ping = function () {};
  eq(methodNames(Legacy), ['ping']);
});

test('fields are enumerable, methods are not', () => {
  const t = new Tag('a');
  eq(whereDoesItLive(t, 'render'), 'prototype');
  eq(Object.keys(t).sort(), ['clicks', 'label']);
  eq(Object.keys(Tag.prototype), []);
});
