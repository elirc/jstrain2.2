// ─────────────────────────────────────────────────────────────────────────
//  03 · job lifecycle — SOLUTION                            ★★★ stretch
//  run: node ../run.js solutions/03-job-lifecycle.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: two maps carry the whole design. `Transitions` says which
//  state may follow which (and `done: never` says "nothing follows done" —
//  never is the honest empty union). `EnterData` says what payload each
//  state needs on arrival. Everything else is derived.
//
//  The signature is the interesting part. `J extends Job` infers from the
//  argument, so `J['state']` is the CURRENT state; `T extends
//  Transitions[J['state']]` then constrains the destination to the legal
//  set for that state, and `data: EnterData[T]` demands exactly the
//  payload the destination needs. Illegal pairs fail on the second
//  argument; wrong payloads fail on the third.
//
//  Note what is NOT here: no `if (from === 'queued' && to === 'done')`
//  runtime chain. The rule lives in a type, and `LEGAL` mirrors it once
//  for values that arrive at runtime (parsed JSON, a queue message) where
//  types cannot help.
//
//  The single cast is unavoidable: tsc cannot check that spreading
//  `EnterData[T]` onto `{ state: T }` produces the T member of the union,
//  and for a generic T the two do not even overlap enough for a plain
//  `as` — hence the trip through `unknown`. That is not a defeat, it is
//  the signal: one line, at the one place where the claim is made true.

import { test, eq, ok, throws } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export type Job =
  | { state: 'queued'; id: string; queuedAt: number }
  | { state: 'running'; id: string; startedAt: number; worker: string }
  | { state: 'failed'; id: string; error: string; attempts: number }
  | { state: 'done'; id: string; finishedAt: number; result: string };

export type JobState = Job['state'];

export type JobIn<S extends JobState> = Extract<Job, { state: S }>;

export type Transitions = {
  queued: 'running';
  running: 'done' | 'failed';
  failed: 'queued';
  done: never;
};

export type EnterData = {
  queued: { queuedAt: number };
  running: { startedAt: number; worker: string };
  failed: { error: string; attempts: number };
  done: { finishedAt: number; result: string };
};

const LEGAL: { [S in JobState]: readonly JobState[] } = {
  queued: ['running'],
  running: ['done', 'failed'],
  failed: ['queued'],
  done: [],
};

export function legalNext(state: JobState): readonly JobState[] {
  return LEGAL[state];
}

export function advance<J extends Job, T extends Transitions[J['state']]>(
  job: J,
  to: T,
  data: EnterData[T]
): JobIn<T> {
  if (!legalNext(job.state).includes(to)) {
    throw new Error(`illegal transition: ${job.state} -> ${to}`);
  }
  return { ...data, state: to, id: job.id } as unknown as JobIn<T>;
}

export function summarize(job: Job): string {
  switch (job.state) {
    case 'queued':
      return `${job.id} queued at ${job.queuedAt}`;
    case 'running':
      return `${job.id} running on ${job.worker}`;
    case 'failed':
      return `${job.id} failed after ${job.attempts}: ${job.error}`;
    case 'done':
      return `${job.id} done: ${job.result}`;
    default: {
      const unreachable: never = job;
      throw new Error(`unhandled state: ${JSON.stringify(unreachable)}`);
    }
  }
}

// ─────────────────────────── runtime tests ───────────────────────────────

const queued: JobIn<'queued'> = { state: 'queued', id: 'j1', queuedAt: 10 };

test('queued → running keeps the id and takes the new payload', () => {
  const running = advance(queued, 'running', { startedAt: 20, worker: 'w-3' });
  eq(running, { state: 'running', id: 'j1', startedAt: 20, worker: 'w-3' });
});

test('running → done carries the result', () => {
  const running = advance(queued, 'running', { startedAt: 20, worker: 'w-3' });
  const done = advance(running, 'done', { finishedAt: 30, result: '42' });
  eq(done.state, 'done');
  eq(done.result, '42');
});

test('running → failed, then failed → queued for a retry', () => {
  const running = advance(queued, 'running', { startedAt: 20, worker: 'w-3' });
  const failed = advance(running, 'failed', { error: 'boom', attempts: 1 });
  eq(failed.attempts, 1);
  const retried = advance(failed, 'queued', { queuedAt: 40 });
  eq(retried.state, 'queued');
});

test('an illegal pair that dodged the compiler throws at runtime', () => {
  const done = { state: 'done', id: 'j1', finishedAt: 1, result: 'x' } as Job;
  throws(
    () => advance(done as JobIn<'running'>, 'failed', { error: 'x', attempts: 1 }),
    'illegal transition'
  );
});

test('summarize reads the payload that belongs to each state', () => {
  eq(summarize(queued), 'j1 queued at 10');
  eq(summarize({ state: 'running', id: 'j2', startedAt: 1, worker: 'w-1' }),
    'j2 running on w-1');
  eq(summarize({ state: 'failed', id: 'j3', error: 'nope', attempts: 2 }),
    'j3 failed after 2: nope');
});

test('the runtime table tells the same story as Transitions', () => {
  eq(legalNext('queued'), ['running']);
  eq(legalNext('done'), []);
  ok(legalNext('running').includes('failed'));
});

// ──────────────────────────── type tests ─────────────────────────────────

type _t1 = Expect<Equal<JobState, 'queued' | 'running' | 'failed' | 'done'>>;
type _t2 = Expect<Equal<Transitions['running'], 'done' | 'failed'>>;
type _t3 = Expect<Equal<Transitions['done'], never>>;
type _t4 = Expect<
  Equal<
    JobIn<'failed'>,
    { state: 'failed'; id: string; error: string; attempts: number }
  >
>;

function _typeTests() {
  const running = advance(queued, 'running', { startedAt: 1, worker: 'w-1' });
  const pinned: JobIn<'running'> = running;
  const worker: string = running.worker;
  use(pinned, worker);

  // @ts-expect-error — running carries no result
  running.result;

  // @ts-expect-error — queued cannot jump straight to done
  advance(queued, 'done', { finishedAt: 2, result: 'x' });

  // @ts-expect-error — done is terminal: nothing may follow it
  advance(advance(running, 'done', { finishedAt: 2, result: 'x' }), 'queued', { queuedAt: 3 });

  // @ts-expect-error — entering failed needs attempts as well as error
  advance(running, 'failed', { error: 'boom' });

  // @ts-expect-error — 'paused' is not a state at all
  advance(queued, 'paused', { queuedAt: 1 });
}
use(_typeTests);
