// ─────────────────────────────────────────────────────────────────────────
//  14 · type assertions — SOLUTION                          ★★☆ core
//  run: node ../run.js solutions/14-type-assertions.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: an assertion is a claim, not a check. Nothing runs; you
//  are telling the compiler to stop reasoning and trust you. So the only
//  good assertions are the ones where you genuinely know more:
//
//  · `raw as ApiUser` — JSON.parse returns unknown by construction. Some
//    human has to say what the payload is, and here that is you. The
//    honest version at a real boundary is a validator that CHECKS and
//    returns `ApiUser` (module 04's type guards); `as` is the shortcut
//    you take when the source is trusted, and it is a shortcut.
//  · `flags.get(key)!` — `Map.get` is typed `boolean | undefined`
//    because a key may be missing. The `!` says "not here it isn't". The
//    third runtime test shows what that promise is worth when it is
//    wrong: `undefined` sails straight through a `boolean` slot.
//  · `as const` — the one assertion that adds information instead of
//    discarding it: literals stay literal, the array becomes readonly,
//    and `(typeof ORIGINS)[number]` can derive the union.
//
//  `'5' as number` is rejected: `as` only moves between types that
//  overlap. When you truly need an unrelated type you have to go via
//  `as unknown as T` — which is the compiler asking you to make the lie
//  visible in the diff.

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export type ApiUser = {
  id: number;
  name: string;
};

export function parseUser(json: string): ApiUser {
  const raw: unknown = JSON.parse(json);
  return raw as ApiUser;
}

export function requiredFlag(
  flags: Map<string, boolean>,
  key: string
): boolean {
  return flags.get(key)!;
}

export const ORIGINS = ['https://app.io', 'https://admin.io'] as const;

export type Origin = (typeof ORIGINS)[number];

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
