// ─────────────────────────────────────────────────────────────────────────
//  25 · permutations — SOLUTION                             ★★★ stretch
//  run: node 25-permutations.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the recursion is the textbook one — take each element
//  as the head, recurse on what is left, stick the head in front of
//  everything that comes back. What makes it worth writing as a
//  generator is that the inner loop is `for (const perm of
//  permutations(rest))`, so the sub-generator is walked lazily too. At
//  any instant the machine holds ONE arrangement plus a chain of paused
//  frames as deep as the input is long.
//
//  `const list = [...items]` up front is the one eager step, and it is
//  unavoidable: you cannot arrange a sequence you have not finished
//  reading. Everything after that is on demand.
//
//  Two traps. First, yielding a mutable buffer: `[list[i], ...perm]`
//  builds a new array per arrangement, so a consumer can keep what it
//  is handed — the swap-in-place variants that pool one array are
//  faster and quietly wrong here. Second, `return` in the base case:
//  without it, a one-element list falls through into the loop below and
//  yields duplicates.

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
  const list = [...items];
  if (list.length <= 1) {
    yield list;
    return;
  }
  for (let i = 0; i < list.length; i += 1) {
    const rest = [...list.slice(0, i), ...list.slice(i + 1)];
    for (const perm of permutations(rest)) yield [list[i], ...perm];
  }
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
