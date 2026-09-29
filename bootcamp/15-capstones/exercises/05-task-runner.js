// ─────────────────────────────────────────────────────────────────────────
//  05 · task runner                                         ★★★ capstone
//  concepts: promises · concurrency · higher-order functions
//  time: 45–55 min · 4 stages · 23 tests
//  run: node 05-task-runner.js
// ─────────────────────────────────────────────────────────────────────────
//
//  THE PITCH
//  p-limit, p-retry and Promise.allSettled, built by hand. The day your
//  script fires 4,000 fetches at once and the API starts returning 429s,
//  this is the file you reach for. The core idea — N workers pulling from
//  one shared index — is the same worker-pool pattern used by thread pools
//  and job queues everywhere.
//
//  STAGES — do them in order, run the file after each one
//    1. runTasks ........... run everything, results in INPUT order
//    2. concurrency ........ at most N in flight, refill as slots free
//    3. retry / withTimeout  wrappers that decorate a single task
//    4. collectErrors ...... allSettled mode, and composing all three
//
//  THE SPEC
//
//      await runTasks([taskA, taskB, taskC])
//        → [aResult, bResult, cResult]        // input order, never finish
//                                             // order
//      await runTasks(tasks, { concurrency: 2 })
//        → at most 2 tasks running at any moment
//      await runTasks(tasks)                  // rejects on the first error
//      await runTasks(tasks, { collectErrors: true })
//        → [{ status: 'fulfilled', value }, { status: 'rejected', reason }]
//
//    A "task" is a zero-argument function returning a promise (or a plain
//    value). It must be CALLED by the runner, not before — an array of
//    already-started promises is an array of already-running work, and no
//    limiter can help you then.
//
//    Stage 3, two decorators — same shape in, same shape out:
//
//      retry(task, { times: 3 })   // up to 3 attempts, rejects with the
//                                  // last error
//      withTimeout(task, 50)       // rejects with 'timed out after 50ms'
//
//    They compose: retry(withTimeout(task, 50), { times: 3 }).
//
//  hint (stage 2): do not slice the array into chunks — chunk 2 then waits
//  for the slowest task in chunk 1. Start N workers that each loop
//  `while (i < tasks.length)` over a shared cursor, and write results to
//  `results[myIndex]`.

import { test, eq, rejects, sleep } from '../../_lib/check.js';

// ── scaffolding for the tests — no need to change any of this ────────────

// makeTracker().task('a', 10) → an async task that resolves to 'a' after
// 10ms while recording how many tasks are running at once.
// makeTracker().gated('a', promise) → the same, but it stays in flight
// until that promise settles, so a test can drive the clock by hand
// instead of betting on wall-clock timing.
function makeTracker() {
  const t = { inFlight: 0, maxInFlight: 0, started: [], finished: [] };
  const run = async (value, until) => {
    t.inFlight += 1;
    t.maxInFlight = Math.max(t.maxInFlight, t.inFlight);
    t.started.push(value);
    await until;
    t.inFlight -= 1;
    t.finished.push(value);
    return value;
  };
  t.task = (value, ms = 10) => () => run(value, sleep(ms));
  t.gated = (value, until) => () => run(value, until);
  return t;
}

// gate() → { wait, open }: a promise you open by hand. It opens itself
// after `ms` as a backstop, so a wrong answer fails instead of hanging.
function gate(ms = 200) {
  let open;
  const wait = new Promise((resolve) => {
    const backstop = setTimeout(resolve, ms);
    open = () => {
      clearTimeout(backstop);
      resolve();
    };
  });
  return { wait, open };
}

// failing('boom') → a task that rejects after a short delay.
const failing = (message, ms = 5) => async () => {
  await sleep(ms);
  throw new Error(message);
};

// ── your code ────────────────────────────────────────────────────────────

// stages 1, 2, 4 — options: { concurrency = Infinity, collectErrors = false }
export async function runTasks(taskFns, options = {}) {
  throw new Error('TODO');
}

// stage 3 — up to `times` attempts, then reject with the last error.
export function retry(taskFn, { times = 1 } = {}) {
  throw new Error('TODO');
}

// stage 3 — reject with `timed out after ${ms}ms` if the task is too slow.
export function withTimeout(taskFn, ms) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

// ── stage 1: run them all, in order ──────────────────────────────────────

test('resolves to the results in input order', async () => {
  const out = await runTasks([async () => 1, async () => 2, async () => 3]);
  eq(out, [1, 2, 3]);
});

test('input order wins even when later tasks finish first', async () => {
  const out = await runTasks([
    async () => {
      await sleep(25);
      return 'slow';
    },
    async () => 'fast',
  ]);
  eq(out, ['slow', 'fast']);
});

test('an empty task list resolves to an empty array', async () => {
  eq(await runTasks([]), []);
});

test('every task is called exactly once', async () => {
  const t = makeTracker();
  await runTasks([t.task('a'), t.task('b'), t.task('c')]);
  eq(t.started.length, 3);
  eq(t.finished.length, 3);
});

test('tasks that return a plain value work too', async () => {
  eq(await runTasks([() => 'plain', async () => 'async']), ['plain', 'async']);
});

// ── stage 2: concurrency ─────────────────────────────────────────────────

test('never runs more than `concurrency` tasks at once', async () => {
  const t = makeTracker();
  const tasks = ['a', 'b', 'c', 'd', 'e', 'f'].map((v) => t.task(v));
  await runTasks(tasks, { concurrency: 2 });
  eq(t.maxInFlight, 2);
  eq(t.finished.length, 6);
});

