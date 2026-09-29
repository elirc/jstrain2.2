// ─────────────────────────────────────────────────────────────────────────
//  09 · the promise nobody waited for                      ★★☆ core
//  concepts: floating promises · async callbacks · void return positions
//  run: node ../run.js exercises/09-promise-void.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  `runAll` starts every job at once and resolves when they have all
//  finished. The list it resolves with is in COMPLETION order — fastest
//  first — which is also how you can tell from the outside that the jobs
//  really did overlap instead of queueing up one behind the other.
//
//      runAll([{ id: 'a', ms: 45 },
//              { id: 'b', ms: 15 },
//              { id: 'c', ms: 30 }])      → ['b', 'c', 'a']
//      runAll([{ id: 'solo', ms: 10 }])   → ['solo']
//      runAll([])                         → []
//
//  tsc has no complaint. Three tests fail, and they fail the same way:
//  the answer arrives empty. Find the bug, fix it minimally, do not
//  rewrite the function.
//
//  hint: put a log on the line before the return and another inside the
//  callback, then read the order they print in. A callback that returns a
//  promise into a slot expecting nothing is a promise nobody holds.

import { test, eq, sleep } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export interface Job {
  id: string;
  ms: number;
}

export async function runAll(jobs: Job[]): Promise<string[]> {
  const finished: string[] = [];
  jobs.forEach(async (job) => {
    await sleep(job.ms);
    finished.push(job.id);
  });
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
