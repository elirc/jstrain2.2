// ─────────────────────────────────────────────────────────────────────────
//  03 · the default that ate a zero — SOLUTION             ★☆☆ warm-up
//  run: node ../run.js solutions/03-nullish-vs-or.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//
//  BUG CLASS — `||` used where `??` was meant: a falsy-but-valid value
//  treated as "not supplied".
//
//  THE TELL — the failing input is 0 and only 0. Everything else about
//  `delayMs` works. When a bug's whole domain is one value — 0, '',
//  false, NaN — you are looking at a truthiness test standing in for an
//  existence test.
//
//  Three of the four lines already use `??`, which makes the odd one out
//  a scan rather than a search. Reading a function for consistency of
//  SHAPE, before reading it for meaning, finds this class in seconds.
//
//  WHY TSC COULD NOT CATCH IT — `a || b` and `a ?? b` are both perfectly
//  typed here and produce the same type: `number | undefined` on the left,
//  `number` on the right, `number` out. The type system models what a
//  value can BE, never which values are meaningful in the domain. "0 is a
//  real delay, undefined is not" is a fact about retries, not about
//  numbers, and there is no annotation for it.
//
//  THE FIX — one operator. `??` falls back only for `null` and
//  `undefined`; `||` falls back for every falsy value, which is a much
//  bigger set than most option bags intend.
//
//  The rule worth carrying: use `??` for defaults, and use `||` only when
//  you genuinely mean "any falsy value counts as absent" — which for
//  numbers, strings and booleans is almost never.

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
    delayMs: options.delayMs ?? 250,
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
