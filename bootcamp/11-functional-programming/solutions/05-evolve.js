// ─────────────────────────────────────────────────────────────────────────
//  05 · evolve — SOLUTION                                   ★★★ stretch
//  run: node 05-evolve.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: start from a shallow copy — that already satisfies "keys
//  with no transform are copied across" — then walk the TRANSFORMS, not
//  the object. Walking the transforms is what makes "ignore transforms for
//  missing keys" a one-line `if (!(key in obj)) continue`, and it keeps the
//  loop proportional to the work you actually asked for.
//  The recursive branch is the whole trick: a transform value that is an
//  object is just another transform map, so evolve calls itself. Guarding
//  it with `isObject(obj[key])` stops you from trying to recurse into a
//  number when the shapes disagree.
//  Classic wrong turn: `out[key] = t(obj[key])` without the typeof check —
//  a nested transform map is not callable and you get a TypeError.

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

const isObject = (v) => v !== null && typeof v === 'object';

export function evolve(obj, transforms) {
  const out = { ...obj };
  for (const [key, transform] of Object.entries(transforms)) {
    if (!(key in obj)) continue;
    if (typeof transform === 'function') {
      out[key] = transform(obj[key]);
    } else if (isObject(transform) && isObject(obj[key])) {
      out[key] = evolve(obj[key], transform);
    }
  }
  return out;
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
