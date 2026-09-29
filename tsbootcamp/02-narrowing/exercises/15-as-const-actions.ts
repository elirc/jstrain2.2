// ─────────────────────────────────────────────────────────────────────────
//  15 · as const                                             ★★☆ core
//  concepts: as const · typeof arr[number] · one source of truth
//  run: node ../run.js exercises/15-as-const-actions.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  You need the list at runtime (to validate input) and as a type (to
//  narrow). Writing it twice guarantees they drift. `as const` freezes an
//  array literal into a readonly TUPLE of literal types, and
//  `typeof ACTIONS[number]` reads the union straight back out of it.
//
//      without as const:  string[]        → ActionName is string, useless
//      with as const:     readonly ['create', 'update', 'delete']
//      typeof ACTIONS[number] → 'create' | 'update' | 'delete'
//
//      permissionFor('create')                → 'posts:create'
//      isActionName('archive')                → false
//      parseActions('create, nope, delete')   → ['create', 'delete']
//
//  `parseActions` splits on commas, trims, and keeps only real names.
//
//  hint: `includes` on a readonly tuple only accepts members of that
//  tuple, so widen it for the check: `(ACTIONS as readonly string[])`.

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

export const ACTIONS = ['create', 'update', 'delete'] as TODO;

export type ActionName = TODO;

export function isActionName(value: string): TODO {
  throw new Error('TODO');
}

export function permissionFor(action: ActionName): string {
  throw new Error('TODO');
}

export function parseActions(input: string): ActionName[] {
  throw new Error('TODO');
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
