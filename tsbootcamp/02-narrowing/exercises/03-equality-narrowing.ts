// ─────────────────────────────────────────────────────────────────────────
//  03 · statusColor                                       ★☆☆ warm-up
//  concepts: equality narrowing · literal unions · null vs undefined
//  run: node ../run.js exercises/03-equality-narrowing.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  `===` against a literal narrows a union down to that one member. And
//  because `null` and `undefined` are separate types, `===` can tell them
//  apart — which matters when "we stored nothing" and "nobody asked"
//  should read differently.
//
//      statusColor('loading')      → 'blue'
//      statusColor('failed')       → 'red'
//
//      describeMissing(null)       → 'explicitly null'
//      describeMissing(undefined)  → 'not provided'
//      describeMissing('ok')       → 'value: ok'

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

function probe<T>(value: T): T {
  return value;
}

export type Status = 'idle' | 'loading' | 'done' | 'failed';

export function statusColor(status: TODO): string {
  throw new Error('TODO');
}

export function describeMissing(value: TODO): string {
  throw new Error('TODO');
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('maps every status to its colour', () => {
  eq(statusColor('idle'), 'gray');
  eq(statusColor('loading'), 'blue');
});

test('done is green and failed is red', () => {
  eq(statusColor('done'), 'green');
  eq(statusColor('failed'), 'red');
});

test('null and undefined get different words', () => {
  eq(describeMissing(null), 'explicitly null');
  eq(describeMissing(undefined), 'not provided');
});

test('a real string is echoed back', () => {
  eq(describeMissing('ok'), 'value: ok');
});

test('the empty string is a value, not a hole', () => {
  eq(describeMissing(''), 'value: ');
});

// ──────────────────────────── type tests ─────────────────────────────────

type _r1 = Expect<Equal<Parameters<typeof statusColor>[0], Status>>;
type _r2 = Expect<
  Equal<Parameters<typeof describeMissing>[0], string | null | undefined>
>;

function _typeTests() {
  const status = '' as unknown as Parameters<typeof statusColor>[0];

  if (status === 'done') {
    const p = probe(status);
    type _hit = Expect<Equal<typeof p, 'done'>>;
    use(p);
  } else {
    const p = probe(status);
    type _rest = Expect<Equal<typeof p, 'idle' | 'loading' | 'failed'>>;
    use(p);
  }

  const value = '' as unknown as Parameters<typeof describeMissing>[0];

  if (value === null) {
    const p = probe(value);
    type _null = Expect<Equal<typeof p, null>>;
    use(p);
  } else if (value === undefined) {
    const p = probe(value);
    type _undef = Expect<Equal<typeof p, undefined>>;
    use(p);
  } else {
    const p = probe(value);
    type _str = Expect<Equal<typeof p, string>>;
    use(p);
  }

  // @ts-expect-error — 'DONE' is not a Status, so this could never be true
  statusColor('DONE');
}
use(_typeTests);
