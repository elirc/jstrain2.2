// ─────────────────────────────────────────────────────────────────────────
//  06 · keyof queries — SOLUTION                            ★★☆ core
//  run: node ../run.js solutions/06-keyof-queries.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `K extends keyof T` is the workhorse of typed data code.
//  Two type parameters, not one: T comes from the rows, K from the key
//  argument — and because K is constrained to a union of string literals,
//  inference keeps it literal ('priority', not string). That is what makes
//  a typo a compile error instead of an undefined at runtime.
//
//  `T[K]` is indexed access: the type of the value AT that key. In
//  `whereEq` it ties the third argument to the second, so the value you
//  compare against is checked per key — `whereEq(rows, 'priority', 'high')`
//  cannot compile. One type parameter (`value: unknown`) throws that away.
//
//  `project` returns `Pick<T, K>`: keys chosen at the call site, shape
//  computed from them. The `{} as Pick<T, K>` seed is the one honest cast —
//  the object is genuinely incomplete until the loop finishes, and there is
//  no way to express "partially built" that survives the return.
//
//  Note `readonly T[]` on the inputs: these functions only read, so say so;
//  callers with a `readonly Ticket[]` can then use them too. And `sortBy`
//  copies with `[...rows]` first, because `Array.prototype.sort` mutates.

import { test, eq, ok } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export interface Ticket {
  id: string;
  title: string;
  priority: number;
  assignee: string;
  open: boolean;
}

export const TICKETS: Ticket[] = [
  { id: 't3', title: 'Slow query', priority: 2, assignee: 'ada', open: true },
  { id: 't1', title: 'Broken login', priority: 1, assignee: 'bo', open: true },
  { id: 't2', title: 'Typo in nav', priority: 3, assignee: 'ada', open: false },
];

export function sortBy<T, K extends keyof T>(rows: readonly T[], key: K): T[] {
  return [...rows].sort((a, b) => {
    const left = a[key];
    const right = b[key];
    if (left === right) return 0;
    return left > right ? 1 : -1;
  });
}

export function whereEq<T, K extends keyof T>(
  rows: readonly T[],
  key: K,
  value: T[K]
): T[] {
  return rows.filter((row) => row[key] === value);
}

export function project<T, K extends keyof T>(
  row: T,
  keys: readonly K[]
): Pick<T, K> {
  const out = {} as Pick<T, K>;
  for (const key of keys) out[key] = row[key];
  return out;
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('sortBy orders on a numeric key', () => {
  eq(sortBy(TICKETS, 'priority').map((t: Ticket) => t.id), ['t1', 't3', 't2']);
});

test('sortBy orders on a string key and leaves the input alone', () => {
  eq(sortBy(TICKETS, 'title').map((t: Ticket) => t.id), ['t1', 't3', 't2']);
  eq(TICKETS.map((t) => t.id), ['t3', 't1', 't2']);
});

test('whereEq filters on the value at that key', () => {
  eq(whereEq(TICKETS, 'assignee', 'ada').map((t: Ticket) => t.id), ['t3', 't2']);
  eq(whereEq(TICKETS, 'open', false).map((t: Ticket) => t.id), ['t2']);
  eq(whereEq(TICKETS, 'priority', 9), []);
});

test('project keeps exactly the keys it was given', () => {
  eq(project(TICKETS[0]!, ['id', 'title']), {
    id: 't3',
    title: 'Slow query',
  });
});

test('project with no keys is an empty object, not a copy', () => {
  const empty = project(TICKETS[0]!, []);
  eq(Object.keys(empty), []);
  ok(empty !== TICKETS[0]);
});

// ──────────────────────────── type tests ─────────────────────────────────

type _t1 = Expect<Equal<ReturnType<typeof sortBy<Ticket, 'priority'>>, Ticket[]>>;
type _t2 = Expect<Equal<Parameters<typeof whereEq<Ticket, 'priority'>>[2], number>>;
type _t3 = Expect<
  Equal<
    ReturnType<typeof project<Ticket, 'id' | 'title'>>,
    Pick<Ticket, 'id' | 'title'>
  >
>;

function _typeTests() {
  const ticket = TICKETS[0]!;

  const byPriority: Ticket[] = sortBy(TICKETS, 'priority');
  use(byPriority);

  // @ts-expect-error — 'nope' is not a key of Ticket
  sortBy(TICKETS, 'nope');

  const open: Ticket[] = whereEq(TICKETS, 'open', true);
  use(open);

  // @ts-expect-error — priority is a number, so 'high' cannot match it
  whereEq(TICKETS, 'priority', 'high');

  // @ts-expect-error — and neither can a boolean
  whereEq(TICKETS, 'assignee', true);

  const slim = project(ticket, ['id', 'title']);
  const title: string = slim.title;
  use(title);

  // @ts-expect-error — priority was not projected, so it is not there
  slim.priority;

  // @ts-expect-error — every key must be a key of Ticket
  project(ticket, ['id', 'nope']);
}
use(_typeTests);