test('concurrency 1 runs the tasks strictly one after another', async () => {
  const t = makeTracker();
  const out = await runTasks([t.task('a'), t.task('b'), t.task('c')], {
    concurrency: 1,
  });
  eq(t.maxInFlight, 1);
  eq(t.finished, ['a', 'b', 'c']);
  eq(out, ['a', 'b', 'c']);
});

test('a limit larger than the list is harmless', async () => {
  const t = makeTracker();
  const out = await runTasks([t.task('a'), t.task('b')], { concurrency: 10 });
  eq(t.maxInFlight, 2);
  eq(out, ['a', 'b']);
});

test('a free slot is refilled before the slow task finishes', async () => {
  const t = makeTracker();
  const g = gate();
  const c = t.task('c', 1);
  // 'slow' keeps its slot until 'c' has finished, so this finish order is
  // reachable only if the runner refilled the OTHER slot while slow was
  // still in flight. Chunk the array instead and c never gets to run.
  const tasks = [
    t.gated('slow', g.wait),
    t.task('b', 1),
    async () => {
      const value = await c();
      g.open();
      return value;
    },
  ];
  const out = await runTasks(tasks, { concurrency: 2 });
  eq(t.maxInFlight, 2);
  eq(t.finished, ['b', 'c', 'slow']);
  eq(out, ['slow', 'b', 'c']);
});

test('the default is no limit at all', async () => {
  const t = makeTracker();
  const tasks = ['a', 'b', 'c', 'd'].map((v) => t.task(v));
  await runTasks(tasks);
  eq(t.maxInFlight, 4);
});

// ── stage 3: retry and withTimeout ───────────────────────────────────────

test('retry leaves a task that works alone', async () => {
  let attempts = 0;
  const wrapped = retry(
    async () => {
      attempts += 1;
      return 'ok';
    },
    { times: 3 }
  );
  eq(await wrapped(), 'ok');
  eq(attempts, 1);
});

test('retry keeps going until an attempt succeeds', async () => {
  let attempts = 0;
  const flaky = async () => {
    attempts += 1;
    if (attempts < 3) throw new Error('flaky');
    return 'ok';
  };
  const wrapped = retry(flaky, { times: 5 });
  eq(await wrapped(), 'ok');
  eq(attempts, 3);
});

test('retry gives up after `times` attempts, rejecting with the last error',
  async () => {
    let attempts = 0;
    const always = async () => {
      attempts += 1;
      throw new Error(`nope ${attempts}`);
    };
    const wrapped = retry(always, { times: 3 });
    await rejects(wrapped, 'nope 3');
    eq(attempts, 3);
  });

test('times: 1 means one attempt and no retry', async () => {
  let attempts = 0;
  const always = async () => {
    attempts += 1;
    throw new Error('nope');
  };
  const wrapped = retry(always, { times: 1 });
  await rejects(wrapped, 'nope');
  eq(attempts, 1);
});

test('withTimeout resolves when the task is fast enough', async () => {
  const wrapped = withTimeout(async () => {
    await sleep(1);
    return 'quick';
  }, 200);
  eq(await wrapped(), 'quick');
});

test('withTimeout rejects when the task takes too long', async () => {
  const wrapped = withTimeout(async () => {
    await sleep(60); // six times the limit — no photo finish to lose
    return 'late';
  }, 10);
  await rejects(wrapped, /timed out/);
});

test("withTimeout passes the task's own error through unchanged", async () => {
  const wrapped = withTimeout(failing('boom', 1), 200);
  await rejects(wrapped, 'boom');
});

// ── stage 4: collectErrors, and composing the three ──────────────────────

test('collectErrors reports settled records, like allSettled', async () => {
  const results = await runTasks([async () => 1, failing('boom')], {
    collectErrors: true,
  });
  eq(results[0], { status: 'fulfilled', value: 1 });
  eq(results[1].status, 'rejected');
  eq(results[1].reason.message, 'boom');
});

test('settled records keep the input order', async () => {
  const results = await runTasks([failing('first', 20), async () => 'second'], {
    collectErrors: true,
  });
  eq(results.map((r) => r.status), ['rejected', 'fulfilled']);
});

test('one failing task does not stop the others', async () => {
  const t = makeTracker();
  const tasks = [t.task('a'), failing('boom'), t.task('c')];
  const results = await runTasks(tasks, { collectErrors: true, concurrency: 2 });
  eq(t.finished.length, 2);
  eq(results.map((r) => r.status), ['fulfilled', 'rejected', 'fulfilled']);
});

test('without collectErrors the first failure rejects the whole run', async () => {
  const tasks = [failing('boom'), async () => 'fine'];
  const settled = await runTasks(tasks, { collectErrors: true });
  eq(settled.map((r) => r.status), ['rejected', 'fulfilled']);
  await rejects(() => runTasks(tasks), 'boom');
});

test('retry composes with the pool — only the last failure is recorded',
  async () => {
    let attempts = 0;
    const always = async () => {
      attempts += 1;
      throw new Error('always');
    };
    const results = await runTasks(
      [retry(always, { times: 3 }), async () => 'ok'],
      { collectErrors: true }
    );
    eq(attempts, 3);
    eq(results[0].reason.message, 'always');
    eq(results[1].value, 'ok');
  });

test('pool + retry + timeout, all three together', async () => {
  let attempts = 0;
  const slowThenFast = async () => {
    attempts += 1;
    if (attempts === 1) await sleep(60); // first attempt blows the limit,
    return 'recovered'; //                  the retry settles right away
  };
  const task = retry(withTimeout(slowThenFast, 10), { times: 3 });
  const out = await runTasks([task, async () => 'plain'], { concurrency: 2 });
  eq(out, ['recovered', 'plain']);
  eq(attempts, 2);
});
