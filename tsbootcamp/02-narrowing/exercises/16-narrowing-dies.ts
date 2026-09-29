// ─────────────────────────────────────────────────────────────────────────
//  16 · narrowing dies                                    ★★★ stretch
//  concepts: closures · mutable captures · why CFA gives up
//  run: node ../run.js exercises/16-narrowing-dies.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Everything you have narrowed so far held because the compiler could
//  see the straight line from the check to the use. Put a callback in
//  between and the line breaks:
//
//      if (job.retries !== null) {
//        return () => job.retries.toFixed(0);   // ✘ possibly null
//      }
//
//  The callback is a different function body. Anything holding `job`
//  could assign `job.retries = null` before it runs, so the compiler
//  re-reads the declared type. The fix is one line — copy the narrowed
//  value into a `const` — and it is a real fix, not a cast: a const
//  cannot change either.
//
//      const r = retryReporter({ id: 'j1', retries: 2 });
//      r()                       → 'j1 will retry 2 more time(s)'
//      retries: null             → 'j1 will not retry'
//
//      renderRows({ title: 'Report', rows: ['a', 'b'] })
//        → ['Report: a', 'Report: b']
//      renderRows({ title: null, rows: ['a'] })
//        → ['untitled: a']
//
//  The reporter must capture the count when it is BUILT — mutating the
//  job afterwards must not change what it prints. (One of the tests
//  checks exactly that, and only the const-capture version passes it.)
//
//  hint: `renderRows` hits the same wall even though `.map` runs
//  immediately. The compiler does not track WHEN a callback runs, only
//  that it is a separate body.

import { test, eq, ok } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

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

export function retryReporter(job: TODO): TODO {
  throw new Error('TODO');
}

export function renderRows(report: TODO): string[] {
  throw new Error('TODO');
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
