// ─────────────────────────────────────────────────────────────────────────
//  03 · test data builders — SOLUTION                       ★☆☆ warm-up
//  run: node 03-data-builders.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the whole point is that a test names ONLY what it is about.
//  `makeUser({ active: false }, nextId)` says "an inactive user" and says
//  nothing about zip codes, which is exactly what the reader needs.
//  Two details do all the work. First, the defaults object is built INSIDE
//  the function, so every call gets fresh nested objects — hoist it to
//  module scope and every user shares one `address`, which is the classic
//  "test 7 mutated the fixture and test 9 went red" bug.
//  Second, uniqueness comes from an injected `nextId` rather than a global
//  counter or `Math.random()`, so ids are deterministic per test and two
//  users are never accidentally the same row.
//  Merging is one level deep on purpose: `address` merges (you override a
//  city and keep the zip), arrays replace (`roles: ['admin']` means exactly
//  those roles, not admin appended to viewer).

import { test, eq, ok } from '../../_lib/check.js';

export function makeCounter(start = 1) {
  let n = start;
  return () => n++;
}

export function makeUser(overrides = {}, nextId) {
  const id = overrides.id ?? nextId();
  const defaults = {
    id,
    name: `User ${id}`,
    email: `user${id}@example.test`,
    active: true,
    address: { city: 'Springfield', zip: '00000', country: 'US' },
    roles: ['viewer'],
  };
  return {
    ...defaults,
    ...overrides,
    address: { ...defaults.address, ...overrides.address },
  };
}

// ──────────────────────────── tests ──────────────────────────────────────

test('makeCounter yields consecutive numbers from its start', () => {
  const next = makeCounter(10);
  eq([next(), next(), next()], [10, 11, 12]);
  eq(makeCounter()(), 1);
});

test('builds a complete user from the defaults', () => {
  const nextId = makeCounter(1);
  eq(makeUser({}, nextId), {
    id: 1,
    name: 'User 1',
    email: 'user1@example.test',
    active: true,
    address: { city: 'Springfield', zip: '00000', country: 'US' },
    roles: ['viewer'],
  });
});

test('each call takes a fresh id from the counter', () => {
  const nextId = makeCounter(1);
  const a = makeUser({}, nextId);
  const b = makeUser({}, nextId);
  eq([a.id, b.id], [1, 2]);
  eq(b.email, 'user2@example.test');
});

test('a top-level override wins over the default', () => {
  const nextId = makeCounter(1);
  const user = makeUser({ active: false, name: 'Ada' }, nextId);
  eq(user.active, false);
  eq(user.name, 'Ada');
  eq(user.email, 'user1@example.test');
});

test('an explicit id override drives the derived fields', () => {
  const nextId = makeCounter(1);
  const user = makeUser({ id: 42 }, nextId);
  eq(user.id, 42);
  eq(user.name, 'User 42');
  eq(user.email, 'user42@example.test');
});

test('a nested address override keeps the other address defaults', () => {
  const nextId = makeCounter(1);
  const user = makeUser({ address: { city: 'Oslo' } }, nextId);
  eq(user.address, { city: 'Oslo', zip: '00000', country: 'US' });
});

test('arrays are replaced, not merged', () => {
  const nextId = makeCounter(1);
  eq(makeUser({ roles: ['admin'] }, nextId).roles, ['admin']);
});

test('two users never share the same nested address object', () => {
  const nextId = makeCounter(1);
  const a = makeUser({}, nextId);
  const b = makeUser({}, nextId);
  ok(a.address !== b.address, 'each user needs its own address object');
  a.address.city = 'Mutated';
  eq(b.address.city, 'Springfield');
});
