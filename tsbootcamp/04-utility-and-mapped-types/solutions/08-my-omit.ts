// ─────────────────────────────────────────────────────────────────────────
//  08 · MyOmit — SOLUTION                                   ★★★ stretch
//  run: node ../run.js solutions/08-my-omit.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `Pick<T, Exclude<keyof T, K>>` — three types you already
//  have, composed. Read it right to left: take T's key union, subtract the
//  keys to drop, rebuild the object from what is left. Because the work
//  happens on the KEY UNION and Pick is homomorphic, `readonly id` stays
//  readonly and `secret?` stays optional (_t1, _t3).
//
//  The `as`-clause spelling works too and is worth recognising:
//
//      type MyOmit<T, K extends keyof T> =
//        { [P in keyof T as P extends K ? never : P]: T[P] };
//
//  A key remapped to `never` is dropped from the result — that is the
//  trick exercise 11 leans on. Same answer, one less helper.
//
//  On the constraint: the real `Omit<T, K extends keyof any>` deliberately
//  accepts any key, so `Omit<User, 'passwrod'>` compiles and omits
//  nothing. Tightening it to `K extends keyof T` turns that typo into a
//  compile error, which is why several codebases ship their own StrictOmit.
//
//  Runtime: spread into a `Partial<T>` (every key optional, so `delete` is
//  legal — tsc refuses to delete a required property), delete, then one
//  cast on the way out because tsc cannot follow the loop.

import { test, eq, ok } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export type MyOmit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

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
  const out: Partial<T> = { ...obj };
  for (const key of keys) delete out[key];
  return out as MyOmit<T, K>;
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
