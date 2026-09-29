// ─────────────────────────────────────────────────────────────────────────
//  25 · permutations                                       ★★★ stretch
//  concepts: recursive generators · combinatorial explosion, unfelt
//  run: node 25-permutations.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Ten items have 3,628,800 arrangements. An array of those costs a
//  second and a few hundred megabytes; a generator costs one array at a
//  time, so "give me the first three" is instant no matter how big the
//  input is. That is the whole reason this is a generator.
//
//      [...permutations([1, 2, 3])]
//          → [1,2,3], [1,3,2], [2,1,3], [2,3,1], [3,1,2], [3,2,1]
//      [...permutations(['a'])]   → [['a']]
//      [...permutations([])]      → [[]]      one arrangement of nothing
//
//  Order: fix each element as the head in turn, in source order. Take
//  any iterable, yield fresh arrays (nobody may hand out a buffer it
//  keeps editing), and never build the full set.
//
//  hint: the head is items[i]; what is left is the rest of the list
//        with items[i] removed — and permutations of THAT is a problem
//        you have already solved

import { test, eq, ok } from '../../_lib/check.js';

// scaffolding: take() from earlier plus a source that counts how many
// values a consumer pulled through it. Do not edit.
function* take(n, iterable) {
  if (n <= 0) return;
  let taken = 0;
  for (const value of iterable) {
    yield value;
    taken += 1;
    if (taken >= n) return;
  }
}

function counted(iterable) {
  const log = { pulls: 0 };
  const wrapped = {
    [Symbol.iterator]() {
      const inner = iterable[Symbol.iterator]();
      return {
        next() {
          log.pulls += 1;
          return inner.next();
        },
      };
    },
  };
  return { iterable: wrapped, log };
}

const TEN = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export function* permutations(items) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('three items give six arrangements, head by head', () => {
  eq(
    [...permutations([1, 2, 3])],
    [
      [1, 2, 3],
      [1, 3, 2],
      [2, 1, 3],
      [2, 3, 1],
      [3, 1, 2],
      [3, 2, 1],
    ]
  );
});

test('one item, and no items at all', () => {
  eq([...permutations(['a'])], [['a']]);
  eq([...permutations([])], [[]]);
});

test('four items give 24 distinct arrangements', () => {
  const all = [...permutations([1, 2, 3, 4])];
  eq(all.length, 24);
  eq(new Set(all.map((p) => p.join(''))).size, 24, 'no repeats allowed');
});

test('it accepts any iterable, not just an array', () => {
  eq(
    [...permutations(new Set(['a', 'b']))],
    [
      ['a', 'b'],
      ['b', 'a'],
    ]
  );
});

test('each arrangement is a fresh array you may keep', () => {
  const g = permutations([1, 2, 3]);
  const first = g.next().value;
  first[0] = 99;
  eq(g.next().value, [1, 3, 2], 'a shared buffer would come back edited');
  eq(first, [99, 2, 3]);
});

test('taking three of 3.6 million arrangements is instant', () => {
  const started = Date.now();
  const first = [...take(3, permutations(TEN))];
  eq(first[0], TEN);
  eq(first.length, 3);
  const ms = Date.now() - started;
  ok(ms < 250, `took ${ms}ms — nothing may be precomputed`);
});

test('a consumer that wants three pulls three', () => {
  const src = counted(permutations(TEN));
  eq([...take(3, src.iterable)].length, 3);
  ok(src.log.pulls <= 4, `pulled ${src.log.pulls} arrangements for 3`);
});
