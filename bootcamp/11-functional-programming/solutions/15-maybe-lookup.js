// ─────────────────────────────────────────────────────────────────────────
//  15 · refactoring lookups with Maybe — SOLUTION           ★★☆ core
//  run: node 15-maybe-lookup.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: each `.map` is one hop through the data, and the fallback
//  is written ONCE at the end instead of at every early return. Nothing
//  propagates on its own, so a missing user, a missing addressId, a
//  dangling id and a null city all arrive at the same `getOrElse`.
//  Be honest about the trade, though: shippingCity is a straight chain,
//  and optional chaining says the same thing in one line —
//
//      db.addresses[db.users[id]?.addressId]?.city?.toUpperCase()
//        ?? 'unknown'
//
//  — with no wrapper type to learn. Reach for `?.` there. Maybe earns its
//  keep in eastLondonCode, where a step is a CONDITION (`filter`) rather
//  than a property hop; `?.` has no answer for "and only if it starts with
//  E", so you would be back to an if. The lesson is the shape of the
//  chain, not a rule that Maybe is always better.

import { test, eq } from '../../_lib/check.js';

// provided — the Maybe you built in exercise 14
function Maybe(value) {
  const isNothing = value === null || value === undefined;
  return {
    isNothing,
    map: (fn) => (isNothing ? Maybe(null) : Maybe(fn(value))),
    chain: (fn) => (isNothing ? Maybe(null) : fn(value)),
    filter: (pred) => (isNothing || !pred(value) ? Maybe(null) : Maybe(value)),
    getOrElse: (fallback) => (isNothing ? fallback : value),
  };
}

const db = Object.freeze({
  users: {
    u1: { id: 'u1', name: 'Ada', addressId: 'a1' },
    u2: { id: 'u2', name: 'Bo' }, //            no address at all
    u3: { id: 'u3', name: 'Cy', addressId: 'a9' }, // points nowhere
    u4: { id: 'u4', name: 'Di', addressId: 'a2' },
    u5: { id: 'u5', name: 'Eve', addressId: 'a3' }, // address has no city
  },
  addresses: {
    a1: { id: 'a1', city: 'london', zip: 'E1 7AA' },
    a2: { id: 'a2', city: 'watford', zip: 'W2 3BB' },
    a3: { id: 'a3', city: null, zip: 'E9 1XX' },
  },
});

export function shippingCity(db, userId) {
  return Maybe(db.users[userId])
    .map((user) => user.addressId)
    .map((id) => db.addresses[id])
    .map((address) => address.city)
    .map((city) => city.toUpperCase())
    .getOrElse('unknown');
}

export function eastLondonCode(db, userId) {
  return Maybe(db.users[userId])
    .map((user) => user.addressId)
    .map((id) => db.addresses[id])
    .map((address) => address.zip)
    .filter((zip) => zip.startsWith('E'))
    .map((zip) => `ZIP-${zip.split(' ')[0]}`)
    .getOrElse('none');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('walks user → address → city and shouts it', () => {
  eq(shippingCity(db, 'u1'), 'LONDON');
});

test('an unknown user falls back', () => {
  eq(shippingCity(db, 'nobody'), 'unknown');
});

test('a user with no address id falls back', () => {
  eq(shippingCity(db, 'u2'), 'unknown');
});

test('an address id pointing at nothing falls back', () => {
  eq(shippingCity(db, 'u3'), 'unknown');
});

test('an address whose city is null falls back', () => {
  eq(shippingCity(db, 'u5'), 'unknown');
});

test('eastLondonCode builds a code for an E postcode', () => {
  eq(eastLondonCode(db, 'u1'), 'ZIP-E1');
});

test('eastLondonCode rejects a postcode from anywhere else', () => {
  eq(eastLondonCode(db, 'u4'), 'none');
});

test('eastLondonCode survives every kind of missing data', () => {
  eq(eastLondonCode(db, 'nobody'), 'none');
  eq(eastLondonCode(db, 'u2'), 'none');
  eq(eastLondonCode(db, 'u3'), 'none');
});
