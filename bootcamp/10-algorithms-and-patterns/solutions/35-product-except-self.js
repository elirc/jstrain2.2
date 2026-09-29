// ─────────────────────────────────────────────────────────────────────────
//  35 · productExceptSelf — SOLUTION                        ★★☆ core
//  concepts: pattern: prefix + suffix passes · no division
//  run: node 35-product-except-self.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough — PATTERN: prefix and suffix accumulation (prefix sums,
//  but with × instead of +).
//  Smell: "for each element, combine everything except itself" — that is
//  always a left pass and a right pass.
//  Pass 1 walks forward writing the product of everything strictly to the
//  left into out[i]. Pass 2 walks backward carrying a running product of
//  everything to the right and multiplies it in. The output array doubles
//  as the scratch space, so no second buffer is needed.
//  Time O(n), space O(1) beyond the output. The naive version is a nested
//  loop, O(n²).
//  Why not division: total / nums[i] is O(n) and elegant right up until a
//  zero appears — one zero forces a special case, two zeros force another,
//  and floats drift on large products. The two-pass version never cares.

import { test, eq } from '../../_lib/check.js';

export function productExceptSelf(nums) {
  const out = new Array(nums.length);
  let left = 1;
  for (let i = 0; i < nums.length; i += 1) {
    out[i] = left; // everything before i
    left *= nums[i];
  }
  let right = 1;
  for (let i = nums.length - 1; i >= 0; i -= 1) {
    out[i] *= right; // ...times everything after i
    right *= nums[i];
  }
  return out;
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
