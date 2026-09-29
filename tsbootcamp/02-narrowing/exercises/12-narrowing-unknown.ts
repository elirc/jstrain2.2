// ─────────────────────────────────────────────────────────────────────────
//  12 · parseUser                                         ★★★ stretch
//  concepts: unknown · parse don't validate · guards at the boundary
//  run: node ../run.js exercises/12-narrowing-unknown.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  `JSON.parse` is typed `any`, which is a lie the size of your whole API
//  boundary — `any` lets every downstream line compile and every one of
//  them break at runtime. Return `unknown` instead and the compiler
//  forces exactly one thing: check the shape before you use it.
//
//      safeParseJson('{"a":1}')          → { a: 1 }
//      safeParseJson('not json')         → undefined
//      isUser({ id: 1, name: 'Ada' })    → true
//      isUser(null)                      → false   typeof null is 'object'
//      isUser({ id: '1', name: 'Ada' })  → false   id must be a number
//      parseUser('{"id":7,"name":"Ada"}') → { id: 7, name: 'Ada' }
//      parseUser('{"id":"7"}')            → null
//
//  `email` is optional: absent is fine, present-but-not-a-string is not.
//
//  hint: inside the guard, `value as Record<string, unknown>` lets you
//  read members without reaching for `any`.

import { test, eq, ok } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

function probe<T>(value: T): T {
  return value;
}

export interface User {
  id: number;
  name: string;
  email?: string;
}

export function safeParseJson(text: string): TODO {
  throw new Error('TODO');
}

export function isUser(value: unknown): TODO {
  throw new Error('TODO');
}

export function parseUser(text: string): User | null {
  throw new Error('TODO');
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
