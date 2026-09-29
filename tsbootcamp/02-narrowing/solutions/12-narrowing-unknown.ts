// ─────────────────────────────────────────────────────────────────────────
//  12 · parseUser — SOLUTION                              ★★★ stretch
//  run: node ../run.js solutions/12-narrowing-unknown.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `unknown` is `any` with the safety left on. Both accept
//  anything; only `unknown` refuses to be USED until it is narrowed. So
//  the boundary function returns `unknown` and every caller is forced
//  through the guard — that is "parse, don't validate": the check and the
//  type change happen in the same step, and after it you hold a `User`,
//  not a `User` you are hoping about.
//
//  Three details in `isUser` that bite:
//
//  • `typeof value === 'object'` is true for `null`. The `value !== null`
//    half is not optional, it is the entire point.
//  • `value as Record<string, unknown>` is the one cast worth writing:
//    it lets you read members, and every member you read is still
//    `unknown`, so the typeof checks stay honest.
//  • Optional members need `x === undefined || typeof x === 'string'`.
//    Testing only `typeof x === 'string'` makes `email` required.
//
//  `parseUser` is the shape to copy at every boundary: parse into
//  `unknown`, guard, return the typed value or a null you can handle.

import { test, eq, ok } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

function probe<T>(value: T): T {
  return value;
}

export interface User {
  id: number;
  name: string;
  email?: string;
}

export function safeParseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

export function isUser(value: unknown): value is User {
  if (typeof value !== 'object' || value === null) return false;

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.id === 'number' &&
    typeof candidate.name === 'string' &&
    (candidate.email === undefined || typeof candidate.email === 'string')
  );
}

export function parseUser(text: string): User | null {
  const value = safeParseJson(text);
  return isUser(value) ? value : null;
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('parses valid JSON', () => {
  eq(safeParseJson('{"a":1}'), { a: 1 });
});

test('returns undefined instead of throwing on bad JSON', () => {
  eq(safeParseJson('not json'), undefined);
});

test('isUser accepts the minimum shape', () => {
  ok(isUser({ id: 1, name: 'Ada' }), 'id + name is enough');
  ok(isUser({ id: 1, name: 'Ada', email: 'a@b.c' }), 'email may be present');
});

test('isUser rejects null — typeof null is "object"', () => {
  ok(!isUser(null), 'null is not a user');
  ok(!isUser('Ada'), 'a string is not a user');
});

test('isUser checks member types, not just member names', () => {
  ok(!isUser({ id: '1', name: 'Ada' }), 'id must be a number');
  ok(!isUser({ id: 1 }), 'name is required');
  ok(!isUser({ id: 1, name: 'Ada', email: 42 }), 'email must be a string');
});

test('parseUser goes from text to a typed value or null', () => {
  eq(parseUser('{"id":7,"name":"Ada"}'), { id: 7, name: 'Ada' });
  eq(parseUser('{"id":"7"}'), null);
  eq(parseUser('not json'), null);
});

// ──────────────────────────── type tests ─────────────────────────────────

type _r1 = Expect<Equal<ReturnType<typeof safeParseJson>, unknown>>;

function _typeTests() {
  const value = safeParseJson('{}');

  // @ts-expect-error — unknown gives you nothing until you narrow it
  value.name;

  if (isUser(value)) {
    const p = probe(value);
    type _user = Expect<Equal<typeof p, User>>;
    const name: string = value.name;
    use(p, name);
  }

  // @ts-expect-error — a guard returns a boolean, not the value itself
  const u: User = isUser(value);
  use(u);
}
use(_typeTests);
