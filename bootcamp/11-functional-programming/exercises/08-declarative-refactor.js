// ─────────────────────────────────────────────────────────────────────────
//  08 · imperative → declarative                            ★★☆ core
//  concepts: map/filter/reduce · method chains
//  run: node 08-declarative-refactor.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Three loops from a real codebase, described in words. Implement each as
//  a CHAIN — filter/map/reduce — with no `for`, no `let`, no accumulator
//  variable. The behaviour is identical; the point is that the chain names
//  each stage of the work.
//
//    sumOfSquaresOfEvens([1, 2, 3, 4])   → 20        (4 + 16)
//    longestActiveName(users)            → the longest `name` among users
//                                          with active: true; first one
//                                          wins a tie; null if nobody is
//    receiptLines(items)                 → one string per line, skipping
//                                          any qty of 0:
//        `${qty} x ${name}` padded to 20 with '.' then the line total
//        fixed to 2 decimals:  '2 x Mug.............25.00'
//
//  hint: reduce takes a starting value — and it can carry null.

import { test, eq } from '../../_lib/check.js';

const users = Object.freeze([
  { name: 'Bo', active: true },
  { name: 'Alexandra', active: false },
  { name: 'Grace', active: true },
  { name: 'Ada', active: true },
]);

const items = Object.freeze([
  { name: 'Mug', qty: 2, price: 12.5 },
  { name: 'Pen', qty: 0, price: 1.25 },
  { name: 'Ink', qty: 1, price: 3 },
]);

export function sumOfSquaresOfEvens(numbers) {
  throw new Error('TODO');
}

export function longestActiveName(users) {
  throw new Error('TODO');
}

export function receiptLines(items) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('sums the squares of the even numbers', () => {
  eq(sumOfSquaresOfEvens([1, 2, 3, 4]), 20);
});

test('returns 0 when nothing is even', () => {
  eq(sumOfSquaresOfEvens([1, 3, 5]), 0);
  eq(sumOfSquaresOfEvens([]), 0);
});

test('counts negative even numbers too', () => {
  eq(sumOfSquaresOfEvens([-2, 7]), 4);
});

test('finds the longest name among active users', () => {
  eq(longestActiveName(users), 'Grace');
});

test('the first of two equally long names wins', () => {
  eq(
    longestActiveName([
      { name: 'Bo', active: true },
      { name: 'Al', active: true },
    ]),
    'Bo'
  );
});

test('returns null when nobody is active', () => {
  eq(longestActiveName([{ name: 'Alexandra', active: false }]), null);
  eq(longestActiveName([]), null);
});

test('formats one padded line per item', () => {
  eq(receiptLines(items), [
    '2 x Mug.............25.00',
    '1 x Ink.............3.00',
  ]);
});

test('skips lines with a quantity of 0', () => {
  eq(receiptLines(items).length, 2);
  eq(receiptLines([{ name: 'Pen', qty: 0, price: 1.25 }]), []);
});
