// ─────────────────────────────────────────────────────────────────────────
//  19 · aggregate the parallel failures                        ★★☆ core
//  concepts: AggregateError · allSettled · combined reports
//  run: node 19-aggregate-failures.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Five uploads go out at once and three come back broken. `Promise.all`
//  tells you about exactly one of them — the first to reject — and lets
//  the other rejections land unheard. When the work is parallel, the
//  report has to be plural.
//
//    runAll(tasks) — tasks is an array of async functions
//        all succeed → the values, in the order the tasks were given
//        any fail    → throw an AggregateError with
//                        .errors  every failure, in TASK order
//                        .message '2 of 3 tasks failed'
//        a non-Error rejection reason is normalized to an Error
//
//    formatFailures(aggregate) → one report, ready for a log:
//
//        2 of 3 tasks failed
//          - Error: db down
//          - TimeoutError: timed out
//
//  hint: Promise.allSettled never rejects — it hands back one
//  { status, value } / { status, reason } per task, in order.

import { test, eq, ok, sleep } from '../../_lib/check.js';

export async function runAll(tasks) {
  throw new Error('TODO');
}

export function formatFailures(aggregate) {
  throw new Error('TODO');
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
