// ─────────────────────────────────────────────────────────────────────────
//  39 · inner join                                         ★★☆ core
//  concepts: joining arrays of objects · hash index · key collisions
//  run: node 39-inner-join.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Two API calls come back as two arrays and the screen needs one list.
//  That is a JOIN, and it is the same operation you write in SQL in module
//  22 — only here you have to build the index yourself.
//
//      innerJoin(LOANS, MEMBERS, 'memberId', 'id')
//        → one row per (loan, member) pair that matches, left order kept
//
//  Rows with no partner on the other side are dropped — that is what makes
//  it INNER. The default combiner spreads both sides into one object, so
//  the right-hand `id` overwrites the left-hand `id`; pass your own
//  combiner when both sides have columns with the same name.
//
//  hint: index the right table by its key ONCE (a Map of key → rows),
//  then walk the left table. Two nested loops is the O(n × m) version.

import { test, eq, ok } from '../../_lib/check.js';

const MEMBERS = Object.freeze([
  Object.freeze({ id: 'm1', name: 'Ada', branch: 'north' }),
  Object.freeze({ id: 'm2', name: 'Rui', branch: 'south' }),
  Object.freeze({ id: 'm3', name: 'Kai', branch: 'north' }),
]);

const LOANS = Object.freeze([
  Object.freeze({ id: 'l1', memberId: 'm1', title: 'Dune',       days: 14 }),
  Object.freeze({ id: 'l2', memberId: 'm2', title: 'Ficciones',  days: 7 }),
  Object.freeze({ id: 'l3', memberId: 'm9', title: 'Ghost Ship', days: 3 }),
  Object.freeze({ id: 'l4', memberId: 'm1', title: 'Solaris',    days: 21 }),
]);

export function innerJoin(
  left,
  right,
  leftKey,
  rightKey,
  combine = (l, r) => ({ ...l, ...r })
) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('only pairs that match on both sides survive', () => {
  const rows = innerJoin(LOANS, MEMBERS, 'memberId', 'id');
  eq(rows.length, 3);
  eq(rows.map((r) => r.title), ['Dune', 'Ficciones', 'Solaris']);
});

test('a loan pointing at a deleted member is dropped', () => {
  const rows = innerJoin(LOANS, MEMBERS, 'memberId', 'id');
  ok(!rows.some((r) => r.title === 'Ghost Ship'));
});

test('a member with no loans is dropped too', () => {
  const rows = innerJoin(LOANS, MEMBERS, 'memberId', 'id');
  ok(!rows.some((r) => r.name === 'Kai'));
});

test('the joined row carries columns from both tables', () => {
  const rows = innerJoin(LOANS, MEMBERS, 'memberId', 'id');
  eq(rows[0].name, 'Ada');
  eq(rows[0].branch, 'north');
  eq(rows[0].days, 14);
});

test('a member with two loans shows up once per loan', () => {
  const rows = innerJoin(LOANS, MEMBERS, 'memberId', 'id');
  eq(rows.filter((r) => r.name === 'Ada').length, 2);
});

test('with the default combiner the right-hand id wins', () => {
  const rows = innerJoin(LOANS, MEMBERS, 'memberId', 'id');
  eq(rows[0].id, 'm1');
});

test('a custom combiner keeps both ids', () => {
  const rows = innerJoin(LOANS, MEMBERS, 'memberId', 'id', (loan, member) => ({
    loanId: loan.id,
    memberName: member.name,
  }));
  eq(rows[0], { loanId: 'l1', memberName: 'Ada' });
});

test('joining against an empty table produces nothing', () => {
  eq(innerJoin(LOANS, [], 'memberId', 'id'), []);
  eq(innerJoin([], MEMBERS, 'memberId', 'id'), []);
});
