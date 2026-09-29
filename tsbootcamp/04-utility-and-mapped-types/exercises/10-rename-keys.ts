// ─────────────────────────────────────────────────────────────────────────
//  10 · RemovePrefix and RenameKeys                         ★★★ stretch
//  concepts: `as` clauses · infer inside template literals · key mapping
//  run: node ../run.js exercises/10-rename-keys.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Adapters between two naming conventions are half of integration work.
//  Both directions are one mapped type with an `as` clause.
//
//      RemovePrefix<{ data_id: number; other: boolean }, 'data_'>
//        →  { id: number; other: boolean }        // no prefix? left alone
//
//      RenameKeys<{ user_id: number; title: string },
//                 { user_id: 'userId' }>
//        →  { userId: number; title: string }     // not listed? left alone
//
//  RemovePrefix needs `infer` INSIDE a template literal pattern to grab
//  the tail of a key. RenameKeys needs a lookup into the mapping type,
//  with a fallback for the keys the mapping does not mention.
//
//  Then stripPrefix does the same job on real objects.
//
//  hint: `K extends \`${P}${infer Rest}\` ? Rest : K` is the whole first
//  one. For the second, remember M[K] can be `string | undefined`

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

export type RemovePrefix<T, P extends string> = TODO;
export type RenameKeys<T, M extends Partial<Record<keyof T, string>>> = TODO;

export interface DbRow {
  user_id: number;
  created_at: string;
  title: string;
}

export function stripPrefix<T extends object, P extends string>(
  obj: T,
  prefix: P
): RemovePrefix<T, P> {
  throw new Error('TODO');
}

// ─────────────────────────── runtime tests ───────────────────────────────

const raw = { data_id: 1, data_name: 'widget', other: true };

test('strips the prefix where it is present', () => {
  eq(stripPrefix(raw, 'data_'), { id: 1, name: 'widget', other: true });
});

test('leaves keys without the prefix alone', () => {
  eq(stripPrefix({ other: true }, 'data_'), { other: true });
});

test('an empty prefix changes nothing', () => {
  eq(stripPrefix(raw, ''), raw);
});

test('does not mutate the source', () => {
  stripPrefix(raw, 'data_');
  eq(raw.data_id, 1);
});

// ──────────────────────────── type tests ─────────────────────────────────

type _t1 = Expect<
  Equal<
    RemovePrefix<{ data_id: number; data_name: string; other: boolean }, 'data_'>,
    { id: number; name: string; other: boolean }
  >
>;
type _t2 = Expect<
  Equal<RemovePrefix<{ ab: number }, 'zz'>, { ab: number }>
>;
type _t3 = Expect<
  Equal<
    RenameKeys<DbRow, { user_id: 'userId'; created_at: 'createdAt' }>,
    { userId: number; createdAt: string; title: string }
  >
>;
// an empty mapping is the identity
type _t4 = Expect<
  Equal<RenameKeys<DbRow, {}>, { [K in keyof DbRow]: DbRow[K] }>
>;
// two keys renamed onto one target collapse into ONE property whose type
// is the union of both — no warning
type _t5 = Expect<
  Equal<
    RenameKeys<{ a: string; b: number }, { a: 'x'; b: 'x' }>,
    { x: string | number }
  >
>;
// @ts-expect-error — the mapping's values must be key strings
type _bad = RenameKeys<DbRow, { user_id: 42 }>;

function _typeTests() {
  const clean = stripPrefix({ data_id: 1 }, 'data_');
  const id: number = clean.id;
  use(id);

  // @ts-expect-error — the prefixed key is gone from the result
  clean.data_id;

  type Camel = RenameKeys<DbRow, { user_id: 'userId' }>;
  const camel: Camel = { userId: 1, created_at: 'now', title: 't' };
  use(camel);

  // @ts-expect-error — user_id was renamed away
  const stale: Camel = { user_id: 1, created_at: 'now', title: 't' };
  use(stale);
}
use(_typeTests);
