// ─────────────────────────────────────────────────────────────────────────
//  13 · tsc error triage — SOLUTION                         ★★☆ core
//  run: node ../run.js solutions/13-tsc-error-triage.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: error → cause → the ten-second fix path.
//
//  1 · TS18048 'found' is possibly 'undefined'
//      cause: `Array.prototype.find` returns `T | undefined`, always.
//      fix:   decide what "missing" means, in one line — a guard that
//             throws, or `?? fallback`. Never `!`; that is a promise you
//             have not checked, and it is the same bug with the alarm off.
//
//  2 · TS2345 Argument of type 'string' is not assignable to 'number'
//      cause: two types that both "look like a price". The boundary is
//             text; the function wants a number.
//      fix:   convert AT the boundary — `Number(cents)` — not by loosening
//             the callee. Read the error backwards: the parameter is the
//             contract, the argument is what broke it.
//
//  3 · TS2339 Property 'radius' does not exist on type 'Shape'
//      cause: a union member that lacks the property. The second line of
//             the error names the guilty member — read it, it saves you
//             the hunt.
//      fix:   narrow on the discriminant before you touch the payload.
//
//  4 · TS7053 Element implicitly has an 'any' type…
//      cause: indexing an object type with a plain `string`. tsc cannot
//             know the key exists, so the result would be `any`.
//      fix:   make the key type honest: `keyof typeof LEVELS`. Reach for
//             an index signature only if arbitrary keys are truly legal —
//             that changes the API, and it is what the type test forbids.
//
//  5 · TS18046 'e' is of type 'unknown'
//      cause: catch bindings are `unknown` under strict, because JS can
//             throw anything.
//      fix:   narrow once, at the top of the catch — `instanceof Error`,
//             else `String(e)`.
//
//  6 · TS2322 Type 'string' is not assignable to type 'Level'
//      cause: a function's return position widens 'info' to string, and
//             string is wider than the union.
//      fix:   annotate the return type (best — it documents the function),
//             or `as const` on the literal. Note the error is reported at
//             the ASSIGNMENT, while the cause is in the function above it:
//             tsc reports where the mismatch is detected, not where the
//             mistake was made. That gap is most of the skill.

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export const USERS = [
  { id: 'u1', name: 'Ada' },
  { id: 'u2', name: 'Bo' },
];

// ── 1 ────────────────────────────────────────────────────────────────────

export function nameOf(id: string): string {
  const found = USERS.find((u) => u.id === id);
  if (!found) throw new Error(`no such user: ${id}`);
  return found.name;
}

// ── 2 ────────────────────────────────────────────────────────────────────

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function priceLabel(cents: string): string {
  return formatCents(Number(cents));
}

// ── 3 ────────────────────────────────────────────────────────────────────

export type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'square'; side: number };

export function widthOf(shape: Shape): number {
  return shape.kind === 'circle' ? shape.radius * 2 : shape.side;
}

// ── 4 ────────────────────────────────────────────────────────────────────

const LEVELS = { debug: 10, info: 20, warn: 30 };

export function levelValue(name: keyof typeof LEVELS): number {
  return LEVELS[name];
}

// ── 5 ────────────────────────────────────────────────────────────────────

export function messageOf(fn: () => void): string {
  try {
    fn();
    return 'ok';
  } catch (e) {
    return e instanceof Error ? e.message : String(e);
  }
}

// ── 6 ────────────────────────────────────────────────────────────────────

export type Level = 'debug' | 'info' | 'warn';

function pickLevel(): Level {
  return 'info';
}

export const DEFAULT_LEVEL: Level = pickLevel();

// ─────────────────────────── runtime tests ───────────────────────────────

test('1 · nameOf finds a user by id', () => {
  eq(nameOf('u1'), 'Ada');
  eq(nameOf('u2'), 'Bo');
});

test('2 · priceLabel formats cents that arrived as text', () => {
  eq(priceLabel('1999'), '$19.99');
});

test('3 · widthOf doubles a radius', () => {
  eq(widthOf({ kind: 'circle', radius: 3 }), 6);
});

test('4 · levelValue reads the table', () => {
  eq(levelValue('info'), 20);
  eq(levelValue('debug'), 10);
});

test('5 · messageOf reports what was thrown', () => {
  eq(messageOf(() => {}), 'ok');
  eq(
    messageOf(() => {
      throw new Error('boom');
    }),
    'boom'
  );
});

test('6 · the default level is info', () => {
  eq(DEFAULT_LEVEL, 'info');
});

// ──────────────────────────── type tests ─────────────────────────────────

type _t1 = Expect<Equal<ReturnType<typeof nameOf>, string>>;
type _t2 = Expect<Equal<Parameters<typeof priceLabel>[0], string>>;
type _t3 = Expect<Equal<ReturnType<typeof widthOf>, number>>;
type _t4 = Expect<
  Equal<Parameters<typeof levelValue>[0], 'debug' | 'info' | 'warn'>
>;
type _t5 = Expect<Equal<ReturnType<typeof messageOf>, string>>;

function _typeTests() {
  // @ts-expect-error — 'trace' is not in the level table
  levelValue('trace');

  // @ts-expect-error — a shape without its payload is not a Shape
  widthOf({ kind: 'circle' });

  const level: Level = DEFAULT_LEVEL;
  use(level);
}
use(_typeTests);
