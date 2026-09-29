// ─────────────────────────────────────────────────────────────────────────
//  19 · aggregate the parallel failures — SOLUTION             ★★☆ core
//  run: node 19-aggregate-failures.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `Promise.allSettled` is the "tell me about everyone"
//  primitive. It resolves once, with one record per task, in task order
//  — which is why the failures come back in the order the caller wrote
//  them and not the order they happened. Sorting that out afterwards is
//  impossible; allSettled hands it to you for free.
//  `tasks.map(async (task) => task())` matters: the async wrapper turns
//  a task that throws SYNCHRONOUSLY into a rejected promise. Without it,
//  a synchronous throw escapes during the map and allSettled never runs.
//  AggregateError is the built-in shape for "several things failed at
//  once": `new AggregateError(errors, message)`, `.errors`, and it is a
//  real Error, so it still travels up a normal catch.
//  Classic wrong turn: `Promise.all` in a try/catch. It rejects at the
//  first failure, the rest keep running unobserved, and your report
//  names one of three broken uploads.

import { test, eq, ok, sleep } from '../../_lib/check.js';

export async function runAll(tasks) {
  const settled = await Promise.allSettled(tasks.map(async (task) => task()));
  const errors = settled
    .filter((record) => record.status === 'rejected')
    .map((record) =>
      record.reason instanceof Error
        ? record.reason
        : new Error(String(record.reason))
    );
  if (errors.length > 0) {
    throw new AggregateError(
      errors,
      `${errors.length} of ${tasks.length} tasks failed`
    );
  }
  return settled.map((record) => record.value);
}

export function formatFailures(aggregate) {
  const lines = aggregate.errors.map(
    (err) => `  - ${err.name}: ${err.message}`
  );
  return [aggregate.message, ...lines].join('\n');
}

// ── given: test fixtures & helpers ───────────────────────────────────────

// resolves with `value` after ms
const slowOk = (ms, value) => async () => {
  await sleep(ms);
  return value;
};

// rejects with an Error carrying `message` after ms
const slowFail = (ms, message) => async () => {
  await sleep(ms);
  throw new Error(message);
};

// returns the error an async fn rejected with, so a test can inspect it
async function rejectedBy(fn) {
  try {
    await fn();
  } catch (err) {
    if (err instanceof Error && err.message === 'TODO') throw err;
    return err;
  }
  throw new Error('expected fn to reject, but it resolved');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('resolves with every value, in task order', async () => {
  eq(await runAll([slowOk(20, 'a'), slowOk(0, 'b'), slowOk(10, 'c')]), [
    'a',
    'b',
    'c',
  ]);
});

test('an empty task list resolves to an empty array', async () => {
  eq(await runAll([]), []);
});

test('the tasks really do run in parallel', async () => {
  let active = 0;
  let peak = 0;
  const task = () => async () => {
    active += 1;
    peak = Math.max(peak, active);
    await sleep(10);
    active -= 1;
    return 'ok';
  };
  await runAll([task(), task(), task()]);
  ok(peak > 1, 'the tasks were started one after another');
});

test('one failure makes it throw an AggregateError', async () => {
  const err = await rejectedBy(() =>
    runAll([slowOk(0, 'a'), slowFail(0, 'x')])
  );
  ok(err instanceof AggregateError);
  ok(err instanceof Error);
});

test('.errors holds every failure, not just the first', async () => {
  const err = await rejectedBy(() =>
    runAll([slowFail(20, 'db down'), slowOk(0, 'ok'), slowFail(0, 'late')])
  );
  eq(err.errors.length, 2);
  eq(err.message, '2 of 3 tasks failed');
});

test('failures keep task order, not finish order', async () => {
  const err = await rejectedBy(() =>
    runAll([slowFail(20, 'slow one'), slowFail(0, 'fast one')])
  );
  eq(err.errors.map((e) => e.message), ['slow one', 'fast one']);
});

test('a non-Error rejection reason is normalized', async () => {
  const err = await rejectedBy(() =>
    runAll([() => Promise.reject('just a string')])
  );
  ok(err.errors[0] instanceof Error);
  eq(err.errors[0].message, 'just a string');
});

test('formatFailures renders one line per failure', () => {
  const timeout = Object.assign(new Error('timed out'), {
    name: 'TimeoutError',
  });
  const aggregate = new AggregateError(
    [new Error('db down'), timeout],
    '2 of 3 tasks failed'
  );
  eq(
    formatFailures(aggregate),
    '2 of 3 tasks failed\n  - Error: db down\n  - TimeoutError: timed out'
  );
});
