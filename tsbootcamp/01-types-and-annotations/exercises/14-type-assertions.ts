// ─────────────────────────────────────────────────────────────────────────
//  14 · type assertions                                     ★★☆ core
//  concepts: as · non-null ! · as const
//  run: node ../run.js exercises/14-type-assertions.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  An assertion changes what the COMPILER believes; it never changes the
//  value and never checks anything at runtime. Three forms, three honest
//  uses:
//
//      value as T   "I know more than you do about where this came from"
//      value!       "this is not null/undefined here"
//      value as const  "treat this literal as literal, and readonly"
//
//      parseUser('{"id":1,"name":"Ada"}')  → { id: 1, name: 'Ada' }
//      requiredFlag(flags, 'beta')         → true    Map.get is optional
//      ORIGINS                             → readonly, literal-typed
//
//  parseUser already hands you `raw: unknown` — JSON.parse cannot know
//  the shape, and the assertion is where you take responsibility for it.
//
//  hint: none of these is a conversion. `'5' as number` is rejected
//  precisely because the compiler knows it would be a lie

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

export type ApiUser = TODO;

export function parseUser(json: string): ApiUser {
  const raw: unknown = JSON.parse(json);
  use(raw);
  throw new Error('TODO');
}

export function requiredFlag(flags: Map<string, boolean>, key: TODO): boolean {
  throw new Error('TODO');
}

// TODO: freeze these origins with `as const`
export const ORIGINS = ['https://app.io', 'https://admin.io'];

export type Origin = TODO;

// ─────────────────────────── runtime tests ───────────────────────────────

test('parseUser returns the parsed object', () => {
  eq(parseUser('{"id":1,"name":"Ada"}'), { id: 1, name: 'Ada' });
});

test('requiredFlag reads a flag that is present', () => {
  const flags = new Map([
    ['beta', true],
    ['dark', false],
  ]);
  eq(requiredFlag(flags, 'beta'), true);
  eq(requiredFlag(flags, 'dark'), false);
});

test('requiredFlag on a missing key returns undefined at runtime', () => {
  // the `!` promised the compiler this could not happen — it lied
  const missing: unknown = requiredFlag(new Map(), 'nope');
  eq(missing, undefined);
});

test('ORIGINS still behaves like a plain array', () => {
  eq(ORIGINS.length, 2);
  eq(ORIGINS[0], 'https://app.io');
});

// ──────────────────────────── type tests ─────────────────────────────────

type _1 = Expect<Equal<ApiUser, { id: number; name: string }>>;
type _2 = Expect<
  Equal<typeof ORIGINS, readonly ['https://app.io', 'https://admin.io']>
>;
type _3 = Expect<Equal<Origin, 'https://app.io' | 'https://admin.io'>>;
type _4 = Expect<Equal<ReturnType<typeof requiredFlag>, boolean>>;

function _typeTests() {
  const parsed = parseUser('{}');
  const id: number = parsed.id;
  use(id);

  // @ts-expect-error — the assertion promised ApiUser, which has no `role`
  parsed.role;

  // @ts-expect-error — `as` re-labels related types; it cannot convert
  const converted = '5' as number;
  use(converted);

  // @ts-expect-error — `as const` made the array readonly
  ORIGINS.push('https://evil.io');

  const first: Origin = ORIGINS[0];
  use(first);
}
use(_typeTests);
