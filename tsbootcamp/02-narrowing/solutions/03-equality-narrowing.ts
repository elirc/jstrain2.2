// ─────────────────────────────────────────────────────────────────────────
//  03 · statusColor — SOLUTION                            ★☆☆ warm-up
//  run: node ../run.js solutions/03-equality-narrowing.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: each `===` removes one member from the union, so by the
//  last line `status` is `'failed'` and no check is needed. The payoff is
//  in the type tests: inside `if (status === 'done')` the type is the
//  single literal `'done'`, and in the else branch it is the other three.
//
//  `describeMissing` is the reason `null` and `undefined` are separate
//  types in TypeScript: `=== null` and `=== undefined` narrow to exactly
//  one of them. When you do NOT care which, `value == null` (loose) tests
//  both at once — the one place loose equality is idiomatic.
//
//  Bonus: comparing a literal union to a value that is not in it is an
//  error (TS2367), not a silently-false expression. Typos get caught.

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

function probe<T>(value: T): T {
  return value;
}

export type Status = 'idle' | 'loading' | 'done' | 'failed';

export function statusColor(status: Status): string {
  if (status === 'idle') return 'gray';
  if (status === 'loading') return 'blue';
  if (status === 'done') return 'green';
  return 'red';
}

export function describeMissing(value: string | null | undefined): string {
  if (value === null) return 'explicitly null';
  if (value === undefined) return 'not provided';
  return `value: ${value}`;
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
