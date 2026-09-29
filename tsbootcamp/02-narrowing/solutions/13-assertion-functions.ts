// ─────────────────────────────────────────────────────────────────────────
//  13 · invariant — SOLUTION                              ★★★ stretch
//  run: node ../run.js solutions/13-assertion-functions.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `asserts condition` and `asserts value is User` are
//  return-type positions, not types you can compute — which is why the
//  annotation is mandatory and why `TODO` could never stand in for one.
//  At runtime both functions return `undefined`; the whole payload is
//  what happens to CONTROL FLOW at the call site.
//
//  `asserts condition` re-uses the caller's expression: pass
//  `maybe !== null` and the compiler applies that exact narrowing to
//  `maybe` for the rest of the scope. `asserts value is User` narrows the
//  argument itself. Same mechanism as a type predicate, except the false
//  case is "we never get here" instead of an else branch.
//
//  Two rules that trip people up:
//
//  1. Assertion calls need a call target with an explicit type — a
//     `function` declaration or an annotated const. `const f = invariant;
//     f(x)` fails with TS2775.
//  2. The claim is trusted, never verified. An `invariant` whose body
//     forgets to throw silently disables every narrowing built on it.
//
//  `greet` shows the shape this buys: three lines, no nesting, and the
//  member access on the last line is fully typed.

import { test, eq, ok, throws } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

function probe<T>(value: T): T {
  return value;
}

export interface User {
  id: number;
  name: string;
}

export function invariant(
  condition: unknown,
  message: string
): asserts condition {
  if (!condition) throw new Error(message);
}

export function assertUser(value: unknown): asserts value is User {
  invariant(typeof value === 'object' && value !== null, 'not an object');

  const candidate = value as Record<string, unknown>;

  invariant(typeof candidate.id === 'number', 'id must be a number');
  invariant(typeof candidate.name === 'string', 'name must be a string');
}

export function greet(value: unknown): string {
  assertUser(value);
  return `hello ${value.name}`;
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
