// ─────────────────────────────────────────────────────────────────────────
//  04 · records and wrappers — SOLUTION                     ★★☆ core
//  run: node ../run.js solutions/04-record-wrappers.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `Record<K, V>` is `{ [P in K]: V }` — a mapped type with a
//  constant value type. Because K is the closed union Role, the table must
//  have all three rows and no fourth; `Partial<Record<Role, X>>` is what
//  you want when rows may be missing (and then the lookup is `X |
//  undefined`, which is honest).
//
//  `Parameters<F>` and `ReturnType<F>` are conditional types with `infer`:
//  `F extends (...a: infer P) => any ? P : never`. They need something to
//  infer FROM, hence the `F extends (...args: any[]) => any` constraint.
//  Writing the wrapper as `(a: number, b: number) => number` would work
//  for `add` only; reading the pieces off F makes it work for anything and
//  keeps the two in sync when add's signature changes.
//
//  `fn(...(args as unknown[]))` needs the widening cast because tsc will
//  not spread a still-generic `Parameters<F>` tuple; F's apparent type has
//  a rest parameter, so an array spread is accepted. The `as ReturnType<F>`
//  is the same story on the way out. One cast each, at the boundary of a
//  generic — that is the honest price of this pattern.
//
//  `Awaited<T>` recursively unwraps promises: `Promise<Promise<number>>`
//  becomes `number`, not `Promise<number>`. Pair it with ReturnType to
//  name what an async function actually produces.

import { test, eq, ok, spy } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export type Role = 'admin' | 'editor' | 'viewer';

export type PermissionTable = Record<Role, readonly string[]>;

export const PERMISSIONS: PermissionTable = {
  admin: ['read', 'write', 'delete'],
  editor: ['read', 'write'],
  viewer: ['read'],
};

export function can(role: Role, action: string): boolean {
  return PERMISSIONS[role].includes(action);
}

// an ordinary function — do not change it, wrap it
export function add(a: number, b: number): number {
  return a + b;
}

export function logged<F extends (...args: any[]) => any>(
  fn: F,
  log: (name: string) => void
): (...args: Parameters<F>) => ReturnType<F> {
  return (...args: Parameters<F>): ReturnType<F> => {
    log(fn.name);
    return fn(...(args as unknown[])) as ReturnType<F>;
  };
}

// an ordinary async function — do not change it, read its type
export async function loadUser(
  id: string
): Promise<{ id: string; name: string; role: Role }> {
  return { id, name: 'Ada', role: 'admin' };
}

export type LoadedUser = Awaited<ReturnType<typeof loadUser>>;

export function describeUser(user: LoadedUser): string {
  return `${user.name} (${user.role})`;
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
