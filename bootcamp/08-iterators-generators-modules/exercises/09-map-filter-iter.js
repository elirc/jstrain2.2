// ─────────────────────────────────────────────────────────────────────────
//  09 · mapIter · filterIter                                 ★★☆ core
//  concepts: lazy pipelines · generators over any iterable
//  run: node 09-map-filter-iter.js
// ─────────────────────────────────────────────────────────────────────────
//
//  `[1,2,3].map(f)` builds a whole new array before you read the first
//  element, and it only exists on arrays. Build the lazy versions:
//  they take ANY iterable, hand back an iterable, and do the work one
//  pull at a time.
//
//      [...mapIter([1, 2, 3], (n) => n * 2)]        → [2, 4, 6]
//      [...mapIter('ab', (c, i) => c + i)]          → ['a0', 'b1']
//      [...filterIter([1, 2, 3, 4], (n) => n % 2)]  → [1, 3]
//
//  Both callbacks get (value, index) — the index counts values coming
//  IN, so filterIter's index does not skip.
//
//  Because they are lazy they compose over an endless source:
//
//      take(3, mapIter(filterIter(naturals(), even), times10))
//          → [20, 40, 60]
//
//  hint: one for-of, one yield — nothing is allowed to be collected
//        into an array first

import { test, eq, ok, spy } from '../../_lib/check.js';

// scaffolding: helpers from earlier exercises plus a source that
// counts how many values were pulled out of it. Do not edit.
function* take(n, iterable) {
  if (n <= 0) return;
  let taken = 0;
  for (const value of iterable) {
    yield value;
    taken += 1;
    if (taken >= n) return;
  }
}

function* naturals() {
  let n = 1;
  while (true) {
    yield n;
    n += 1;
  }
}

function counted(values) {
  const log = { pulls: 0 };
  const iterable = {
    [Symbol.iterator]() {
      const inner = values[Symbol.iterator]();
      return {
        next() {
          log.pulls += 1;
          return inner.next();
        },
      };
    },
  };
  return { iterable, log };
}

export function* mapIter(iterable, fn) {
  throw new Error('TODO');
}

export function* filterIter(iterable, predicate) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('mapIter transforms every value', () => {
  eq([...mapIter([1, 2, 3], (n) => n * 2)], [2, 4, 6]);
});

test('mapIter hands the callback the index as well', () => {
  eq([...mapIter('ab', (c, i) => c + i)], ['a0', 'b1']);
});

test('mapIter returns a lazy iterable, not an array', () => {
  const m = mapIter(new Set([1, 2]), (n) => n);
  ok(!Array.isArray(m), 'mapIter should not build an array');
  eq([...m], [1, 2]);
});

test('filterIter keeps only the matching values', () => {
  eq([...filterIter([1, 2, 3, 4], (n) => n % 2 === 1)], [1, 3]);
  eq([...filterIter([1, 2], () => false)], []);
});

test('filterIter indexes the values going in, not the ones kept', () => {
  eq([...filterIter('abcd', (c, i) => i % 2 === 0)], ['a', 'c']);
});

test('both handle an empty source', () => {
  eq([...mapIter([], (n) => n)], []);
  eq([...filterIter('', () => true)], []);
});

test('mapIter is lazy — it only maps what is consumed', () => {
  const src = counted([1, 2, 3, 4, 5]);
  const double = spy((n) => n * 2);
  eq([...take(2, mapIter(src.iterable, double))], [2, 4]);
  ok(src.log.pulls <= 3, `pulled ${src.log.pulls} values for 2 results`);
  ok(double.callCount <= 3, `called fn ${double.callCount} times for 2`);
});

test('they compose over an endless source', () => {
  const evens = filterIter(naturals(), (n) => n % 2 === 0);
  eq([...take(3, mapIter(evens, (n) => n * 10))], [20, 40, 60]);
});
