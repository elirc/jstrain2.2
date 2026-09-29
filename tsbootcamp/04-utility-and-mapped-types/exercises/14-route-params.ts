// ─────────────────────────────────────────────────────────────────────────
//  14 · route params from the path                          ★★★ stretch
//  concepts: infer in template literals · recursive conditional types
//  run: node ../run.js exercises/14-route-params.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Every router does this trick, and it is less magic than it looks: read
//  the `:name` segments straight out of the route string.
//
//      Params<'/users/:id/posts/:postId'>   →  'id' | 'postId'
//      Params<'/health'>                    →  never
//
//      extractParams('/users/:id', '/users/7').id    → '7'   (string)
//      extractParams('/users/:id', '/users/7').slug  → compile error
//
//  Two pattern matches, in this order: find a ':' and capture everything
//  after it, then split that tail at the first '/' — the head is one param
//  name, the tail is the rest of the route to recurse on. If there is no
//  '/' left, the whole tail is the last param.
//
//  ParamMap turns that union into the object extractParams returns.
//
//  hint: `P extends \`${string}:${infer Rest}\`` matches at the FIRST
//  colon, because tsc infers the shortest match for a leading placeholder

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

export type Params<P extends string> = TODO;
export type ParamMap<P extends string> = TODO;

export function extractParams<P extends string>(
  pattern: P,
  path: string
): ParamMap<P> {
  throw new Error('TODO');
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
