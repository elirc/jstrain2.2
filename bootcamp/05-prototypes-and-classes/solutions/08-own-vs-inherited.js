// ─────────────────────────────────────────────────────────────────────────
//  08 · own vs inherited — SOLUTION                        ★★☆ core
//  run: node 08-own-vs-inherited.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: three different views of the same chain.
//    Object.keys        → own + enumerable        (what you usually want)
//    for...in           → own + inherited, enumerable only
//    getOwnPropertyNames→ own, enumerable or not  (methods live here)
//
//  `inheritedKeys` is literally `for...in` minus `Object.hasOwn` — the
//  classic guard you see in old codebases as
//  `Object.prototype.hasOwnProperty.call(obj, key)`, written the long way
//  because `obj.hasOwnProperty` breaks on `Object.create(null)` objects
//  and on any object with a `hasOwnProperty` key of its own.
//
//  `allPropertyNames` is the chain walk itself: collect own names, step to
//  Object.getPrototypeOf, repeat until null. A Set dedupes shadowed names.
//  Class methods are non-enumerable, so this is the only view that sees
//  them — remember that in exercise 10.

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
  return Object.keys(obj).sort();
}

export function inheritedKeys(obj) {
  const found = [];
  for (const key in obj) {
    if (!Object.hasOwn(obj, key)) found.push(key);
  }
  return found.sort();
}

export function allPropertyNames(obj) {
  const seen = new Set();
  let current = obj;
  while (current !== null) {
    for (const name of Object.getOwnPropertyNames(current)) seen.add(name);
    current = Object.getPrototypeOf(current);
  }
  return [...seen].sort();
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
