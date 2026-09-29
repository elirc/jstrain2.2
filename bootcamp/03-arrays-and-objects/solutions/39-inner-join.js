// ─────────────────────────────────────────────────────────────────────────
//  39 · inner join — SOLUTION                              ★★☆ core
//  run: node 39-inner-join.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: this is a hash join, the same algorithm a database picks
//  when it cannot use an index — build a lookup from the smaller table,
//  then stream the other one past it. One pass to index, one pass to emit:
//  O(n + m) instead of the O(n × m) you get from `left.filter(l => right
//  .find(r => …))` nested inside a loop. The index maps key → ARRAY of
//  rows, not key → row, because nothing promises the right side is unique;
//  the moment it is not, `flatMap` starts multiplying rows, exactly like
//  SQL does. The key-collision test is the one that bites in real code: two
//  tables both called their primary key `id`, the spread runs left to
//  right, and your loan ids silently become member ids.

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

function indexRows(rows, key) {
  const index = new Map();
  for (const row of rows) {
    const value = row[key];
    if (!index.has(value)) index.set(value, []);
    index.get(value).push(row);
  }
  return index;
}

export function innerJoin(
  left,
  right,
  leftKey,
  rightKey,
  combine = (l, r) => ({ ...l, ...r })
) {
  const index = indexRows(right, rightKey);
  return left.flatMap((row) =>
    (index.get(row[leftKey]) ?? []).map((match) => combine(row, match))
  );
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
