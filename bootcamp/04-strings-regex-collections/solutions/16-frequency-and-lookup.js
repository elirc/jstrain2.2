// ─────────────────────────────────────────────────────────────────────────
//  16 · frequency maps and two-way lookup — SOLUTION            ★★☆ core
//  run: node 16-frequency-and-lookup.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: (counts.get(item) ?? 0) + 1 is the get-or-default idiom —
//  ?? and not ||, because a stored 0 is falsy and || would restart the
//  count. Because a Map keeps insertion order, first-seen order comes out
//  of the loop for free.
//  mostCommon then scans the Map once with a strict > comparison: an
//  equal count never displaces the entry already held, so ties resolve to
//  whoever was seen first. Using >= silently flips that rule, which is
//  the wrong turn the tie test catches. An empty list never enters the
//  loop, so best stays undefined.
//  invert rebuilds the Map with each pair reversed — pair it with the
//  original and you have id → name and name → id lookups.

import { test, eq } from '../../_lib/check.js';

export function frequency(items) {
  const counts = new Map();
  for (const item of items) {
    counts.set(item, (counts.get(item) ?? 0) + 1);
  }
  return counts;
}

export function mostCommon(items) {
  let best;
  let bestCount = 0;
  for (const [item, count] of frequency(items)) {
    if (count > bestCount) {
      best = item;
      bestCount = count;
    }
  }
  return best;
}

export function invert(map) {
  return new Map([...map].map(([key, value]) => [value, key]));
}

// ──────────────────────────── tests ──────────────────────────────────────

test('frequency counts repeats', () => {
  eq(frequency(['a', 'b', 'a']), new Map([['a', 2], ['b', 1]]));
});

test('frequency returns a Map you can query', () => {
  eq(frequency(['x', 'x', 'x']).get('x'), 3);
});

test('frequency of an empty list is an empty Map', () => {
  eq(frequency([]).size, 0);
});

test('frequency keeps first-seen order', () => {
  eq([...frequency(['b', 'a', 'b']).keys()], ['b', 'a']);
});

test('frequency counts numbers and strings separately', () => {
  const f = frequency([1, '1', 1]);
  eq(f.get(1), 2);
  eq(f.get('1'), 1);
});

test('mostCommon returns the item with the highest count', () => {
  eq(mostCommon(['b', 'a', 'a']), 'a');
});

test('mostCommon breaks a tie in favour of the first seen', () => {
  eq(mostCommon(['b', 'a', 'a', 'b']), 'b');
  eq(mostCommon([]), undefined);
});

test('invert swaps keys and values', () => {
  eq(invert(new Map([['ada', 1], ['bob', 2]])), new Map([[1, 'ada'], [2, 'bob']]));
});
