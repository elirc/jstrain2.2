// ─────────────────────────────────────────────────────────────────────────
//  12 · measuring with perf_hooks                           ★☆☆ warm-up
//  concepts: performance.now · mark · measure · entries
//  run: node 12-perf-timing.js
// ─────────────────────────────────────────────────────────────────────────
//
//  `Date.now()` is a wall clock: it jumps when NTP corrects it and it
//  only has millisecond resolution. `performance.now()` is a monotonic
//  stopwatch with sub-millisecond precision, and it is what you want for
//  "how long did that take".
//
//      await timeIt(() => 1 + 1)             → { result: 2, ms: 0.03 }
//      await timeIt(async () => 'done')      → { result: 'done', ms: … }
//
//  Marks and measures are the named version of the same thing — you drop
//  labelled pins and read the spans back later:
//
//      measureSpan('parse', () => parse(text))   → parse's return value
//      durationOf('parse')                       → 1.84
//      durationOf('never-measured')              → undefined
//
//  hint: performance.mark(name) records a pin; performance.measure(name,
//  startPin, endPin) records the span between two; and
//  performance.getEntriesByName(name) reads the spans back

import { test, eq, ok, rejects, sleep } from '../../_lib/check.js';
import { performance } from 'node:perf_hooks';

export async function timeIt(fn) {
  throw new Error('TODO');
}

export function measureSpan(name, fn) {
  throw new Error('TODO');
}

export function durationOf(name) {
  throw new Error('TODO');
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
