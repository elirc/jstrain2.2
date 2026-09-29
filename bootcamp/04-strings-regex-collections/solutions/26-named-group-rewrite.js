// ─────────────────────────────────────────────────────────────────────────
//  26 · rewriting with named backreferences — SOLUTION       ★☆☆ warm-up
//  run: node 26-named-group-rewrite.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: $<name> in the replacement string is the mirror of
//  (?<name>...) in the pattern — same names, no callback, no m.groups.
//  Reach for a replacer function only when the new text needs computing;
//  reordering captured text is a job the string form already does.
//  Two things to keep straight: the $<...> syntax only works when the
//  pattern actually has named groups (otherwise it is copied literally),
//  and template literals are the wrong tool here — write the replacement
//  as a plain '...' string, because `${...}` would be interpolated by
//  JavaScript before replace ever sees it.
//  Both patterns carry /g. Without it, only the first date and the first
//  name in the string would change — the quiet bug the list tests catch.

import { test, eq } from '../../_lib/check.js';

const ISO_DATE = /(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/g;
const LAST_FIRST = /(?<last>[A-Za-z]+), (?<first>[A-Za-z]+)/g;

export function toUsDate(text) {
  return text.replace(ISO_DATE, '$<month>/$<day>/$<year>');
}

export function swapNames(text) {
  return text.replace(LAST_FIRST, '$<first> $<last>');
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
