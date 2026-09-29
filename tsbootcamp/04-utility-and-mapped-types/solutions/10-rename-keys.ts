// ─────────────────────────────────────────────────────────────────────────
//  10 · RemovePrefix and RenameKeys — SOLUTION              ★★★ stretch
//  run: node ../run.js solutions/10-rename-keys.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: both types are one loop with a conditional in the `as`.
//
//      [K in keyof T as K extends `${P}${infer Rest}` ? Rest : K]
//
//  `infer Rest` inside a template literal pattern is pattern matching on a
//  string type: tsc lines the literal parts up and binds what is left. The
//  `: K` branch is not optional politeness — without a fallback the
//  unmatched keys map to `never` and vanish from the type, which is a
//  silently wrong adapter.
//
//  RenameKeys does a lookup instead of a match:
//
//      [K in keyof T as K extends keyof M
//        ? (M[K] extends string ? M[K] : K)
//        : K]
//
//  The inner conditional is there because M is `Partial<...>`, so `M[K]`
//  is `string | undefined` for a key the caller left out, and `undefined`
//  is not a legal key. Constraining M to `Partial<Record<keyof T, string>>`
//  is what lets you write `M[K]` at all — tsc has to know K indexes M.
//
//  Collisions are real (_t5): remap two keys onto one name and you get a
//  single property typed as the UNION of both values. Nothing warns you,
//  and downstream code now has to narrow a type it never asked for.
//
//  Runtime: `Object.entries` + rebuild. The cast on the way out is
//  unavoidable — a string computed at runtime carries no template type.

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export type RemovePrefix<T, P extends string> = {
  [K in keyof T as K extends `${P}${infer Rest}` ? Rest : K]: T[K];
};

export type RenameKeys<T, M extends Partial<Record<keyof T, string>>> = {
  [K in keyof T as K extends keyof M
    ? M[K] extends string
      ? M[K]
      : K
    : K]: T[K];
};

export interface DbRow {
  user_id: number;
  created_at: string;
  title: string;
}

export function stripPrefix<T extends object, P extends string>(
  obj: T,
  prefix: P
): RemovePrefix<T, P> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    out[key.startsWith(prefix) ? key.slice(prefix.length) : key] = value;
  }
  return out as RemovePrefix<T, P>;
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
