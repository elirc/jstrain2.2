// ─────────────────────────────────────────────────────────────────────────
//  50 · createKeyedQueue (serial per key) — SOLUTION       ★★★ stretch
//  run: node 50-keyed-serial-queue.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the whole queue is a Map of tail promises. `run` looks up
//  the key's tail (or a resolved promise for a brand-new key), chains the
//  job onto it, and stores the new tail. Two jobs on the same key are two
//  links of one chain, so they cannot overlap; two different keys are two
//  unrelated chains, so nothing makes them wait.
//  Two details separate this from the naive version. First, the promise
//  you STORE must never reject — `result.then(finish, finish)` swallows
//  the outcome — otherwise one failed job turns the key's tail into a
//  rejected promise and every later job inherits the failure. The CALLER
//  still gets the real `result`, rejection and all.
//  Second, delete the key when its tail is the last one standing. Without
//  that check you either leak one Map entry per key forever (fine for 5
//  orders, fatal for a million) or you delete a key that has just been
//  re-queued.
//  Wrong turn: `chains.set(key, result)` — storing the caller's promise.
//  A single rejected job then poisons the key permanently, and the failure
//  looks like "webhook 2 was silently dropped".

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
  const tails = new Map();

  return {
    run(key, job) {
      const previous = tails.get(key) ?? Promise.resolve();
      const result = previous.then(() => job());

      const finish = () => {
        if (tails.get(key) === tail) tails.delete(key);
      };
      const tail = result.then(finish, finish);
      tails.set(key, tail);

      return result;
    },

    size() {
      return tails.size;
    },
  };
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
