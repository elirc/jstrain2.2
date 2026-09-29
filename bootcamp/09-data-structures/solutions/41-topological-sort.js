// ─────────────────────────────────────────────────────────────────────────
//  41 · topological sort, Kahn's way — SOLUTION             ★★★ stretch
//  run: node 41-topological-sort.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: build an adjacency list plus an indegree count in one pass
//  over the edges. Seed a queue with every node whose indegree is 0 — it
//  depends on nothing, so it may go first. Pop one, emit it, and
//  decrement each dependent; a dependent is enqueued exactly when its
//  count reaches ZERO, meaning every prerequisite has already been
//  emitted.
//  O(V + E) time and O(V + E) space: each node is enqueued once, each edge
//  relaxed once. The queue is an array with a head index — shift() would
//  reindex on every pop and quietly make this O(V²).
//  The cycle check is free. Nodes inside a loop never reach indegree 0, so
//  if fewer than V names came out, the remainder are deadlocked on each
//  other — return null. That is the same information the three-colour DFS
//  in exercise 22 works for, obtained as a side effect of counting.
//  Classic wrong turn: enqueuing a dependent as soon as you decrement it
//  rather than when it hits zero — the order then emits a node before all
//  of its prerequisites, and every test that only checks the LENGTH still
//  passes.

import { test, eq, ok } from '../../_lib/check.js';

const respects = (order, edges) =>
  edges.every(([before, after]) => order.indexOf(before) < order.indexOf(after));

export function topoOrder(nodes, edges) {
  const dependents = new Map(nodes.map((node) => [node, []]));
  const indegree = new Map(nodes.map((node) => [node, 0]));

  for (const [before, after] of edges) {
    dependents.get(before).push(after);
    indegree.set(after, indegree.get(after) + 1);
  }

  const queue = nodes.filter((node) => indegree.get(node) === 0);
  let head = 0;
  const order = [];

  while (head < queue.length) {
    const node = queue[head];
    head += 1;
    order.push(node);
    for (const next of dependents.get(node)) {
      const left = indegree.get(next) - 1;
      indegree.set(next, left);
      if (left === 0) queue.push(next); // only now is it free
    }
  }
  return order.length === nodes.length ? order : null;
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
