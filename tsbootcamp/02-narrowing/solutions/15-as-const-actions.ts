// ─────────────────────────────────────────────────────────────────────────
//  15 · as const — SOLUTION                                  ★★☆ core
//  run: node ../run.js solutions/15-as-const-actions.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `['create', 'update', 'delete']` infers as `string[]` —
//  the elements widen to `string` and the length is forgotten. `as const`
//  turns off both: you get `readonly ['create', 'update', 'delete']`, a
//  tuple of literal types. From there `(typeof ACTIONS)[number]` is an
//  indexed access that asks "what can index [0], [1], [2] give me?" —
//  the union of the elements.
//
//  That one line is why the runtime list and the type can never drift.
//  Add 'archive' to the array and `ActionName` grows by itself, every
//  exhaustive switch over it breaks, and `isActionName` already accepts
//  it. Declaring the union by hand gives you two things to remember.
//
//  The `includes` cast is not a smell, it is the readonly tuple being
//  correct: `ACTIONS.includes(value)` would want `value` to already be an
//  ActionName, which is the question you are trying to answer. Widening
//  to `readonly string[]` for the check keeps the predicate honest.
//
//  `as const` is a value-level assertion — it appears in types, never in
//  the emitted JS, so nothing is actually frozen at runtime.

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export const ACTIONS = ['create', 'update', 'delete'] as const;

export type ActionName = (typeof ACTIONS)[number];

export function isActionName(value: string): value is ActionName {
  return (ACTIONS as readonly string[]).includes(value);
}

export function permissionFor(action: ActionName): string {
  return `posts:${action}`;
}

export function parseActions(input: string): ActionName[] {
  return input
    .split(',')
    .map((part) => part.trim())
    .filter(isActionName);
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('permissionFor namespaces the action', () => {
  eq(permissionFor('create'), 'posts:create');
  eq(permissionFor('delete'), 'posts:delete');
});

test('isActionName accepts the three real names', () => {
  eq(isActionName('update'), true);
  eq(isActionName('create'), true);
});

test('isActionName rejects everything else', () => {
  eq(isActionName('archive'), false);
  eq(isActionName(''), false);
});

test('parseActions trims and drops unknown names', () => {
  eq(parseActions('create, nope, delete'), ['create', 'delete']);
});

test('parseActions on empty input is an empty list', () => {
  eq(parseActions(''), []);
});

// ──────────────────────────── type tests ─────────────────────────────────

type _tuple = Expect<
  Equal<typeof ACTIONS, readonly ['create', 'update', 'delete']>
>;
type _union = Expect<Equal<ActionName, 'create' | 'update' | 'delete'>>;

function _typeTests() {
  const names = ['create', 'nope'].filter(isActionName);
  type _filtered = Expect<Equal<typeof names, ActionName[]>>;
  use(names);

  const first = ACTIONS[0];
  type _first = Expect<Equal<typeof first, 'create'>>;
  use(first);

  // @ts-expect-error — 'archive' is not one of ACTIONS
  permissionFor('archive');

  // @ts-expect-error — an `as const` array is readonly, so there is no push
  ACTIONS.push('create');
}
use(_typeTests);
