// ─────────────────────────────────────────────────────────────────────────
//  08 · own vs inherited                                   ★★☆ core
//  concepts: Object.hasOwn · in · walking the chain
//  run: node 08-own-vs-inherited.js
// ─────────────────────────────────────────────────────────────────────────
//
//  `in` searches the whole prototype chain. `Object.hasOwn` looks at one
//  object. Knowing which question you are asking is most of debugging an
//  inheritance bug. Build three inspectors:
//
//    ownKeys(obj)          own enumerable string keys, sorted
//    inheritedKeys(obj)    enumerable keys that come from the chain only
//    allPropertyNames(obj) EVERY name on the whole chain, deduped, sorted
//                          (non-enumerables included)
//
//      ownKeys(makeDog())            → ['name']
//      inheritedKeys(makeDog())      → ['kind', 'speak']
//      allPropertyNames({}).includes('hasOwnProperty')   → true
//
//  hint: `for...in` walks the chain but skips non-enumerables;
//  Object.getOwnPropertyNames does the opposite. You need both.

import { test, eq, ok } from '../../_lib/check.js';

// ── scaffolding: a two-level chain, built by hand ────────────────────────

const animalBase = {
  kind: 'animal',
  speak() {
    return 'noise';
  },
};

function makeDog(name = 'Rex') {
  const dog = Object.create(animalBase);
  dog.name = name;
  return dog;
}

export function ownKeys(obj) {
  throw new Error('TODO');
}

export function inheritedKeys(obj) {
  throw new Error('TODO');
}

export function allPropertyNames(obj) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('ownKeys lists only what the object itself holds', () => {
  eq(ownKeys(makeDog()), ['name']);
  eq(ownKeys({ b: 1, a: 2 }), ['a', 'b']);
});

test('ownKeys is empty for an object that owns nothing', () => {
  eq(ownKeys(Object.create(animalBase)), []);
});

test('inheritedKeys reports what the prototype supplies', () => {
  eq(inheritedKeys(makeDog()), ['kind', 'speak']);
});

test('inheritedKeys is empty for a plain literal', () => {
  eq(inheritedKeys({ a: 1 }), []);
});

test('a shadowed key counts as own, never as inherited', () => {
  const dog = makeDog();
  dog.kind = 'pet';
  eq(ownKeys(dog), ['kind', 'name']);
  eq(inheritedKeys(dog), ['speak']);
});

test('allPropertyNames reaches the built-ins on Object.prototype', () => {
  const names = allPropertyNames({ a: 1 });
  ok(names.includes('a'));
  ok(names.includes('hasOwnProperty'), 'non-enumerable, but still there');
  ok(names.includes('toString'));
});

test('allPropertyNames lists a shadowed name exactly once', () => {
  const dog = makeDog();
  dog.kind = 'pet';
  const names = allPropertyNames(dog);
  eq(names.filter((n) => n === 'kind').length, 1);
});

test('an object with no prototype has nothing but its own keys', () => {
  const bare = Object.create(null);
  bare.a = 1;
  eq(allPropertyNames(bare), ['a']);
});
