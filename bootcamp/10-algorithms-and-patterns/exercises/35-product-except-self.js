// ─────────────────────────────────────────────────────────────────────────
//  35 · productExceptSelf                                   ★★☆ core
//  concepts: pattern: prefix + suffix passes · no division
//  run: node 35-product-except-self.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Return an array where slot i holds the product of every OTHER value.
//  Division is banned — the array may contain zeros, and "total ÷ mine"
//  blows up on exactly the inputs interviewers hand you.
//
//      productExceptSelf([1, 2, 3, 4])  → [24, 12, 8, 6]
//      productExceptSelf([2, -3])       → [-3, 2]
//      productExceptSelf([1, 0, 3])     → [0, 3, 0]
//
//  Every answer is (everything to my LEFT) × (everything to my RIGHT).
//  Two passes gets you both halves.
//
//  hint: first pass fills the array with the running left product, second
//        pass walks backwards multiplying in a running right product

import { test, eq } from '../../_lib/check.js';

export function productExceptSelf(nums) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('multiplies everything except the current slot', () => {
  eq(productExceptSelf([1, 2, 3, 4]), [24, 12, 8, 6]);
});

test('handles negative values', () => {
  eq(productExceptSelf([2, -3]), [-3, 2]);
  eq(productExceptSelf([-1, 2, -3]), [-6, 3, -2]);
});

test('one zero makes every other slot zero', () => {
  eq(productExceptSelf([1, 0, 3]), [0, 3, 0]);
});

test('two zeros make every slot zero', () => {
  eq(productExceptSelf([0, 0, 5]), [0, 0, 0]);
});

test('a single value has nothing else to multiply', () => {
  eq(productExceptSelf([5]), [1]);
});

test('handles the empty array', () => {
  eq(productExceptSelf([]), []);
});

test('does not modify the input', () => {
  const nums = [1, 2, 3, 4];
  productExceptSelf(nums);
  eq(nums, [1, 2, 3, 4]);
});
