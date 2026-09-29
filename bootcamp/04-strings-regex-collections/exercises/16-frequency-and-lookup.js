// ─────────────────────────────────────────────────────────────────────────
//  16 · frequency maps and two-way lookup                       ★★☆ core
//  concepts: Map · get-or-default · iteration · inverting
//  run: node 16-frequency-and-lookup.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Counting things is the most common Map job in the world.
//
//      frequency(['a', 'b', 'a'])       → Map { 'a' => 2, 'b' => 1 }
//      frequency([])                    → Map {}
//      mostCommon(['b', 'a', 'a'])      → 'a'
//      mostCommon(['b', 'a', 'a', 'b']) → 'b'   (tie → first seen wins)
//      mostCommon([])                   → undefined
//      invert(new Map([['a', 1]]))      → Map { 1 => 'a' }
//
//  frequency must keep first-seen order (Maps do this for free). invert
//  swaps every key and value — the two Maps together give you a two-way
//  lookup: id → name and name → id.
//
//  hint: (map.get(k) ?? 0) + 1 is the whole counting trick. For the tie
//  rule, ask yourself whether > or >= keeps the earlier entry.

import { test, eq } from '../../_lib/check.js';

export function frequency(items) {
  throw new Error('TODO');
}

export function mostCommon(items) {
  throw new Error('TODO');
}

export function invert(map) {
  throw new Error('TODO');
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
