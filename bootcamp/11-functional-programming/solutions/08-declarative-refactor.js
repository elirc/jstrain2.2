// ─────────────────────────────────────────────────────────────────────────
//  08 · imperative → declarative — SOLUTION                 ★★☆ core
//  run: node 08-declarative-refactor.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: same behaviour, two shapes. The loop version of the first
//  one, for comparison:
//
//      let total = 0;                     |  numbers
//      for (const n of numbers) {         |    .filter((n) => n % 2 === 0)
//        if (n % 2 === 0) {               |    .map((n) => n * n)
//          total += n * n;                |    .reduce((a, b) => a + b, 0);
//        }                                |
//      }                                  |
//      return total;                      |
//
//  The chain reads as three nouns — the evens, their squares, their sum —
//  and there is no mutable `total` to get wrong. The trade is one extra
//  array per stage; that only matters at sizes you will feel, and you can
//  always collapse it back into a single reduce when a profiler says so.
//  longestActiveName shows reduce carrying `null` as its seed, which is
//  how you express "nothing yet" without a sentinel like -Infinity.

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
  return numbers
    .filter((n) => n % 2 === 0)
    .map((n) => n * n)
    .reduce((sum, n) => sum + n, 0);
}

export function longestActiveName(users) {
  return users
    .filter((user) => user.active)
    .map((user) => user.name)
    .reduce(
      (longest, name) =>
        longest === null || name.length > longest.length ? name : longest,
      null
    );
}

export function receiptLines(items) {
  return items
    .filter((item) => item.qty > 0)
    .map(
      (item) =>
        `${item.qty} x ${item.name}`.padEnd(20, '.') +
        (item.qty * item.price).toFixed(2)
    );
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
