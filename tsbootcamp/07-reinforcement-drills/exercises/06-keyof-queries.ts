// ─────────────────────────────────────────────────────────────────────────
//  06 · keyof queries                                       ★★☆ core
//  concepts: keyof · indexed access · two type parameters
//  run: node ../run.js exercises/06-keyof-queries.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  cold rep — you learned this in TS-03.
//
//  Three query helpers over rows of any shape. The key must be a real key,
//  and the compared value must match the type AT that key.
//
//      sortBy(TICKETS, 'priority')        → rows ordered 1, 2, 3
//      sortBy(TICKETS, 'nope')            → compile error
//      whereEq(TICKETS, 'open', false)    → the closed rows
//      whereEq(TICKETS, 'priority', 'high')
//                                         → compile error
//      project(ticket, ['id', 'title'])   → { id, title }, typed as such
//
//  Design the signatures yourself — that is the exercise.

import { test, eq, ok } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

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

export function sortBy(rows: TODO, key: TODO): TODO {
  throw new Error('TODO');
}

export function whereEq(rows: TODO, key: TODO, value: TODO): TODO {
  throw new Error('TODO');
}

export function project(row: TODO, keys: TODO): TODO {
  throw new Error('TODO');
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
