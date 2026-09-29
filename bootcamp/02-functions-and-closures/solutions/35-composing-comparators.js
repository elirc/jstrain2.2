// ─────────────────────────────────────────────────────────────────────────
//  35 · composing comparators — SOLUTION                   ★★☆ core
//  run: node 35-composing-comparators.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the composite comparator is a search for the first
//  non-zero answer. Each comparator is only consulted when every earlier
//  one tied, which is both the semantics you want and a real saving when a
//  later key is expensive to compute.
//  This is the moment `by` returning 0 for a tie pays off: without a
//  truthful 0 the chain can never fall through. Note also what makes the
//  result predictable — `Array#sort` is stable, so items that tie on
//  every comparator stay in their original order.
//  `sortWith` copies with `[...list]` before sorting because `sort`
//  mutates in place and returns the same array; handing a caller a
//  "sorted copy" that is secretly their own reordered array is a classic
//  source of spooky action at a distance.

import { test, eq, ok, spy } from '../../_lib/check.js';

export function thenBy(...comparators) {
  return (a, b) => {
    for (const cmp of comparators) {
      const answer = cmp(a, b);
      if (answer !== 0) return answer;
    }
    return 0;
  };
}

export function sortWith(list, ...comparators) {
  return [...list].sort(thenBy(...comparators));
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
