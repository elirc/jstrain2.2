// ─────────────────────────────────────────────────────────────────────────
//  16 · narrowing dies — SOLUTION                         ★★★ stretch
//  run: node ../run.js solutions/16-narrowing-dies.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: control-flow analysis is a walk over the statements of
//  ONE function body, in order. A callback is a different body, and the
//  compiler does not model when it runs — so rather than guess, it drops
//  back to the declared type. Note that `.map` runs immediately and it
//  makes no difference; "immediately" is not something CFA reasons about.
//
//  It gives up in exactly two situations:
//
//  • a property (`job.retries`, `report.title`) — any code holding the
//    object could reassign it, so no narrowing survives into a nested
//    function;
//  • a `let`/`var`/parameter that a nested function can assign, or that
//    is assigned after the closure is created.
//
//  It does NOT give up on a `const`, on a parameter that is never
//  reassigned, or (since TS 5.4) on a `let` read after its last
//  assignment. Those cannot change between the check and the use, so the
//  narrowing is still sound inside a callback.
//
//  That is the whole fix: `const retries = job.retries` copies the
//  NARROWED type (`number`, not `number | null`) into a binding nothing
//  can invalidate. And it is an honest fix — the runtime test that sets
//  `job.retries = 99` after building the reporter passes only because the
//  const captured the value. A `!` non-null assertion would have silenced
//  the compiler and still printed 99: the error was pointing at a real
//  bug, not being pedantic.
//
//  `renderRows` is the same move on the other side of the check. Reading
//  `report.title` once, into a const, is also just better code — one
//  property read instead of one per row.

import { test, eq, ok } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

function probe<T>(value: T): T {
  return value;
}

export interface Job {
  id: string;
  retries: number | null;
}

export interface Report {
  title: string | null;
  rows: string[];
}

export function retryReporter(job: Job): () => string {
  const { id, retries } = job;

  if (retries === null) return () => `${id} will not retry`;
  return () => `${id} will retry ${retries} more time(s)`;
}

export function renderRows(report: Report): string[] {
  const title = report.title;

  if (title === null) return report.rows.map((row) => `untitled: ${row}`);
  return report.rows.map((row) => `${title}: ${row}`);
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('retryReporter hands back a function', () => {
  ok(typeof retryReporter({ id: 'j1', retries: 2 }) === 'function');
});

test('the reporter names the job and the count', () => {
  const report = retryReporter({ id: 'j1', retries: 2 });
  eq(report(), 'j1 will retry 2 more time(s)');
});

test('null retries reads as "will not retry"', () => {
  const report = retryReporter({ id: 'j2', retries: null });
  eq(report(), 'j2 will not retry');
});

test('the count is captured at build time, not read at call time', () => {
  const job: Job = { id: 'j3', retries: 2 };
  const report = retryReporter(job);
  job.retries = 99;
  eq(report(), 'j3 will retry 2 more time(s)');
});

test('renderRows prefixes every row with the title', () => {
  eq(renderRows({ title: 'Report', rows: ['a', 'b'] }), [
    'Report: a',
    'Report: b',
  ]);
});

test('a null title falls back to untitled', () => {
  eq(renderRows({ title: null, rows: ['a'] }), ['untitled: a']);
});

// ──────────────────────────── type tests ─────────────────────────────────

type _r1 = Expect<Equal<Parameters<typeof retryReporter>[0], Job>>;
type _r2 = Expect<Equal<ReturnType<typeof retryReporter>, () => string>>;
type _r3 = Expect<Equal<Parameters<typeof renderRows>[0], Report>>;

function _typeTests() {
  const job: Job = { id: 'j', retries: 3 };

  if (job.retries !== null) {
    // @ts-expect-error — property narrowing does NOT survive into a callback
    const broken = () => job.retries.toFixed(0);

    const retries = job.retries; // a const keeps the narrowed type
    const p = probe(retries);
    type _kept = Expect<Equal<typeof p, number>>;
    const fixed = () => retries.toFixed(0);

    use(broken, fixed, p);
  }

  // a `let` is fine as long as nothing can reassign it later — since
  // TS 5.4 the narrowing survives past the LAST assignment
  let title: string | null = 'x';
  if (title === null) title = 'untitled';

  const outer = probe(title);
  type _outer = Expect<Equal<typeof outer, string>>;

  const stillNarrowed = () => title.toUpperCase();
  use(outer, stillNarrowed);

  // …but let one callback reassign it and every OTHER callback re-widens
  let label: string | null = 'x';
  if (label === null) label = 'untitled';

  const clear = () => {
    label = null;
  };

  // @ts-expect-error — a let a callback can reassign is re-widened
  const rewidened = () => label.toUpperCase();

  use(clear, rewidened);

  // @ts-expect-error — retryReporter needs a Job, not a bare number
  retryReporter(3);
}
use(_typeTests);
