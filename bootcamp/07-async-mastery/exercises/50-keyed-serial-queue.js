// ─────────────────────────────────────────────────────────────────────────
//  50 · createKeyedQueue (serial per key)                  ★★★ stretch
//  concepts: per-key ordering · promise chains · map leaks
//  run: node 50-keyed-serial-queue.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Two webhooks for order #7 must apply in arrival order or the totals go
//  wrong. Order #9 has no reason to wait for either of them. Exercise 24
//  built ONE global FIFO; this is one FIFO per key:
//
//      const q = createKeyedQueue();
//      q.run('order-7', jobA);   // A then B, strictly
//      q.run('order-7', jobB);
//      q.run('order-9', jobC);   // C overlaps both
//
//  Rules:
//    · same key → strictly one at a time, in the order `run` was called
//    · different keys → concurrent
//    · `run` resolves/rejects with the job's own result
//    · a rejected job must NOT wedge its key — the next job still runs
//    · `size()` is how many keys have work right now, and a key is
//      FORGOTTEN once it drains (an unbounded Map is a memory leak)
//
//  hint: keep a Map from key → "promise for when this key is free", and
//  chain onto it. The chain you STORE must never reject, or the next job
//  inherits the failure.

import { test, eq, ok, rejects, sleep } from '../../_lib/check.js';

export const trace = [];
export const meter = { running: {}, peak: 0, perKeyPeak: 0 };

export const reset = () => {
  trace.length = 0;
  meter.running = {};
  meter.peak = 0;
  meter.perKeyPeak = 0;
};

// A job that records start/end and how many jobs share its key right now.
export function makeJob(key, name, { ms = 10, fail = false } = {}) {
  return async () => {
    const running = meter.running;
    running[key] = (running[key] ?? 0) + 1;
    const total = Object.values(running).reduce((a, b) => a + b, 0);
    meter.peak = Math.max(meter.peak, total);
    meter.perKeyPeak = Math.max(meter.perKeyPeak, running[key]);
    trace.push(`${name}:start`);
    await sleep(ms);
    trace.push(`${name}:end`);
    running[key] -= 1;
    if (fail) throw new Error(`${name} failed`);
    return name;
  };
}

export function createKeyedQueue() {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('runs same-key jobs in the order they were queued', async () => {
  reset();
  const q = createKeyedQueue();
  const jobs = [
    q.run('o7', makeJob('o7', 'a')),
    q.run('o7', makeJob('o7', 'b')),
    q.run('o7', makeJob('o7', 'c')),
  ];
  await Promise.all(jobs);
  eq(trace, [
    'a:start',
    'a:end',
    'b:start',
    'b:end',
    'c:start',
    'c:end',
  ]);
});

test('never overlaps two jobs for the same key', async () => {
  reset();
  const q = createKeyedQueue();
  await Promise.all([
    q.run('o7', makeJob('o7', 'a')),
    q.run('o7', makeJob('o7', 'b')),
  ]);
  eq(meter.perKeyPeak, 1);
});

test('runs different keys at the same time', async () => {
  reset();
  const q = createKeyedQueue();
  await Promise.all([
    q.run('o7', makeJob('o7', 'a')),
    q.run('o7', makeJob('o7', 'b')),
    q.run('o9', makeJob('o9', 'x')),
    q.run('o9', makeJob('o9', 'y')),
  ]);
  eq(meter.peak, 2, 'two keys must not queue behind each other');
  eq(meter.perKeyPeak, 1);
});

test('gives each caller its own job result', async () => {
  reset();
  const q = createKeyedQueue();
  const out = await Promise.all([
    q.run('o7', makeJob('o7', 'a')),
    q.run('o7', makeJob('o7', 'b')),
    q.run('o9', makeJob('o9', 'x')),
  ]);
  eq(out, ['a', 'b', 'x']);
});

test('a rejected job does not wedge its key', async () => {
  reset();
  const q = createKeyedQueue();
  const first = q.run('o7', makeJob('o7', 'bad', { fail: true }));
  const second = q.run('o7', makeJob('o7', 'good'));
  await rejects(first, 'bad failed');
  eq(await second, 'good');
  eq(trace, ['bad:start', 'bad:end', 'good:start', 'good:end']);
});

test('size() counts the keys that currently have work', async () => {
  reset();
  const q = createKeyedQueue();
  const running = Promise.all([
    q.run('o7', makeJob('o7', 'a')),
    q.run('o9', makeJob('o9', 'x')),
  ]);
  eq(q.size(), 2);
  await running;
  await sleep(5);
  eq(q.size(), 0, 'a drained key must be forgotten, not kept forever');
});

test('a key queued again after draining still works', async () => {
  reset();
  const q = createKeyedQueue();
  eq(await q.run('o7', makeJob('o7', 'a')), 'a');
  await sleep(5);
  eq(await q.run('o7', makeJob('o7', 'b')), 'b');
  ok(trace.indexOf('a:end') < trace.indexOf('b:start'));
});
