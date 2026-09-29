// ─────────────────────────────────────────────────────────────────────────
//  39 · trace a pipeline — SOLUTION                        ★☆☆ warm-up
//  run: node 39-tap-and-trace.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `trace` is the factory version of `tap` — configure the
//  label once, drop the resulting function into a pipeline as often as you
//  like. The rule that makes it safe is that it returns the ORIGINAL value:
//  `(value) => { log(label, value); return value; }`. Write it as
//  `(value) => log(label, value)` with an arrow shorthand and the pipeline
//  silently starts carrying whatever the logger returned.
//  `tracePipe` is a reduce that logs after each step, so the index in the
//  log tells you exactly which step produced which value. Injecting the
//  logger keeps the helper testable and swappable: a spy in tests,
//  `console.log` at a debugging session, a structured logger in production.

import { test, eq, ok, spy } from '../../_lib/check.js';

export function trace(label, log) {
  return (value) => {
    log(label, value);
    return value;
  };
}

export function tracePipe(log, ...steps) {
  return (value) =>
    steps.reduce((current, step, i) => {
      const next = step(current);
      log(i, next);
      return next;
    }, value);
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
