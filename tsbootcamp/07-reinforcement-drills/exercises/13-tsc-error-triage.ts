// ─────────────────────────────────────────────────────────────────────────
//  13 · tsc error triage                                    ★★☆ core
//  concepts: reading compiler errors fast
//  run: node ../run.js exercises/13-tsc-error-triage.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  cold rep — everything so far.
//
//  Six snippets, six real tsc errors, pasted above the code that caused
//  them. Read the error, name the cause, fix the code. The skill being
//  drilled is speed: aim for under a minute each, and do not rewrite more
//  than the error asks for.
//
//  Rules: `any` is not a fix, and neither is `!`. The runtime behaviour is
//  already correct and pinned by the tests — all six pass from the first
//  run. tsc is the whole todo list.

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export const USERS = [
  { id: 'u1', name: 'Ada' },
  { id: 'u2', name: 'Bo' },
];

// ── 1 ────────────────────────────────────────────────────────────────────
// 13-tsc-error-triage.ts(31,10): error TS18048: 'found' is possibly 'undefined'.

export function nameOf(id: string): string {
  const found = USERS.find((u) => u.id === id);
  return found.name;
}

// ── 2 ────────────────────────────────────────────────────────────────────
// 13-tsc-error-triage.ts(42,22): error TS2345: Argument of type 'string' is not assignable to parameter of type 'number'.

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function priceLabel(cents: string): string {
  return formatCents(cents);
}

// ── 3 ────────────────────────────────────────────────────────────────────
// 13-tsc-error-triage.ts(54,16): error TS2339: Property 'radius' does not exist on type 'Shape'.
//   Property 'radius' does not exist on type '{ kind: "square"; side: number; }'.

export type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'square'; side: number };

export function widthOf(shape: Shape): number {
  return shape.radius * 2;
}

// ── 4 ────────────────────────────────────────────────────────────────────
// 13-tsc-error-triage.ts(64,10): error TS7053: Element implicitly has an 'any' type because expression of type 'string' can't be used to index type '{ debug: number; info: number; warn: number; }'.
//   No index signature with a parameter of type 'string' was found on type '{ debug: number; info: number; warn: number; }'.

const LEVELS = { debug: 10, info: 20, warn: 30 };

export function levelValue(name: string): number {
  return LEVELS[name];
}

// ── 5 ────────────────────────────────────────────────────────────────────
// 13-tsc-error-triage.ts(75,12): error TS18046: 'e' is of type 'unknown'.

export function messageOf(fn: () => void): string {
  try {
    fn();
    return 'ok';
  } catch (e) {
    return e.message;
  }
}

// ── 6 ────────────────────────────────────────────────────────────────────
// 13-tsc-error-triage.ts(88,14): error TS2322: Type 'string' is not assignable to type 'Level'.

export type Level = 'debug' | 'info' | 'warn';

function pickLevel() {
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
