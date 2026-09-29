// ─────────────────────────────────────────────────────────────────────────
//  05 · evolve                                              ★★★ stretch
//  concepts: higher-order functions · recursion · immutability
//  run: node 05-evolve.js
// ─────────────────────────────────────────────────────────────────────────
//
//  `setIn` changes one key to one value. `evolve` changes MANY keys, each
//  by its own function, in one immutable pass. It is the utility you reach
//  for when a payload needs per-field cleanup.
//
//      evolve({ name: ' ada ', age: 41 }, { name: (s) => s.trim() })
//        → { name: 'ada', age: 41 }
//
//      evolve(user, { profile: { views: (n) => n + 1 } })
//        → profile.views bumped, everything else shared
//
//  The rules:
//    · transform is a function          → newValue = fn(oldValue)
//    · transform is an object AND the old value is an object → recurse
//    · a key with no transform          → copied across as-is
//    · a transform for a key the object does not have → ignored
//    · the input is never mutated
//
//  hint: the recursive branch is a call to evolve itself.

import { test, eq, ok } from '../../_lib/check.js';

const deepFreeze = (value) => {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze);
  }
  return Object.freeze(value);
};

const user = deepFreeze({
  name: '  ada lovelace ',
  email: 'ADA@EXAMPLE.COM',
  tags: ['math', 'engines'],
  profile: { views: 41, bio: 'first programmer' },
});

export function evolve(obj, transforms) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('applies one function per named key', () => {
  const next = evolve(user, {
    name: (s) => s.trim(),
    email: (s) => s.toLowerCase(),
  });
  eq(next.name, 'ada lovelace');
  eq(next.email, 'ada@example.com');
});

test('copies keys that have no transform', () => {
  const next = evolve(user, { name: (s) => s.trim() });
  eq(next.profile, { views: 41, bio: 'first programmer' });
  ok(next.tags === user.tags, 'untouched values keep their identity');
});

test('ignores transforms for keys the object does not have', () => {
  const next = evolve({ a: 1 }, { a: (n) => n + 1, zzz: (n) => n * 100 });
  eq(next, { a: 2 });
});

test('recurses when the transform is an object', () => {
  const next = evolve(user, { profile: { views: (n) => n + 1 } });
  eq(next.profile, { views: 42, bio: 'first programmer' });
});

test('array values are handled by ordinary functions', () => {
  const next = evolve(user, { tags: (list) => [...list, 'analytical'] });
  eq(next.tags, ['math', 'engines', 'analytical']);
  eq(user.tags, ['math', 'engines']);
});

test('never mutates the input, at any depth', () => {
  evolve(user, { name: (s) => s.trim(), profile: { views: (n) => n + 1 } });
  eq(user.name, '  ada lovelace ');
  eq(user.profile.views, 41);
});

test('an empty transform map returns an equal copy', () => {
  const next = evolve(user, {});
  eq(next, user);
  ok(next !== user, 'still a fresh object');
});
