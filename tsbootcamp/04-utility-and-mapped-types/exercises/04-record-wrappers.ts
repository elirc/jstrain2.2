// ─────────────────────────────────────────────────────────────────────────
//  04 · records and wrappers                                ★★☆ core
//  concepts: Record · Parameters · ReturnType · Awaited
//  run: node ../run.js exercises/04-record-wrappers.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Three jobs a codebase asks for constantly.
//
//  1. A dictionary whose keys are a closed union — miss a role and tsc
//     tells you, instead of `undefined` reaching production.
//         PermissionTable  →  { admin: [...], editor: [...], viewer: [...] }
//
//  2. A wrapper that logs any function without re-typing its signature:
//         logged(add, log)(2, 3)  → 5, and log saw 'add'
//     The wrapper must accept EXACTLY add's parameters and return exactly
//     add's return type — read both off the function type itself.
//
//  3. The type a promise settles to, with the Promise peeled off — so
//     describeUser can take the value loadUser eventually produces
//     without you retyping its shape.
//
//  hint: `F extends (...args: any[]) => any` is the constraint that lets
//  Parameters<F> / ReturnType<F> work; Awaited<T> unwraps any nesting

import { test, eq, ok, spy } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

export type Role = 'admin' | 'editor' | 'viewer';

export type PermissionTable = TODO;

export const PERMISSIONS: PermissionTable = {
  admin: ['read', 'write', 'delete'],
  editor: ['read', 'write'],
  viewer: ['read'],
};

export function can(role: Role, action: string): boolean {
  throw new Error('TODO');
}

// an ordinary function — do not change it, wrap it
export function add(a: number, b: number): number {
  return a + b;
}

export function logged<F extends TODO>(
  fn: F,
  log: (name: string) => void
): TODO {
  throw new Error('TODO');
}

// an ordinary async function — do not change it, read its type
export async function loadUser(
  id: string
): Promise<{ id: string; name: string; role: Role }> {
  return { id, name: 'Ada', role: 'admin' };
}

export type LoadedUser = TODO;

export function describeUser(user: LoadedUser): string {
  throw new Error('TODO');
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('a role can do what its row lists', () => {
  ok(can('admin', 'delete'));
  ok(can('editor', 'write'));
});

test('a role cannot do what its row omits', () => {
  ok(!can('viewer', 'delete'));
  ok(!can('editor', 'delete'));
});

test('the wrapper forwards arguments and returns the result', () => {
  const wrapped = logged(add, () => {});
  eq(wrapped(2, 3), 5);
});

test('the wrapper logs the wrapped function name', () => {
  const log = spy<[string], void>();
  logged(add, log)(1, 1);
  eq(log.calls, [['add']]);
});

test('describeUser consumes what loadUser settles to', async () => {
  eq(describeUser(await loadUser('u1')), 'Ada (admin)');
});

// ──────────────────────────── type tests ─────────────────────────────────

type _t1 = Expect<
  Equal<
    PermissionTable,
    {
      admin: readonly string[];
      editor: readonly string[];
      viewer: readonly string[];
    }
  >
>;
type _t2 = Expect<
  Equal<LoadedUser, { id: string; name: string; role: Role }>
>;
type _t3 = Expect<Equal<Parameters<typeof add>, [a: number, b: number]>>;
type _t4 = Expect<Equal<ReturnType<typeof logged<typeof add>>, typeof add>>;
// Awaited flattens all the way down, not one level
type _t5 = Expect<Equal<Awaited<Promise<Promise<number>>>, number>>;

function _typeTests() {
  const wrapped = logged(add, () => {});
  const sum: number = wrapped(1, 2);
  use(sum);

  // @ts-expect-error — the wrapper inherits add's parameter types
  wrapped('1', 2);

  // @ts-expect-error — 'root' is not a Role
  can('root', 'read');

  // @ts-expect-error — the table has a row per Role and no others
  PERMISSIONS.guest;

  // @ts-expect-error — a table missing a role is not a table
  const gap: PermissionTable = { admin: [], editor: [] };
  use(gap);

  // @ts-expect-error — LoadedUser is the settled value, not the promise
  describeUser(loadUser('u1'));
}
use(_typeTests);
