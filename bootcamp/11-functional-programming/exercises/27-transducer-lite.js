// ─────────────────────────────────────────────────────────────────────────
//  27 · transducers, the small version                       ★★★ stretch
//  concepts: composition · reduce · single-pass pipelines
//  run: node 27-transducer-lite.js
// ─────────────────────────────────────────────────────────────────────────
//
//  `items.map(f).filter(p).map(g)` walks the list three times and builds
//  two arrays nobody wanted. A transducer composes the STEPS instead of the
//  collections, so the whole pipeline runs in one reduce, allocating
//  nothing in between — and it does not care whether the result is an
//  array, a sum or a string.
//
//      a step        (acc, item) => acc          — a reduce callback
//      a transducer  (step) => step              — wraps one step in another
//
//      mapping(fn)         → a transducer that transforms each item
//      filtering(pred)     → a transducer that skips items
//      composeT(...xfs)    → one transducer, reading LEFT TO RIGHT:
//                            composeT(mapping(double), filtering(isBig))
//                            means "double, then keep the big ones"
//      transduce(xf, step, seed, items) → the single reduce
//
//      transduce(
//        composeT(mapping((n) => n * 2), filtering((n) => n > 4)),
//        (acc, n) => acc + n, 0, [1, 2, 3])          → 6
//
//  To skip an item, a filtering step returns the accumulator it was given,
//  untouched — that is what "not adding anything" looks like.
//
//  hint: each transducer wraps the step that comes AFTER it, so building
//  the chain left-to-right means folding the list from the RIGHT.

import { test, eq, spy } from '../../_lib/check.js';

// ── given: two steps to reduce with ──────────────────────────────────────

const collect = (acc, item) => acc.concat([item]);
const sum = (acc, item) => acc + item;

const numbers = Object.freeze([1, 2, 3, 4, 5]);

export function mapping(fn) {
  throw new Error('TODO');
}

export function filtering(pred) {
  throw new Error('TODO');
}

export function composeT(...xfs) {
  throw new Error('TODO');
}

export function transduce(xf, step, seed, items) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('mapping alone behaves like map', () => {
  eq(transduce(mapping((n) => n * 2), collect, [], numbers),
    [2, 4, 6, 8, 10]);
});

test('filtering alone behaves like filter', () => {
  eq(transduce(filtering((n) => n % 2 === 1), collect, [], numbers),
    [1, 3, 5]);
});

test('composeT reads left to right, like a pipe', () => {
  const xf = composeT(
    mapping((n) => n * 2),
    filtering((n) => n > 4)
  );
  eq(transduce(xf, collect, [], numbers), [6, 8, 10]);
});

test('order matters — the same two steps, flipped', () => {
  const mapFirst = composeT(mapping((n) => n * 10), filtering((n) => n > 20));
  const filterFirst = composeT(filtering((n) => n > 20), mapping((n) => n * 10));
  eq(transduce(mapFirst, collect, [], numbers), [30, 40, 50]);
  eq(transduce(filterFirst, collect, [], numbers), []);
});

test('the whole pipeline runs in ONE pass over the items', () => {
  const trace = [];
  const xf = composeT(
    mapping((n) => {
      trace.push(`map ${n}`);
      return n * 2;
    }),
    filtering((n) => {
      trace.push(`filter ${n}`);
      return n > 4;
    })
  );
  transduce(xf, collect, [], [1, 2, 3]);
  eq(trace, ['map 1', 'filter 2', 'map 2', 'filter 4', 'map 3', 'filter 6']);
});

test('each function is called exactly once per item', () => {
  const double = spy((n) => n * 2);
  const big = spy((n) => n > 4);
  transduce(composeT(mapping(double), filtering(big)), collect, [], numbers);
  eq(double.callCount, 5);
  eq(big.callCount, 5);
});

test('a dropped item never reaches the step', () => {
  const step = spy(collect);
  transduce(filtering((n) => n === 3), step, [], numbers);
  eq(step.callCount, 1, 'four items were skipped');
});

test('the result does not have to be an array', () => {
  const xf = composeT(filtering((n) => n % 2 === 1), mapping((n) => n * 100));
  eq(transduce(xf, sum, 0, numbers), 900);
  eq(transduce(composeT(), collect, [], numbers), [1, 2, 3, 4, 5]);
});
