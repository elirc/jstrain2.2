// ─────────────────────────────────────────────────────────────────────────
//  14 · route params from the path — SOLUTION               ★★★ stretch
//  run: node ../run.js solutions/14-route-params.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//
//      type Params<P extends string> = P extends `${string}:${infer Rest}`
//        ? Rest extends `${infer Name}/${infer Tail}`
//          ? Name | Params<Tail>
//          : Rest
//        : never;
//
//  Read it as a loop with two questions. "Is there a colon left?" — if not,
//  `never`, which is the identity element of `|` and so contributes
//  nothing to the union. "Is there a slash after the name?" — if yes, the
//  head is one param and the tail is a smaller route to recurse on; if no,
//  the rest of the string IS the last param name.
//
//  The inference rule that makes it work: in `${string}:${infer Rest}` the
//  leading placeholder matches as LITTLE as possible, so the split happens
//  at the FIRST colon and Rest is everything after it. Get that backwards
//  and '/users/:id/posts/:postId' would hand you just 'postId'.
//
//  `ParamMap<P> = Record<Params<P>, string>` costs one line and buys the
//  real ergonomics: `params.id` autocompletes, `params.slug` is a compile
//  error, and a route with no params is `Record<never, string>` — the
//  empty object, which is exactly right.
//
//  Runtime and type agree by construction but not by proof: tsc cannot
//  follow `part.slice(1)`, so there is one cast at the return. Everything
//  above it is ordinary string handling, and note the values stay strings
//  — silently `Number()`-ing an id is how '007' becomes 7.

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export type Params<P extends string> = P extends `${string}:${infer Rest}`
  ? Rest extends `${infer Name}/${infer Tail}`
    ? Name | Params<Tail>
    : Rest
  : never;

export type ParamMap<P extends string> = Record<Params<P>, string>;

export function extractParams<P extends string>(
  pattern: P,
  path: string
): ParamMap<P> {
  const out: Record<string, string> = {};
  const patternParts = pattern.split('/');
  const pathParts = path.split('/');
  patternParts.forEach((part, index) => {
    if (part.startsWith(':')) out[part.slice(1)] = pathParts[index] ?? '';
  });
  return out as ParamMap<P>;
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('pulls out one param', () => {
  eq(extractParams('/users/:id', '/users/7'), { id: '7' });
});

test('pulls out several params', () => {
  eq(extractParams('/users/:id/posts/:postId', '/users/7/posts/42'), {
    id: '7',
    postId: '42',
  });
});

test('a param in the middle of the route', () => {
  eq(extractParams('/a/:b/c', '/a/x/c'), { b: 'x' });
});

test('a route with no params yields an empty object', () => {
  eq(extractParams('/health', '/health'), {});
});

test('values stay strings — no number coercion', () => {
  eq(extractParams('/users/:id', '/users/007').id, '007');
});

// ──────────────────────────── type tests ─────────────────────────────────

type _t1 = Expect<Equal<Params<'/users/:id/posts/:postId'>, 'id' | 'postId'>>;
type _t2 = Expect<Equal<Params<'/users/:id'>, 'id'>>;
type _t3 = Expect<Equal<Params<'/health'>, never>>;
type _t4 = Expect<Equal<Params<'/a/:b/c'>, 'b'>>;
type _t5 = Expect<Equal<ParamMap<'/users/:id'>, { id: string }>>;
// no params, no keys — Record<never, string> is the empty object
type _t6 = Expect<Equal<ParamMap<'/health'>, {}>>;

function _typeTests() {
  const params = extractParams('/users/:id/posts/:postId', '/users/7/posts/1');
  const id: string = params.id;
  const postId: string = params.postId;
  use(id, postId);

  // @ts-expect-error — slug is not a param of this pattern
  params.slug;

  // @ts-expect-error — a route with no params has no keys to read
  extractParams('/health', '/health').id;

  // @ts-expect-error — the values are strings, not numbers
  const asNumber: number = extractParams('/users/:id', '/users/7').id;
  use(asNumber);
}
use(_typeTests);
