// ─────────────────────────────────────────────────────────────────────────
//  23 · chain — SOLUTION                                       ★★☆ core
//  run: node 23-chain-pipeline.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the wrapper holds one thing — an iterable — and every
//  intermediate method wraps it in another generator and re-wraps that.
//  No work happens, because building a generator runs no code. The
//  chain is a plan; toArray() and forEach() are the only steps that
//  execute it.
//
//  That split is the whole design of the ES iterator-helpers proposal
//  (Iterator.prototype.map/filter/take/drop + .toArray()/.forEach()),
//  which Node 22 already ships — you have just rebuilt its skeleton.
//  Rebuilding it is how you learn the rule that matters: intermediate
//  steps are free, terminals cost.
//
//  Delegating [Symbol.iterator] to the wrapped iterable is what makes
//  a chain spreadable and for-of-able — and it also explains the last
//  test. An array can hand out a fresh iterator every time; a generator
//  object hands out ITSELF, so once drained the chain is spent. If you
//  want a reusable pipeline, store a factory (`() => mapI(...)`) rather
//  than the generator object.

import { test, eq, ok, spy } from '../../_lib/check.js';

// scaffolding: the lazy helpers from exercises 09 and 22, plus a
// counting source. Do not edit.
function* mapI(iterable, fn) {
  for (const value of iterable) yield fn(value);
}

function* filterI(iterable, predicate) {
  for (const value of iterable) if (predicate(value)) yield value;
}

function* takeI(n, iterable) {
  if (n <= 0) return;
  let taken = 0;
  for (const value of iterable) {
    yield value;
    taken += 1;
    if (taken >= n) return;
  }
}

function* dropI(n, iterable) {
  let dropped = 0;
  for (const value of iterable) {
    if (dropped < n) {
      dropped += 1;
      continue;
    }
    yield value;
  }
}

function* concatI(...iterables) {
  for (const iterable of iterables) yield* iterable;
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

export function chain(iterable) {
  return {
    [Symbol.iterator]: () => iterable[Symbol.iterator](),
    map: (fn) => chain(mapI(iterable, fn)),
    filter: (predicate) => chain(filterI(iterable, predicate)),
    take: (n) => chain(takeI(n, iterable)),
    drop: (n) => chain(dropI(n, iterable)),
    concat: (other) => chain(concatI(iterable, other)),
    toArray: () => [...iterable],
    forEach: (fn) => {
      for (const value of iterable) fn(value);
    },
  };
}

// ──────────────────────────── tests ──────────────────────────────────────

test('a chain is iterable and round-trips its source', () => {
  eq([...chain([1, 2, 3])], [1, 2, 3]);
  eq(chain('ab').toArray(), ['a', 'b']);
});

test('map and filter compose left to right', () => {
  const out = chain([1, 2, 3, 4])
    .map((n) => n * 10)
    .filter((n) => n > 15)
    .toArray();
  eq(out, [20, 30, 40]);
});

test('drop then take makes an endless source finite', () => {
  eq(chain(naturals()).drop(2).take(3).toArray(), [3, 4, 5]);
});

test('concat appends any other iterable', () => {
  eq(chain('ab').concat(new Set(['c'])).toArray(), ['a', 'b', 'c']);
});

test('forEach walks the pipeline for its side effects', () => {
  const seen = spy();
  chain([1, 2, 3])
    .filter((n) => n % 2 === 1)
    .forEach(seen);
  eq(seen.calls, [[1], [3]]);
});

test('building a chain pulls nothing at all', () => {
  const src = counted([1, 2, 3]);
  chain(src.iterable)
    .map((n) => n * 2)
    .take(2);
  eq(src.log.pulls, 0, 'no value may be pulled before a terminal call');
});

test('a terminal pulls only what it needs', () => {
  const src = counted([1, 2, 3, 4, 5]);
  const double = spy((n) => n * 2);
  eq(chain(src.iterable).map(double).take(2).toArray(), [2, 4]);
  ok(src.log.pulls <= 3, `pulled ${src.log.pulls} values for 2 results`);
  ok(double.callCount <= 3, `mapped ${double.callCount} values for 2`);
});

test('a chain over an array can be read twice; a mapped one cannot', () => {
  const overArray = chain([1, 2]);
  eq(overArray.toArray(), [1, 2]);
  eq(overArray.toArray(), [1, 2]);
  const mapped = overArray.map((n) => n * 2);
  eq(mapped.toArray(), [2, 4]);
  eq(mapped.toArray(), [], 'a generator step drains — that chain is spent');
});
