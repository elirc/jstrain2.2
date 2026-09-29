// ─────────────────────────────────────────────────────────────────────────
//  01 · the crash two files from home — SOLUTION                 ★★☆ core
//  concepts: bug hunt · cross-file contracts · where a stack trace lies
//  run: node 01-shipping-quote.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  Bug class: a broken cross-file contract. rates.js opens with "rateFor
//  THROWS on a zone we don't ship to — callers rely on that", and then
//  its body does `return TABLE[zone]`, which hands back `undefined` for
//  a miss. quote.js kept its side of the deal (no re-checking) and paid
//  for it two lines later with a TypeError.
//  The tell: the stack trace names quote.js, but quote.js only READS the
//  bad value. In a multi-file hunt the crash site tells you which VALUE
//  went wrong, not which file did — walk that value to where it was
//  produced, and compare each file's top-comment promise with its body.
//  The one that differs is your bug, whatever the trace says.
//  The minimal fix (in rates.js — the file that lied):
//      const rate = TABLE[zone];
//      if (rate === undefined) throw new Error(`unknown zone: ${zone}`);
//  Fixing it in quote.js instead (a fallback, a re-check) leaves the lie
//  in place for the NEXT caller of rateFor — that was on-call's hasty
//  patch, and it's why the bug came back.
//  In the wild: "this function never returns null" comments aging out of
//  truth, and every fix that got applied where the stack pointed instead
//  of where the promise broke.

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
