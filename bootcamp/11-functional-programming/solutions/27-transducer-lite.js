// ─────────────────────────────────────────────────────────────────────────
//  27 · transducers, the small version — SOLUTION            ★★★ stretch
//  run: node 27-transducer-lite.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: a transducer never touches a collection. `mapping(fn)`
//  takes the step you were going to use and hands back a step that calls
//  fn first; `filtering(pred)` hands back one that either delegates or
//  returns the accumulator unchanged. Because the wrapped step is just
//  another step, they stack — and the stack is still a single
//  (acc, item) => acc that you hand to one `reduce`. That is why the trace
//  test sees map/filter/map/filter interleaved: each item is pushed all
//  the way through the pipeline before the next one is looked at, and no
//  intermediate array is ever built.
//  `composeT` uses reduceRight because a transducer wraps the step AFTER
//  it: to make the leftmost one run first, it has to end up outermost, so
//  you build from the right. Get this backwards and everything still runs
//  — it just silently filters before it maps.
//  `transduce` is then anticlimactic, which is the point: one reduce.
//  Classic wrong turn: writing `filtering` as
//  `pred(item) ? step(acc, item) : step(acc)` — dropping an item means
//  NOT calling the step at all, not calling it with a missing argument.

import { test, eq, spy } from '../../_lib/check.js';

// ── given: two steps to reduce with ──────────────────────────────────────

const collect = (acc, item) => acc.concat([item]);
const sum = (acc, item) => acc + item;

const numbers = Object.freeze([1, 2, 3, 4, 5]);

export function mapping(fn) {
  return (step) => (acc, item) => step(acc, fn(item));
}

export function filtering(pred) {
  return (step) => (acc, item) => (pred(item) ? step(acc, item) : acc);
}

export function composeT(...xfs) {
  return (step) => xfs.reduceRight((next, xf) => xf(next), step);
}

export function transduce(xf, step, seed, items) {
  return items.reduce(xf(step), seed);
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
