// ─────────────────────────────────────────────────────────────────────────
//  15 · refactoring lookups with Maybe                      ★★☆ core
//  concepts: null safety · chaining · fallbacks
//  run: node 15-maybe-lookup.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Here is the code you are replacing. Four checks, one real line of work:
//
//      function shippingCity(db, userId) {
//        const user = db.users[userId];
//        if (!user) return 'unknown';
//        if (!user.addressId) return 'unknown';
//        const address = db.addresses[user.addressId];
//        if (!address || !address.city) return 'unknown';
//        return address.city.toUpperCase();
//      }
//
//  Rewrite both functions as ONE chain each on the Maybe provided below.
//
//      shippingCity(db, 'u1')    → 'LONDON'
//      shippingCity(db, 'nope')  → 'unknown'
//
//      eastLondonCode(db, 'u1')  → 'ZIP-E1'   (zip starts with 'E')
//      eastLondonCode(db, 'u4')  → 'none'     (zip is 'W2 3BB')
//
//  eastLondonCode takes the first word of the zip and prefixes 'ZIP-'.
//
//  hint: a lookup that misses gives undefined, and Maybe already knows
//  what to do with that — so `.map` is enough; you never need an `if`.

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
  throw new Error('TODO');
}

export function eastLondonCode(db, userId) {
  throw new Error('TODO');
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
