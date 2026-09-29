// ─────────────────────────────────────────────────────────────────────────
//  09 · the promise nobody waited for — SOLUTION           ★★☆ core
//  run: node ../run.js solutions/09-promise-void.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//
//  BUG CLASS — a floating promise: async work started, never awaited,
//  and therefore finishing after the function that started it returned.
//
//  THE TELL — an empty result rather than a wrong one, and logs that
//  print in the wrong order: "returning" first, every "finished job"
//  after it. Empty-not-wrong means the work had not happened yet, not
//  that it happened badly.
//
//  `jobs.forEach(async (job) => { … })` starts three promises and drops
//  all three on the floor. `forEach` has no idea what a promise is; it
//  calls the callback, discards the return value, and moves on. The
//  `return finished` line runs before any `await sleep` has resumed, so
//  it returns the array while it is still empty — and the pushes land
//  moments later, into an array nobody is looking at any more.
//
//  WHY TSC COULD NOT CATCH IT — `forEach` expects a callback returning
//  `void`, and TypeScript deliberately allows a function returning
//  ANYTHING where a void-returning one is expected. (Without that rule
//  `array.forEach(x => list.push(x))` would be an error, since `push`
//  returns a number.) So handing it `Promise<void>` is legal, and the
//  dropped promise is invisible. This one has a linter, not a compiler,
//  behind it: `@typescript-eslint/no-floating-promises` and
//  `no-misused-promises` exist precisely because tsc cannot say no here.
//
//  THE FIX — `map` instead of `forEach`, so the promises come back, and
//  `await Promise.all(...)` so they are all held until they settle. The
//  pushes stay inside the callbacks, which is what keeps the result in
//  COMPLETION order — `Promise.all` resolves in argument order, but the
//  array was filled in the order the sleeps finished.
//
//  The rule: `forEach` and `async` do not belong in the same expression.
//  Every promise a function creates must be awaited, returned, or
//  deliberately handed to something that will handle its rejection.

import { test, eq, sleep } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export interface Job {
  id: string;
  ms: number;
}

export async function runAll(jobs: Job[]): Promise<string[]> {
  const finished: string[] = [];
  await Promise.all(
    jobs.map(async (job) => {
      await sleep(job.ms);
      finished.push(job.id);
    })
  );
  return finished;
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('an empty list resolves to an empty list', async () => {
  eq(await runAll([]), []);
});

test('one job resolves with its own id', async () => {
  eq(await runAll([{ id: 'solo', ms: 10 }]), ['solo']);
});

test('every job that was started is in the answer', async () => {
  const ids = await runAll([
    { id: 'a', ms: 45 },
    { id: 'b', ms: 15 },
    { id: 'c', ms: 30 },
  ]);
  eq([...ids].sort(), ['a', 'b', 'c']);
});

test('the answer is in completion order, fastest first', async () => {
  eq(
    await runAll([
      { id: 'a', ms: 45 },
      { id: 'b', ms: 15 },
      { id: 'c', ms: 30 },
    ]),
    ['b', 'c', 'a']
  );
});

test("the caller's job list is never touched", async () => {
  const jobs: Job[] = [{ id: 'a', ms: 5 }];
  await runAll(jobs);
  eq(jobs, [{ id: 'a', ms: 5 }]);
});

// ──────────────────────────── type tests ─────────────────────────────────
//
//  These already pass — in the broken file and in the fixed one. That is
//  the whole point of the module: the type layer is satisfied either way.

type _t1 = Expect<Equal<ReturnType<typeof runAll>, Promise<string[]>>>;

async function _typeTests() {
  const ids: string[] = await runAll([]);
  use(ids);

  // @ts-expect-error — a job needs a duration
  runAll([{ id: 'a' }]);

  // @ts-expect-error — runAll takes a list of jobs
  runAll({ id: 'a', ms: 1 });
}
use(_typeTests);
