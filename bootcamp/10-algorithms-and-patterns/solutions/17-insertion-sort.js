// ─────────────────────────────────────────────────────────────────────────
//  17 · insertionSort — SOLUTION                            ★★☆ core
//  concepts: pattern: sorting from scratch · shift-and-insert · stability
//  run: node 17-insertion-sort.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough — PATTERN: incremental sorting. Keep the prefix
//  items[0..i-1] sorted; take items[i], shift every bigger neighbour one
//  slot to the right, drop the held value into the hole it leaves.
//  Time O(n²) worst case, O(n) on already-sorted input (the inner loop
//  never runs) — that "adaptive" behaviour is why real engines use
//  insertion sort for short or nearly-sorted runs inside Timsort.
//  Space O(1), and it is STABLE because the shift condition is
//  `compare(...) > 0`: a tie stops the shift, so equal items never cross.
//  Change it to `>= 0` and stability dies — that is the classic wrong
//  turn, and the reason the ties test is here.
//  Against the other naive sorts: selection sort does the same O(n²)
//  work but never gets faster on sorted input and its long-range swaps
//  destroy stability; bubble sort is the same idea with more passes.
//  Against O(n log n) sorts, insertion only wins on small or nearly
//  sorted arrays — which is precisely where Timsort uses it.
//  When would you hand-roll this instead of `.sort()`? Almost never for
//  production JS — `.sort()` is Timsort in V8, stable, and written in
//  C++. You hand-roll it to demonstrate you understand the mechanics, or
//  when you need the sort to be incremental/online (data arriving one
//  item at a time keeps the array sorted at O(n) per insert).

import { test, eq, ok } from '../../_lib/check.js';

export function insertionSort(items, compare = (a, b) => a - b) {
  for (let i = 1; i < items.length; i += 1) {
    const held = items[i];
    let j = i - 1;
    while (j >= 0 && compare(items[j], held) > 0) {
      items[j + 1] = items[j];
      j -= 1;
    }
    items[j + 1] = held;
  }
  return items;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('sorts numbers ascending by default', () => {
  eq(insertionSort([5, 2, 4, 6, 1, 3]), [1, 2, 3, 4, 5, 6]);
});

test('handles empty and single-element arrays', () => {
  eq(insertionSort([]), []);
  eq(insertionSort([7]), [7]);
});

test('leaves an already sorted array alone', () => {
  eq(insertionSort([1, 2, 3]), [1, 2, 3]);
});

test('handles a reversed array and duplicates', () => {
  eq(insertionSort([3, 2, 1]), [1, 2, 3]);
  eq(insertionSort([2, 1, 2, 1]), [1, 1, 2, 2]);
});

test('honours a custom comparator', () => {
  eq(insertionSort([1, 3, 2], (a, b) => b - a), [3, 2, 1]);
});

test('is stable: ties keep their original order', () => {
  const rows = [
    { name: 'a', rank: 2 },
    { name: 'b', rank: 1 },
    { name: 'c', rank: 2 },
    { name: 'd', rank: 1 },
  ];
  const sorted = insertionSort(rows, (x, y) => x.rank - y.rank);
  eq(sorted.map((r) => r.name), ['b', 'd', 'a', 'c']);
});

test('sorts in place and returns the same array', () => {
  const nums = [3, 1, 2];
  ok(insertionSort(nums) === nums, 'should return the same array reference');
  eq(nums, [1, 2, 3]);
});
