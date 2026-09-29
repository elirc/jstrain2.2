// ─────────────────────────────────────────────────────────────────────────
//  01 · the crash two files from home                            ★★☆ core
//  concepts: bug hunt · cross-file contracts · where a stack trace lies
//  run: node 01-shipping-quote.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A tiny shipping app, three files, in ./01-shipping-quote-app/:
//
//      rates.js   the zone price table  ·  cart.js   weight math
//      quote.js   the entry point: quoteCents(items, zone)
//
//  The spec: a quote is base + perKg × weight in integer cents, and an
//  unknown zone throws an Error whose message is 'unknown zone: <zone>'.
//  Instead, a typo'd zone crashes with
//
//      TypeError: Cannot read properties of undefined (reading 'baseCents')
//
//  …and the stack trace points at quote.js. On-call "fixed" it there once
//  already (a hasty fallback, since reverted). It came back.
//
//  Every file is short and looks reasonable. 2 tests fail. The bug is ONE
//  file breaking a promise another file relies on — read what each file
//  CLAIMS (its top comment) against what it DOES, and fix the liar with
//  the smallest change. Don't rewrite, and don't add checks to callers
//  that were promised they don't need them.
//
//  hint: the crash site is where undefined ARRIVED, not where it was
//  made. Walk one bad zone backwards: who produced the undefined, and
//  what did that file's own comment promise instead?

import { test, eq, throws } from '../../_lib/check.js';
import { quoteCents } from './01-shipping-quote-app/quote.js';
import { rateFor } from './01-shipping-quote-app/rates.js';

// ──────────────────────────── tests ──────────────────────────────────────

const CART = [
  { name: 'keyboard', grams: 900, qty: 1 },
  { name: 'mouse', grams: 100, qty: 1 },
];

test('a domestic quote is base + perKg × weight, in cents', () => {
  eq(quoteCents(CART, 'domestic'), 620); // 500 + 120 × 1kg
});

test('heavier carts and dearer zones price accordingly', () => {
  const heavy = [{ name: 'monitor', grams: 1500, qty: 1 }];
  eq(quoteCents(heavy, 'remote'), 3160); // 2200 + 640 × 1.5kg
});

test('an unknown zone fails loudly, naming the zone', () => {
  throws(() => quoteCents(CART, 'atlantis'), 'unknown zone: atlantis');
});

test('rates.js honors its own contract: unknown zones throw', () => {
  throws(() => rateFor('atlantis'), 'unknown zone');
});
