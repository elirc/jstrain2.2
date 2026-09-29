// ─────────────────────────────────────────────────────────────────────────
//  26 · rewriting with named backreferences                  ★☆☆ warm-up
//  concepts: named groups · $<name> in the replacement string
//  run: node 26-named-group-rewrite.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Exercise 11 read named groups out of a match. The other half of the
//  feature is that the replacement STRING can name them too: $<year>
//  drops in whatever (?<year>...) captured. No callback needed.
//
//      toUsDate('due 2026-08-20')  → 'due 08/20/2026'
//      toUsDate('2026-01-05 to 2026-01-09')
//                                  → '01/05/2026 to 01/09/2026'
//      toUsDate('call 555-1234')   → 'call 555-1234'   (not a date)
//
//      swapNames('Lovelace, Ada')  → 'Ada Lovelace'
//      swapNames('Hopper, Grace; Lovelace, Ada')
//                                  → 'Grace Hopper; Ada Lovelace'
//      swapNames('Ada Lovelace')   → 'Ada Lovelace'    (no comma)
//
//  Both rewrite EVERY occurrence, so both need the /g flag. A name is one
//  or more letters on each side of ', '.

import { test, eq } from '../../_lib/check.js';

export function toUsDate(text) {
  throw new Error('TODO');
}

export function swapNames(text) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('rewrites one ISO date into US order', () => {
  eq(toUsDate('due 2026-08-20'), 'due 08/20/2026');
});

test('rewrites every date in the string', () => {
  eq(toUsDate('2026-01-05 to 2026-01-09'), '01/05/2026 to 01/09/2026');
});

test('keeps the padding that was already there', () => {
  eq(toUsDate('1999-12-31'), '12/31/1999');
});

test('leaves text that is not an ISO date alone', () => {
  eq(toUsDate('call 555-1234'), 'call 555-1234');
  eq(toUsDate('no dates here'), 'no dates here');
});

test('swapNames puts the first name first', () => {
  eq(swapNames('Lovelace, Ada'), 'Ada Lovelace');
});

test('swapNames rewrites a whole list', () => {
  eq(
    swapNames('Hopper, Grace; Lovelace, Ada'),
    'Grace Hopper; Ada Lovelace'
  );
});

test('swapNames leaves a name with no comma alone', () => {
  eq(swapNames('Ada Lovelace'), 'Ada Lovelace');
});
