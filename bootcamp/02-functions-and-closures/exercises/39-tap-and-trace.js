// ─────────────────────────────────────────────────────────────────────────
//  39 · trace a pipeline                                   ★☆☆ warm-up
//  concepts: side effects · pipelines · debugging
//  run: node 39-tap-and-trace.js
// ─────────────────────────────────────────────────────────────────────────
//
//  When a `pipe` gives you the wrong answer you need to see the value
//  between the steps — without changing what the steps produce. That is a
//  pass-through with a side effect.
//
//      const seen = [];
//      const log = (label, value) => seen.push([label, value]);
//
//      trace('before', log)(3)   → 3          and logs ['before', 3]
//      [1, 2].map(trace('n', log))  → [1, 2]  and logs each item
//
//  `tracePipe(log, ...steps)` runs the steps left to right and logs the
//  value AFTER each one, with that step's index:
//
//      tracePipe(log, inc, dbl)(3)   → 8   logs [0, 4] then [1, 8]
//
//  The logger is a parameter, not `console.log`, so the tests can read it —
//  and so the same helper works with a real logger in production.

import { test, eq, ok, spy } from '../../_lib/check.js';

export function trace(label, log) {
  throw new Error('TODO');
}

export function tracePipe(log, ...steps) {
  throw new Error('TODO');
}

// ── given: two tiny steps ──
const inc = (n) => n + 1;
const dbl = (n) => n * 2;

// ──────────────────────────── tests ──────────────────────────────────────

test('trace hands the value straight back', () => {
  const log = spy();
  eq(trace('before', log)(3), 3);
  eq(trace('obj', log)('ada'), 'ada');
});

test('trace logs the label with the value, once per call', () => {
  const log = spy();
  const traced = trace('n', log);
  traced(1);
  traced(2);
  eq(log.calls, [
    ['n', 1],
    ['n', 2],
  ]);
});

test('trace can sit inside a map without changing the result', () => {
  const log = spy();
  eq([1, 2, 3].map(trace('n', log)), [1, 2, 3]);
  eq(log.callCount, 3);
});

test('trace only logs when the traced function actually runs', () => {
  const log = spy();
  eq([].map(trace('n', log)), []);
  eq(log.callCount, 0);
});

test('tracePipe threads the value through the steps', () => {
  const log = spy();
  eq(tracePipe(log, inc, dbl)(3), 8);
  eq(tracePipe(log, dbl, inc)(3), 7);
});

test('tracePipe logs every intermediate value with its step index', () => {
  const log = spy();
  tracePipe(log, inc, dbl)(3);
  eq(log.calls, [
    [0, 4],
    [1, 8],
  ]);
});

test('tracePipe with no steps returns the input and logs nothing', () => {
  const log = spy();
  eq(tracePipe(log)(42), 42);
  eq(log.callCount, 0);
  ok(typeof tracePipe(log, inc) === 'function');
});
