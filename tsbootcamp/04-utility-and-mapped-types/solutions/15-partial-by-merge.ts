// ─────────────────────────────────────────────────────────────────────────
//  15 · PartialBy, Nullable and Merge — SOLUTION            ★★★ stretch
//  run: node ../run.js solutions/15-partial-by-merge.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: split the keys, treat the halves differently, intersect.
//
//      PartialBy<T, K>  = Omit<T, K> & Partial<Pick<T, K>>;
//      RequiredBy<T, K> = Omit<T, K> & Required<Pick<T, K>>;
//
//  `Pick` grabs the keys you are changing, `Omit` grabs the rest untouched,
//  `&` staples them back together. No new machinery — this is the payoff
//  for knowing the four one-liners cold.
//
//  Intersections read badly in tooltips and, more importantly, are not
//  IDENTICAL to the flat object even when they behave the same, so the
//  Equal assertions need Flatten (`Prettify` in most codebases). It is a
//  no-op mapped type whose only job is to force tsc to resolve the members.
//
//  Merge is the honest one. The instinct is `A & B`, and for disjoint keys
//  it is fine. For an overlapping key it produces `A[K] & B[K]`:
//  `{ a: number } & { a: string }` has `a: never`, so the merged object has
//  a property nothing can be assigned to (_t7) — a bug that surfaces three
//  files away. `Flatten<Omit<A, keyof B> & B>` says what a spread actually
//  does: drop A's version of any key B also has, then take all of B.
//
//  Note `Omit<A, keyof B>` is the standard-library Omit, whose loose
//  `K extends keyof any` constraint is exactly what you want here — keyof B
//  will contain keys A has never heard of.
//
//  Nullable is a plain homomorphic loop, so `b?: number` stays optional and
//  becomes `number | null | undefined`. Optional and nullable are different
//  claims; this type only makes the second one.

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

// given: collapses an intersection into a single object type
export type Flatten<T> = { [K in keyof T]: T[K] };

export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredBy<T, K extends keyof T> = Omit<T, K> &
  Required<Pick<T, K>>;
export type Nullable<T> = { [K in keyof T]: T[K] | null };
export type Merge<A, B> = Flatten<Omit<A, keyof B> & B>;

export interface Post {
  id: string;
  title: string;
  body: string;
  createdAt: string;
}

export type NewPost = PartialBy<Post, 'id' | 'createdAt'>;

export function createPost(input: NewPost): Post {
  return {
    id: input.id ?? 'draft',
    title: input.title,
    body: input.body,
    createdAt: input.createdAt ?? '1970-01-01',
  };
}

export function merge<A extends object, B extends object>(
  a: A,
  b: B
): Merge<A, B> {
  return { ...a, ...b } as Merge<A, B>;
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('createPost fills in the server-owned fields', () => {
  eq(createPost({ title: 'Hi', body: 'there' }), {
    id: 'draft',
    title: 'Hi',
    body: 'there',
    createdAt: '1970-01-01',
  });
});

test('createPost keeps the fields that were supplied', () => {
  eq(createPost({ id: 'p9', title: 'Hi', body: 'b', createdAt: '2026-01-01' }), {
    id: 'p9',
    title: 'Hi',
    body: 'b',
    createdAt: '2026-01-01',
  });
});

test('merge lets the right-hand object win', () => {
  eq(merge({ role: 'user', id: 1 }, { role: 'admin' }), {
    role: 'admin',
    id: 1,
  });
});

test('merge does not mutate either input', () => {
  const left = { a: 1 };
  const right = { b: 2 };
  merge(left, right);
  eq(left, { a: 1 });
  eq(right, { b: 2 });
});

// ──────────────────────────── type tests ─────────────────────────────────

type _t1 = Expect<
  Equal<
    Flatten<NewPost>,
    { title: string; body: string; id?: string; createdAt?: string }
  >
>;
type _t2 = Expect<
  Equal<
    Flatten<RequiredBy<{ a?: string; b?: number }, 'a'>>,
    { b?: number; a: string }
  >
>;
type _t3 = Expect<
  Equal<Nullable<{ a: string; b?: number }>, { a: string | null; b?: number | null }>
>;
type _t4 = Expect<
  Equal<
    Merge<{ id: string; role: string }, { role: 'admin'; extra: boolean }>,
    { id: string; role: 'admin'; extra: boolean }
  >
>;
// nothing in common? Merge is just both sides
type _t5 = Expect<Equal<Merge<{ a: 1 }, { b: 2 }>, { a: 1; b: 2 }>>;
// B wins outright — even the type, not a union or an intersection
type _t6 = Expect<Equal<Merge<{ a: number }, { a: string }>, { a: string }>>;
// ...which is why plain `A & B` is the wrong tool
type _t7 = Expect<Equal<Flatten<{ a: number } & { a: string }>, { a: never }>>;

function _typeTests() {
  createPost({ title: 'Hi', body: 'b' });
  createPost({ title: 'Hi', body: 'b', id: 'p1' });

  const post: Post = createPost({ title: 'Hi', body: 'b' });
  use(post);

  // @ts-expect-error — title is NOT one of the optional keys
  createPost({ body: 'b' });

  // @ts-expect-error — a nullable field is not optional; it must be there
  const gap: Nullable<{ a: string }> = {};
  use(gap);

  const merged = merge({ id: 1 }, { id: 'one', extra: true });
  const id: string = merged.id;
  use(id);

  // @ts-expect-error — the right-hand id replaced the number
  const stale: number = merge({ id: 1 }, { id: 'one' }).id;
  use(stale);
}
use(_typeTests);
