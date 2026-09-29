// ─────────────────────────────────────────────────────────────────────────
//  31 · safe merge                                         ★★★ stretch
//  concepts: prototype pollution · deep merge · own keys
//  run: node 31-safe-merge.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Every config loader ends up with a deep merge, and the naive one is a
//  security bug. `JSON.parse('{"__proto__":{"isAdmin":true}}')` produces an
//  object with an OWN '__proto__' key; recurse into it and you are writing
//  onto Object.prototype, which every object in the program inherits from.
//  Same story for 'constructor' → 'prototype'.
//
//      isUnsafeKey('__proto__')  → true
//      isUnsafeKey('proto')      → false
//
//      safeMerge({ a: 1 }, { b: 2 })                  → { a: 1, b: 2 }
//      safeMerge({ db: { host: 'x' } }, { db: { port: 5 } })
//                                → { db: { host: 'x', port: 5 } }
//      safeMerge({}, JSON.parse('{"__proto__":{"isAdmin":true}}'))
//                                → {}   and ({}).isAdmin stays undefined
//
//  Rules: walk only the source's own enumerable keys; skip unsafe keys at
//  every depth; merge two plain objects, but let anything else (arrays
//  included) replace what was there; return the target.
//
//  hint: when the source holds an object and the target does not, recurse
//  into a fresh `{}` — assigning the source object itself makes the two
//  configs share it

import { test, eq, ok } from '../../_lib/check.js';

export function isUnsafeKey(key) {
  throw new Error('TODO');
}

export function safeMerge(target, source) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('isUnsafeKey names the three keys that can rewrite the language', () => {
  eq(isUnsafeKey('__proto__'), true);
  eq(isUnsafeKey('constructor'), true);
  eq(isUnsafeKey('prototype'), true);
  eq(isUnsafeKey('proto'), false);
  eq(isUnsafeKey('name'), false);
  eq(isUnsafeKey('__proto'), false);
});

test('flat objects merge, with the source winning', () => {
  const target = { a: 1, b: 2 };
  const out = safeMerge(target, { b: 20, c: 3 });
  eq(out, { a: 1, b: 20, c: 3 });
  ok(out === target, 'the target is filled in and handed back');
});

test('nested plain objects merge key by key', () => {
  const out = safeMerge(
    { db: { host: 'localhost', port: 5432 }, debug: false },
    { db: { port: 6000 }, debug: true }
  );
  eq(out, { db: { host: 'localhost', port: 6000 }, debug: true });
});

test('arrays replace, they do not merge', () => {
  eq(safeMerge({ tags: ['a', 'b'] }, { tags: ['c'] }), { tags: ['c'] });
  eq(safeMerge({ x: { deep: 1 } }, { x: 5 }), { x: 5 });
});

test('a __proto__ payload is dropped and nothing global changes', () => {
  const payload = JSON.parse('{"user":"ada","__proto__":{"isAdmin":true}}');
  eq(Object.hasOwn(payload, '__proto__'), true, 'JSON.parse really makes one');
  const config = safeMerge({}, payload);
  eq(config, { user: 'ada' });
  eq(Object.hasOwn(config, '__proto__'), false);
  eq({}.isAdmin, undefined, 'Object.prototype must be untouched');
  ok(Object.getPrototypeOf(config) === Object.prototype);
});

test('the constructor.prototype route is closed at every depth', () => {
  const payload = JSON.parse(
    '{"b":2,"a":{"constructor":{"prototype":{"hacked":1}}}}'
  );
  eq(safeMerge({}, payload), { b: 2, a: {} });
  eq({}.hacked, undefined);
  eq(safeMerge({}, JSON.parse('{"prototype":{"x":1}}')), {});
});

test('only own enumerable keys are copied', () => {
  const source = Object.create({ inherited: 'nope' });
  source.own = 'yes';
  eq(safeMerge({}, source), { own: 'yes' });
});

test('nested objects are copied, not shared with the source', () => {
  const source = { db: { host: 'localhost' } };
  const config = safeMerge({}, source);
  config.db.host = 'changed';
  eq(source.db.host, 'localhost', 'a shared reference is a later surprise');
});
