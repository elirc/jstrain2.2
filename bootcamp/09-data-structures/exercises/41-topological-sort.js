// ─────────────────────────────────────────────────────────────────────────
//  41 · topological sort, Kahn's way                        ★★★ stretch
//  concepts: DAGs · indegrees · dependency order
//  run: node 41-topological-sort.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Given jobs and "this must come before that" rules, produce an order
//  that satisfies all of them — or report that the rules contradict each
//  other. Build tasks, module imports, migrations, course prerequisites:
//  same problem every time.
//
//      topoOrder(['c', 'b', 'a'], [['a', 'b'], ['b', 'c']])
//        → ['a', 'b', 'c']
//      topoOrder(['a', 'b'], [['a', 'b'], ['b', 'a']])
//        → null            (circular — no order can exist)
//
//  Kahn's algorithm: count how many prerequisites each node has
//  (indegree), start with the ones that have none, and each time you emit
//  a node decrement its dependents — a dependent joins the queue the
//  moment its count hits ZERO.
//
//  For a deterministic answer: seed the queue by scanning `nodes` in the
//  order given, and append freed nodes as you meet them. Every name in
//  `edges` also appears in `nodes`.
//
//  hint: use the head-index queue from exercise 04, never shift() — and
//  if fewer than nodes.length names come out, the rest are in a cycle

import { test, eq, ok } from '../../_lib/check.js';

const respects = (order, edges) =>
  edges.every(([before, after]) => order.indexOf(before) < order.indexOf(after));

export function topoOrder(nodes, edges) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('a straight chain comes out in dependency order', () => {
  eq(topoOrder(['c', 'b', 'a'], [['a', 'b'], ['b', 'c']]), ['a', 'b', 'c']);
});

test('a node with no rules at all still shows up', () => {
  const order = topoOrder(['a', 'loner', 'b'], [['a', 'b']]);
  eq(order.length, 3);
  ok(order.includes('loner'));
  ok(respects(order, [['a', 'b']]));
});

test('a diamond yields a valid order', () => {
  const edges = [
    ['a', 'b'],
    ['a', 'c'],
    ['b', 'd'],
    ['c', 'd'],
  ];
  const order = topoOrder(['a', 'b', 'c', 'd'], edges);
  eq(order.length, 4);
  eq(order[0], 'a');
  eq(order[3], 'd');
  ok(respects(order, edges), `order broke a rule: ${order}`);
});

test('free nodes follow the order they were declared in', () => {
  eq(topoOrder(['b', 'a', 'c'], [['a', 'c']]), ['b', 'a', 'c']);
  eq(topoOrder(['a', 'b', 'c'], []), ['a', 'b', 'c']);
});

test('a circular dependency has no order', () => {
  eq(topoOrder(['a', 'b'], [['a', 'b'], ['b', 'a']]), null);
  eq(
    topoOrder(['a', 'b', 'c'], [['a', 'b'], ['b', 'c'], ['c', 'a']]),
    null,
    'a longer loop is still a loop'
  );
});

test('a self-dependency is impossible too', () => {
  eq(topoOrder(['a', 'b'], [['a', 'a']]), null);
});

test('an empty graph is trivially ordered', () => {
  eq(topoOrder([], []), []);
  eq(topoOrder(['solo'], []), ['solo']);
});

test('application: course prerequisites become a study plan', () => {
  const courses = ['algebra', 'calculus', 'physics', 'programming', 'ml'];
  const prereqs = [
    ['algebra', 'calculus'],
    ['calculus', 'physics'],
    ['calculus', 'ml'],
    ['programming', 'ml'],
  ];
  const plan = topoOrder(courses, prereqs);
  eq(plan.length, 5);
  eq(plan[0], 'algebra', 'nothing else can start first');
  ok(respects(plan, prereqs), `you cannot take these in this order: ${plan}`);

  const impossible = [
    ['intro', 'advanced'],
    ['advanced', 'intro'],
  ];
  eq(topoOrder(['intro', 'advanced'], impossible), null, 'reject the syllabus');
});
