// ─────────────────────────────────────────────────────────────────────────
//  13 · invariant                                         ★★★ stretch
//  concepts: asserts cond · asserts x is T · flow after the call
//  run: node ../run.js exercises/13-assertion-functions.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  A guard answers a question (`if (isUser(x))`). An assertion function
//  ends the conversation: it either returns normally — and from that line
//  on the compiler treats the claim as TRUE — or it throws. No `if`, no
//  nesting, no early-return ladder.
//
//      invariant(user !== null, 'user is required');
//      user.name          // user is narrowed from here down
//
//      assertUser(payload);
//      payload.name       // payload was unknown one line ago
//
//  invariant throws its message for ANY falsy condition (false, 0, '',
//  null). assertUser throws when the shape is wrong.
//
//      greet({ id: 1, name: 'Ada' })  → 'hello Ada'
//      greet(null)                    → throws
//
//  hint: the return types are the exercise. They are not `boolean` and
//  they are not `void` — look up `asserts`. Note also that an assertion
//  function must have an explicit return type annotation; inference does
//  not produce one.

import { test, eq, ok, throws } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

function probe<T>(value: T): T {
  return value;
}

export interface User {
  id: number;
  name: string;
}

export function invariant(condition: unknown, message: string): TODO {
  throw new Error('TODO');
}

export function assertUser(value: unknown): TODO {
  throw new Error('TODO');
}

export function greet(value: unknown): string {
  throw new Error('TODO');
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('invariant is silent when the condition holds', () => {
  invariant(1, 'never seen');
  invariant('anything', 'never seen');
  ok(true, 'got past both calls');
});

test('invariant throws the message it was given', () => {
  throws(() => invariant(false, 'user is required'), 'user is required');
});

test('invariant rejects every falsy value, not just false', () => {
  throws(() => invariant(0, 'zero is falsy'), 'zero is falsy');
  throws(() => invariant('', 'empty is falsy'), 'empty is falsy');
  throws(() => invariant(null, 'null is falsy'), 'null is falsy');
});

test('assertUser lets a well-formed user through', () => {
  assertUser({ id: 1, name: 'Ada' });
  ok(true, 'no throw');
});

test('assertUser throws on anything else', () => {
  throws(() => assertUser(null));
  throws(() => assertUser({ id: '1', name: 'Ada' }));
});

test('greet reads a member the compiler could not see before', () => {
  eq(greet({ id: 1, name: 'Ada' }), 'hello Ada');
  throws(() => greet('Ada'));
});

// ──────────────────────────── type tests ─────────────────────────────────

type _r1 = Expect<Equal<ReturnType<typeof invariant>, void>>;

function _typeTests() {
  const maybe = null as string | null;

  invariant(maybe !== null, 'name is required');

  const p = probe(maybe);
  type _narrowed = Expect<Equal<typeof p, string>>;
  use(p);

  const raw = '' as unknown;

  // @ts-expect-error — one line too early: raw is still unknown here
  raw.name;

  assertUser(raw);

  const q = probe(raw);
  type _asserted = Expect<Equal<typeof q, User>>;
  use(q, q.name);
}
use(_typeTests);
