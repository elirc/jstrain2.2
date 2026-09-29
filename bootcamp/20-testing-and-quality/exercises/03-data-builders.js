// ─────────────────────────────────────────────────────────────────────────
//  03 · test data builders                                  ★☆☆ warm-up
//  concepts: fixtures · defaults · shallow vs deep merge
//  run: node 03-data-builders.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Twenty tests that each spell out a whole User object are twenty tests
//  nobody can read. A builder gives you a valid object by default so a test
//  names only the field it is actually about.
//
//      const nextId = makeCounter(1);      // injected uniqueness
//      nextId(); nextId()          → 1, 2
//
//      makeUser({}, nextId)        → { id: 1, name: 'User 1',
//                                      email: 'user1@example.test',
//                                      active: true,
//                                      address: { city: 'Springfield',
//                                                 zip: '00000',
//                                                 country: 'US' },
//                                      roles: ['viewer'] }
//
//      makeUser({ active: false }, nextId).email     → 'user2@example.test'
//      makeUser({ address: { city: 'Oslo' } }, n)    → zip is still '00000'
//      makeUser({ roles: ['admin'] }, n).roles       → ['admin']
//      makeUser({ id: 42 }, n).name                  → 'User 42'
//
//  So: top-level keys override, `address` merges one level deep, arrays
//  replace wholesale, and an explicit id drives the derived fields.

import { test, eq, ok } from '../../_lib/check.js';

export function makeCounter(start = 1) {
  throw new Error('TODO');
}

export function makeUser(overrides = {}, nextId) {
  throw new Error('TODO');
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
