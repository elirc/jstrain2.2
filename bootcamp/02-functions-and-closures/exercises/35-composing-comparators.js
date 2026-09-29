// ─────────────────────────────────────────────────────────────────────────
//  35 · composing comparators                              ★★☆ core
//  concepts: comparators · composition · short-circuit
//  run: node 35-composing-comparators.js
// ─────────────────────────────────────────────────────────────────────────
//
//  "Sort by department, then by salary, highest first, then by name" is
//  four comparators glued into one. Write the glue.
//
//      const cmp = thenBy(by('dept'), descending(by('pay')), by('name'));
//      sortWith(staff, by('dept'), descending(by('pay')))
//        → eng 150, eng 120, eng 120, ops 90
//
//  `thenBy(...comparators)` returns a comparator that asks each one in
//  turn and stops at the first non-zero answer — a tie (0) means "I have
//  no opinion, ask the next one". With no comparators at all, everything
//  ties.
//
//  `sortWith(list, ...comparators)` sorts with that composite and returns
//  a NEW array; the caller's list must come back untouched.
//
//  hint: a `for...of` over the comparators with an early `return` is
//  clearer here than a reduce — you are looking for the first opinion

import { test, eq, ok, spy } from '../../_lib/check.js';

export function thenBy(...comparators) {
  throw new Error('TODO');
}

export function sortWith(list, ...comparators) {
  throw new Error('TODO');
}

// ── given: the factories from the previous file, plus a fixture ──
const by = (key) => (a, b) =>
  a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0;
const descending = (cmp) => (a, b) => cmp(b, a);

const staff = [
  { name: 'ada', dept: 'eng', pay: 120 },
  { name: 'lin', dept: 'ops', pay: 90 },
  { name: 'sam', dept: 'eng', pay: 150 },
  { name: 'ted', dept: 'eng', pay: 120 },
];

// ──────────────────────────── tests ──────────────────────────────────────

test('one comparator in, the same behaviour out', () => {
  const cmp = thenBy(by('pay'));
  ok(cmp({ pay: 1 }, { pay: 2 }) < 0);
  eq(cmp({ pay: 2 }, { pay: 2 }), 0);
});

test('a tie falls through to the next comparator', () => {
  const cmp = thenBy(by('dept'), by('name'));
  ok(cmp(staff[0], staff[3]) < 0, 'same dept, ada before ted');
});

test('later comparators are only asked when the earlier ones tie', () => {
  const first = spy(() => -1);
  const second = spy(() => 1);
  eq(thenBy(first, second)({}, {}), -1);
  eq(first.callCount, 1);
  eq(second.callCount, 0);
});

test('with no comparators everything ties', () => {
  eq(thenBy()({ a: 1 }, { a: 2 }), 0);
});

test('sortWith orders by dept, then by pay descending', () => {
  eq(
    sortWith(staff, by('dept'), descending(by('pay'))).map((p) => p.name),
    ['sam', 'ada', 'ted', 'lin']
  );
});

test('items tied on every comparator keep their original order', () => {
  eq(
    sortWith(staff, by('dept')).map((p) => p.name),
    ['ada', 'sam', 'ted', 'lin']
  );
});

test('sortWith returns a new array and leaves the input alone', () => {
  const before = staff.map((p) => p.name);
  const sorted = sortWith(staff, descending(by('pay')));
  ok(sorted !== staff);
  eq(staff.map((p) => p.name), before);
  eq(sorted.map((p) => p.pay), [150, 120, 120, 90]);
});

test('three levels of tie-breaking', () => {
  const rows = [
    { a: 1, b: 1, c: 'z' },
    { a: 1, b: 1, c: 'a' },
    { a: 1, b: 0, c: 'm' },
  ];
  eq(
    sortWith(rows, by('a'), by('b'), by('c')).map((r) => r.c),
    ['m', 'a', 'z']
  );
});
