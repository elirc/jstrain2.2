// ─────────────────────────────────────────────────────────────────────────
//  34 · comparator factories — SOLUTION                    ★★☆ core
//  run: node 34-comparator-factories.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `by` closes over the key and returns a two-argument
//  function, which is exactly the shape `sort` wants. The `<` / `>` ladder
//  works for numbers and strings alike; `a[key] - b[key]` is shorter but
//  silently produces NaN on strings, and NaN is treated as 0, leaving the
//  array apparently unsorted.
//  `descending` is the interesting one: `(a, b) => cmp(b, a)` — swapping
//  the arguments rather than negating the result. Negating with `-cmp(a,b)`
//  turns 0 into -0, which is harmless for `sort` but a bad habit; swapping
//  also keeps working for comparators that return only -1/0/1 from a
//  lookup table.
//  Returning 0 for ties matters: `Array#sort` is stable in modern engines,
//  so a tie means "keep the order you already had" — the property the next
//  file builds multi-level sorting on.

import { test, eq, ok } from '../../_lib/check.js';

export function by(key) {
  return (a, b) => {
    if (a[key] < b[key]) return -1;
    if (a[key] > b[key]) return 1;
    return 0;
  };
}

export function descending(cmp) {
  return (a, b) => cmp(b, a);
}

// ── given: the fixture the tests sort ──
const crew = [
  { name: 'ada', age: 36 },
  { name: 'lin', age: 28 },
  { name: 'grace', age: 45 },
];

// ──────────────────────────── tests ──────────────────────────────────────

test('by sorts on a numeric key, smallest first', () => {
  eq(
    [...crew].sort(by('age')).map((p) => p.age),
    [28, 36, 45]
  );
});

test('by sorts on a string key too', () => {
  eq(
    [...crew].sort(by('name')).map((p) => p.name),
    ['ada', 'grace', 'lin']
  );
});

test('numbers are compared as numbers, not as text', () => {
  const rows = [{ n: 10 }, { n: 9 }, { n: 100 }];
  eq(
    [...rows].sort(by('n')).map((r) => r.n),
    [9, 10, 100],
    'the default sort would give 10, 100, 9'
  );
});

test('a comparator answers with a number, never a boolean', () => {
  const cmp = by('age');
  ok(cmp({ age: 1 }, { age: 2 }) < 0);
  ok(cmp({ age: 2 }, { age: 1 }) > 0);
  eq(cmp({ age: 7 }, { age: 7 }), 0);
});

test('ties keep the order they came in', () => {
  const rows = [
    { n: 1, tag: 'first' },
    { n: 1, tag: 'second' },
  ];
  eq(
    [...rows].sort(by('n')).map((r) => r.tag),
    ['first', 'second']
  );
});

test('descending flips whatever comparator it is given', () => {
  const cmp = descending(by('age'));
  ok(cmp({ age: 1 }, { age: 2 }) > 0);
  eq(
    [...crew].sort(cmp).map((p) => p.age),
    [45, 36, 28]
  );
});

test('descending works on a hand-written comparator as well', () => {
  const byLength = (a, b) => a.length - b.length;
  eq(['aaa', 'a', 'aa'].sort(descending(byLength)), ['aaa', 'aa', 'a']);
});

test('descending twice is the original order again', () => {
  eq(
    [...crew].sort(descending(descending(by('age')))).map((p) => p.age),
    [28, 36, 45]
  );
});
