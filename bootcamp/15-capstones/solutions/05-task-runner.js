// ─────────────────────────────────────────────────────────────────────────
//  05 · task runner — SOLUTION                              ★★★ capstone
//  concepts: promises · concurrency · higher-order functions
//  time: 45–55 min · 4 stages · 23 tests
//  run: node 05-task-runner.js
// ─────────────────────────────────────────────────────────────────────────
//
//  WALKTHROUGH
//
//  Architecture. One shared cursor (`next`), one pre-sized results array,
//  and N identical worker loops racing to grab indexes. `await
//  Promise.all(workers)` is the join. That is the worker-pool pattern, and
//  it is worth memorising: it beats "chunk the array into groups of N"
//  because chunking makes every group wait for its own slowest member,
//  leaving the pool half-idle. Here a slot is refilled the instant it
//  frees.
//
//  Stage 1 — order comes from `results[i] = value`, never from push().
//  Writing by index is what decouples "when did it finish" from "where
//  does it belong". Note that the runner CALLS taskFns[i] itself: a task
//  is a function, not a promise, because a promise has already started.
//
//  Stage 2 — the limit is `Math.min(concurrency, taskFns.length)` so a
//  limit of 100 on 3 tasks does not spawn 97 idle loops, and Infinity (the
//  default) just means "one worker per task".
//
//  Stage 3 — decorators. Both wrappers take a task and return a task, so
//  they compose in any order and the pool never learns they exist. This is
//  the same shape as Express middleware or a Python decorator.
//    · retry is a for-loop that keeps the last error and rethrows it after
//      the final attempt — swallow it and the caller sees `undefined`.
//    · withTimeout races the task against a timer. clearTimeout in BOTH
//      settle paths matters: leave it pending and Node holds the process
//      open for the full duration of a timeout that already lost.
//    · a timed-out task is not cancelled — JS promises have no abort. It
//      keeps running, its result is ignored. Knowing that is the point.
//
//  Stage 4 — collectErrors flips the failure policy. Fail-fast means a
//  worker rethrows and Promise.all rejects with the first error; the other
//  workers keep going but their results are dropped. allSettled mode
//  catches at the task boundary and stores a record instead, which is what
//  you want for "import these 500 rows and tell me which ones failed".
//
//  Classic wrong turn: `tasks.map(t => t())` and then limiting. The map
//  starts all 4,000 requests immediately; whatever you do afterwards is
//  bookkeeping on work that is already in flight.

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
  const { concurrency = Infinity, collectErrors = false } = options;
  const results = new Array(taskFns.length);
  const workerCount = Math.max(1, Math.min(concurrency, taskFns.length));
  let next = 0; // the shared cursor — the whole synchronisation story

  async function worker() {
    while (next < taskFns.length) {
      const index = next;
      next += 1; // claim it before the first await, or two workers collide
      try {
        const value = await taskFns[index]();
        results[index] = collectErrors ? { status: 'fulfilled', value } : value;
      } catch (reason) {
        if (!collectErrors) throw reason; // stage 4: fail fast
        results[index] = { status: 'rejected', reason };
      }
    }
  }

  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}

// stage 3 — attempt, remember, rethrow the last one.
export function retry(taskFn, { times = 1 } = {}) {
  return async (...args) => {
    let lastError;
    for (let attempt = 1; attempt <= times; attempt += 1) {
      try {
        return await taskFn(...args);
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError;
  };
}

// stage 3 — race the task against a timer, and always clear the timer.
export function withTimeout(taskFn, ms) {
  return (...args) =>
    new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error(`timed out after ${ms}ms`)),
        ms
      );
      const settle = (fn) => (valueOrError) => {
        clearTimeout(timer);
        fn(valueOrError);
      };
      Promise.resolve()
        .then(() => taskFn(...args))
        .then(settle(resolve), settle(reject));
    });
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
