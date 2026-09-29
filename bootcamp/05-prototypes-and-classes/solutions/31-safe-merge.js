// ─────────────────────────────────────────────────────────────────────────
//  31 · safe merge — SOLUTION                              ★★★ stretch
//  run: node 31-safe-merge.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the attack works because assignment and the prototype
//  chain share a namespace. `target['__proto__']` does not create a
//  property — it hits the inherited setter and reaches the object's
//  prototype, so a recursive merge writes straight onto Object.prototype.
//  From then on EVERY object in the process inherits `isAdmin: true`, and
//  the code that later asks `if (user.isAdmin)` is now wrong. The
//  'constructor' → 'prototype' path gets there the long way round.
//
//  The fix is one `continue` in the loop, applied at every depth because
//  the payload nests. Object.keys() does the other half of the work: it
//  returns own enumerable string keys only, so nothing is inherited into
//  the config by accident.
//
//  Two details worth keeping. `isPlainObject` treats arrays as values so
//  they replace instead of merging index-by-index (merging arrays is
//  almost never what a config wants). And when the target has no object
//  to merge into, recursing into a fresh `{}` copies the source's nested
//  objects instead of aliasing them — otherwise editing the merged config
//  edits the defaults it came from.

import { test, eq, ok } from '../../_lib/check.js';

const UNSAFE = new Set(['__proto__', 'constructor', 'prototype']);

const isPlainObject = (value) =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export function isUnsafeKey(key) {
  return UNSAFE.has(key);
}

export function safeMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (isUnsafeKey(key)) continue;
    const value = source[key];
    if (isPlainObject(value)) {
      const into = isPlainObject(target[key]) ? target[key] : {};
      target[key] = safeMerge(into, value);
    } else {
      target[key] = value;
    }
  }
  return target;
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
