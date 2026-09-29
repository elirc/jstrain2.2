// ─────────────────────────────────────────────────────────────────────────
//  15 · PartialBy, Nullable and Merge                       ★★★ stretch
//  concepts: composing utilities · intersections · Prettify
//  run: node ../run.js exercises/15-partial-by-merge.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  `Partial<T>` is all-or-nothing. Real APIs want "everything required
//  except these two, which the server fills in":
//
//      PartialBy<Post, 'id' | 'createdAt'>
//        →  { title: string; body: string; id?: string; createdAt?: string }
//      RequiredBy<{ a?: 1; b?: 2 }, 'a'>   →  { a: 1; b?: 2 }
//      Nullable<{ a: string }>             →  { a: string | null }
//
//  Build the first three by COMPOSING what you already have — split the
//  keys, treat the halves differently, intersect. Nullable is a plain
//  mapped type.
//
//  Then Merge<A, B>: B wins on any key both objects have. `A & B` is the
//  first thing everyone writes and it is wrong — an overlapping key
//  becomes `A[K] & B[K]`, and `string & number` is `never` (_t7). Subtract
//  the overlap from A first.
//
//  Flatten below is given: mapping over an intersection collapses it into
//  one readable object type. Library code usually calls it Prettify.
//
//  hint: Omit<T, K> & Partial<Pick<T, K>> — and wrap it in Flatten so the
//  Equal assertions see one object instead of an intersection

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

// given: collapses an intersection into a single object type
export type Flatten<T> = { [K in keyof T]: T[K] };

export type PartialBy<T, K extends keyof T> = TODO;
export type RequiredBy<T, K extends keyof T> = TODO;
export type Nullable<T> = TODO;
export type Merge<A, B> = TODO;

export interface Post {
  id: string;
  title: string;
  body: string;
  createdAt: string;
}

export type NewPost = PartialBy<Post, 'id' | 'createdAt'>;

export function createPost(input: NewPost): Post {
  throw new Error('TODO');
}

export function merge<A extends object, B extends object>(
  a: A,
  b: B
): Merge<A, B> {
  throw new Error('TODO');
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
