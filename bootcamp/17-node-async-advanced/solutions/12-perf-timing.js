// ─────────────────────────────────────────────────────────────────────────
//  12 · measuring with perf_hooks — SOLUTION                ★☆☆ warm-up
//  run: node 12-perf-timing.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `await fn()` is the load-bearing word in timeIt. Calling
//  a function that returns a promise and stopping the clock immediately
//  measures how long it took to START the work — usually a fraction of a
//  millisecond — and that is the classic way benchmarks end up claiming
//  an HTTP call takes 0.2 ms. Awaiting a non-promise is free, so one code
//  path covers sync and async functions both.
//  mark/measure is the same stopwatch with names attached. The marks are
//  the pins, the measure is the span between two of them, and
//  getEntriesByName reads it back — the same PerformanceEntry data a
//  PerformanceObserver would receive, so this is how you hand timings to
//  a profiler instead of to console.log.
//  Note that performance.now() is milliseconds since this process
//  started, as a float. It is monotonic: unlike Date.now() it cannot go
//  backwards when the system clock is corrected, which is exactly why
//  you never measure durations with Date.

import { test, eq, ok, rejects, sleep } from '../../_lib/check.js';
import { performance } from 'node:perf_hooks';

export async function timeIt(fn) {
  const started = performance.now();
  const result = await fn(); // await, or you time the call and not the work
  return { result, ms: performance.now() - started };
}

export function measureSpan(name, fn) {
  performance.mark(`${name}:start`);
  try {
    return fn();
  } finally {
    performance.mark(`${name}:end`);
    performance.measure(name, `${name}:start`, `${name}:end`);
  }
}

export function durationOf(name) {
  const [entry] = performance.getEntriesByName(name, 'measure');
  return entry ? entry.duration : undefined;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('hands back whatever the function returned', async () => {
  const timed = await timeIt(() => 1 + 1);
  eq(timed.result, 2);
  eq(Object.keys(timed).sort(), ['ms', 'result']);
});

test('awaits async functions before stopping the clock', async () => {
  const { result } = await timeIt(async () => 'done');
  eq(result, 'done');
});

test('ms is a number and never negative', async () => {
  const { ms } = await timeIt(() => 'quick');
  ok(typeof ms === 'number', 'ms should be a number');
  ok(ms >= 0, `ms should not be negative (got ${ms})`);
});

test('ms covers the time the function actually spent', async () => {
  const { ms } = await timeIt(() => sleep(25));
  ok(ms >= 15, `expected roughly 25ms of waiting, got ${ms}`);
});

test('a rejection comes straight back out', async () => {
  await rejects(
    () => timeIt(async () => {
      throw new Error('measured code failed');
    }),
    'measured code failed'
  );
});

test('measureSpan returns the value and records a readable span', () => {
  eq(measureSpan('parse', () => 'parsed'), 'parsed');
  const ms = durationOf('parse');
  ok(typeof ms === 'number', 'durationOf should give a number');
  ok(ms >= 0, 'a span cannot be negative');
});

test('each name gets its own span', () => {
  measureSpan('step-a', () => sleep(0));
  measureSpan('step-b', () => sleep(0));
  ok(typeof durationOf('step-a') === 'number');
  ok(typeof durationOf('step-b') === 'number');
});

test('durationOf is undefined for a name nobody measured', () => {
  eq(durationOf('never-measured'), undefined);
});
