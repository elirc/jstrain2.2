// ─────────────────────────────────────────────────────────────────────────
//  03 · the default that ate a zero                        ★☆☆ warm-up
//  concepts: ?? vs || · falsy values · option bags
//  run: node ../run.js exercises/03-nullish-vs-or.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  `resolveRetry` fills an options bag out to a complete `Retry`. An
//  option that was left out takes the default. An option that was PASSED
//  is kept exactly as passed — including 0, '' and false, which are all
//  things a caller can legitimately mean.
//
//      resolveRetry({})                  → 3 attempts, 250ms, 'retry', jitter
//      resolveRetry({ attempts: 5 })     → 5 attempts, rest default
//      resolveRetry({ delayMs: 0 })      → 0ms — retry immediately
//      resolveRetry({ label: '' })       → '' — deliberately unlabelled
//      totalWaitMs({ attempts: 4, delayMs: 0 })   → 0
//
//  tsc is perfectly happy. Two tests are not. One line in this file
//  disagrees with the paragraph above; find it, change as little as
//  possible, and leave everything else where it is.

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export interface RetryOptions {
  attempts?: number;
  delayMs?: number;
  label?: string;
  jitter?: boolean;
}

export interface Retry {
  attempts: number;
  delayMs: number;
  label: string;
  jitter: boolean;
}

export function resolveRetry(options: RetryOptions = {}): Retry {
  return {
    attempts: options.attempts ?? 3,
    delayMs: options.delayMs || 250,
    label: options.label ?? 'retry',
    jitter: options.jitter ?? true,
  };
}

export function totalWaitMs(options: RetryOptions = {}): number {
  const retry = resolveRetry(options);
  return retry.attempts * retry.delayMs;
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('no options at all gets the full set of defaults', () => {
  eq(resolveRetry(), {
    attempts: 3,
    delayMs: 250,
    label: 'retry',
    jitter: true,
  });
});

test('every option, when given, beats its default', () => {
  eq(resolveRetry({ attempts: 5, delayMs: 10, label: 'sync', jitter: false }), {
    attempts: 5,
    delayMs: 10,
    label: 'sync',
    jitter: false,
  });
});

test('an empty label is a deliberately empty label', () => {
  eq(resolveRetry({ label: '' }).label, '');
});

test('jitter:false stays off', () => {
  eq(resolveRetry({ jitter: false }).jitter, false);
});

test('a delay of zero means retry immediately', () => {
  eq(resolveRetry({ delayMs: 0 }).delayMs, 0);
});

test('four immediate attempts wait no time at all', () => {
  eq(totalWaitMs({ attempts: 4, delayMs: 0 }), 0);
});

// ──────────────────────────── type tests ─────────────────────────────────
//
//  These already pass — in the broken file and in the fixed one. That is
//  the whole point of the module: the type layer is satisfied either way.

type _t1 = Expect<Equal<ReturnType<typeof resolveRetry>, Retry>>;
type _t2 = Expect<Equal<Retry['delayMs'], number>>;

function _typeTests() {
  const r: Retry = resolveRetry({ delayMs: 0 });
  use(r);

  // @ts-expect-error — 'attempt' is not one of the options
  resolveRetry({ attempt: 1 });

  // @ts-expect-error — a delay is a number of milliseconds
  resolveRetry({ delayMs: '0' });
}
use(_typeTests);
