// ─────────────────────────────────────────────────────────────────────────
//  03 · job lifecycle                                       ★★★ stretch
//  concepts: per-state payloads · transition maps · indexed access
//  run: node ../run.js exercises/03-job-lifecycle.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  cold rep — you learned this in TS-02 and TS-06.
//
//  A job moves through four states, each carrying different data:
//
//      queued  { queuedAt }          running { startedAt, worker }
//      failed  { error, attempts }   done    { finishedAt, result }
//
//  Legal moves: queued→running, running→done|failed, failed→queued.
//  done is terminal. Encode that in the TYPES, so an illegal pair does
//  not compile — and mirror it at runtime for values that arrive as JSON.
//
//      advance(queued, 'running', { startedAt: 20, worker: 'w-3' })
//          → { state: 'running', id: 'j1', startedAt: 20, worker: 'w-3' }
//      advance(queued, 'done', { ... })            → compile error
//      advance(running, 'failed', { error: 'x' })  → compile error

import { test, eq, ok, throws } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

export type Job = TODO;

export type JobState = TODO;

export type JobIn<S extends JobState> = TODO;

export type Transitions = TODO;

export type EnterData = TODO;

export function legalNext(state: JobState): readonly JobState[] {
  throw new Error('TODO');
}

export function advance(job: TODO, to: TODO, data: TODO): TODO {
  throw new Error('TODO');
}

export function summarize(job: Job): string {
  throw new Error('TODO');
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
