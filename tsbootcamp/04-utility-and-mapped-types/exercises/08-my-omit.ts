// ─────────────────────────────────────────────────────────────────────────
//  08 · MyOmit                                              ★★★ stretch
//  concepts: keyof exclusion · composing utility types
//  run: node ../run.js exercises/08-my-omit.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Omit is the one people assume is primitive. It is not — it is Pick with
//  the key union filtered first:
//
//      MyOmit<{ a: string; b: number }, 'b'>   →  { a: string }
//
//  Work out the key union you want (`keyof T` minus K), then reuse the
//  tool that turns a key union into an object. `Exclude<A, B>` is fair
//  game as a builtin here — module 05 makes you build it out of a
//  conditional type.
//
//  Make yours STRICTER than the standard library's: `Omit<T, K>` accepts
//  any key at all (`K extends keyof any`), so a typo silently omits
//  nothing. Yours should reject a key that is not in T.
//
//  hint: Pick<T, ???> — and the ??? is one Exclude away

import { test, eq, ok } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

export type MyOmit<T, K extends TODO> = TODO;

export interface Row {
  readonly id: string;
  name: string;
  secret?: string;
  active: boolean;
}

export function omitFields<T extends object, K extends keyof T>(
  obj: T,
  keys: readonly K[]
): MyOmit<T, K> {
  throw new Error('TODO');
}

// ─────────────────────────── runtime tests ───────────────────────────────

const row: Row = { id: 'r1', name: 'Ada', secret: 's', active: true };

test('drops the named keys', () => {
  eq(omitFields(row, ['secret', 'active']), { id: 'r1', name: 'Ada' });
});

test('omitting nothing copies the object', () => {
  eq(omitFields(row, []), { id: 'r1', name: 'Ada', secret: 's', active: true });
});

test('really deletes the key, does not just blank it', () => {
  const kept = omitFields(row, ['secret']) as Record<string, unknown>;
  ok(!('secret' in kept));
});

test('does not mutate the source', () => {
  omitFields(row, ['secret']);
  eq(row.secret, 's');
});

// ──────────────────────────── type tests ─────────────────────────────────

type _t1 = Expect<
  Equal<MyOmit<Row, 'secret' | 'active'>, { readonly id: string; name: string }>
>;
type _t2 = Expect<Equal<MyOmit<Row, 'id'>, Omit<Row, 'id'>>>;
type _t3 = Expect<Equal<keyof MyOmit<Row, 'id'>, 'name' | 'secret' | 'active'>>;
type _t4 = Expect<Equal<MyOmit<Row, never>, { [K in keyof Row]: Row[K] }>>;
// the standard library's Omit shrugs at a key that is not there...
type _t5 = Expect<Equal<Omit<{ a: string }, 'typo'>, { a: string }>>;
// @ts-expect-error — ...and yours must not
type _bad = MyOmit<{ a: string }, 'typo'>;

function _typeTests() {
  const kept = omitFields(row, ['secret']);
  const name: string = kept.name;
  use(name);

  // @ts-expect-error — the omitted key is gone from the type
  kept.secret;

  // @ts-expect-error — you cannot omit a key the object does not have
  omitFields(row, ['typo']);
}
use(_typeTests);
