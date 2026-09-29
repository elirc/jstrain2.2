// ─────────────────────────────────────────────────────────────────────────
//  17 · nested object destructuring — SOLUTION                  ★★☆ core
//  run: node 17-destructuring-objects.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: read the pattern right-to-left at each level. In
//  `profile: { name = 'anonymous' } = {}` the trailing `= {}` handles a
//  missing profile — without it, destructuring undefined throws
//  "Cannot destructure property 'name' of undefined". The inner
//  `= 'anonymous'` then handles a present-but-incomplete profile.
//
//  `id: userId` renames rather than nests — the colon means "rename"
//  when the right side is an identifier and "descend" when it is another
//  pattern. That double duty is the one confusing part of the syntax.
//
//  Note what defaults do NOT cover: `{ name: null }` keeps null. If you
//  need null handled too, that is a `??`, not a destructuring default.

import { test, eq } from '../../_lib/check.js';

export function parseUser(payload) {
  const {
    id: userId,
    profile: { name = 'anonymous', city = 'unknown' } = {},
    tags = [],
  } = payload;
  return { userId, name, city, tagCount: tags.length };
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
