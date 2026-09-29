// ─────────────────────────────────────────────────────────────────────────
//  17 · nested object destructuring                             ★★☆ core
//  concepts: renaming · nested patterns · defaults
//  run: node 17-destructuring-objects.js
// ─────────────────────────────────────────────────────────────────────────
//
//  An API hands you a nested payload; your code wants a flat record with
//  your own field names. Do it in ONE destructuring pattern.
//
//      parseUser({ id: 7, profile: { name: 'Ada', city: 'London' },
//                  tags: ['x'] })
//      → { userId: 7, name: 'Ada', city: 'London', tagCount: 1 }
//
//      parseUser({ id: 7 })
//      → { userId: 7, name: 'anonymous', city: 'unknown', tagCount: 0 }
//
//      parseUser({ id: 7, profile: { name: null } }).name  → null
//
//  Rules: `id` is renamed to `userId`; a missing name defaults to
//  'anonymous' and a missing city to 'unknown'; a missing `profile`
//  object still produces those defaults; missing `tags` counts as 0.
//  Assume `profile`, when present, is an object.
//
//  hint: patterns nest and take defaults at every level —
//  `{ profile: { name = 'anonymous' } = {} }`.

import { test, eq } from '../../_lib/check.js';

export function parseUser(payload) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('renames id to userId', () => {
  eq(parseUser({ id: 7 }).userId, 7);
  eq(parseUser({ id: 'abc' }).userId, 'abc');
});

test('reads the nested profile fields', () => {
  eq(parseUser({ id: 1, profile: { name: 'Ada', city: 'London' } }), {
    userId: 1,
    name: 'Ada',
    city: 'London',
    tagCount: 0,
  });
});

test('a missing profile still yields both defaults', () => {
  eq(parseUser({ id: 2 }), {
    userId: 2,
    name: 'anonymous',
    city: 'unknown',
    tagCount: 0,
  });
});

test('defaults apply field by field', () => {
  eq(parseUser({ id: 3, profile: { name: 'Bo' } }).city, 'unknown');
  eq(parseUser({ id: 3, profile: { city: 'Oslo' } }).name, 'anonymous');
});

test('an explicit null is kept — defaults only replace undefined', () => {
  eq(parseUser({ id: 4, profile: { name: null } }).name, null);
  eq(parseUser({ id: 4, profile: { name: undefined } }).name, 'anonymous');
  eq(parseUser({ id: 4, profile: { city: '' } }).city, '');
});

test('tagCount counts the tags, defaulting to an empty list', () => {
  eq(parseUser({ id: 5, tags: ['a', 'b', 'c'] }).tagCount, 3);
  eq(parseUser({ id: 5, tags: [] }).tagCount, 0);
  eq(parseUser({ id: 5 }).tagCount, 0);
});
