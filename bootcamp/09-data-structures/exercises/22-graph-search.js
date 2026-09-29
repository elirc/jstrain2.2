// ─────────────────────────────────────────────────────────────────────────
//  22 · graph search: BFS, shortest path, cycles           ★★★ stretch
//  concepts: BFS · path reconstruction · cycle detection
//  run: node 22-graph-search.js
// ─────────────────────────────────────────────────────────────────────────
//
//  The capstone. Three questions every graph gets asked, on the adjacency
//  lists from exercise 21 (buildGraph is provided).
//
//      bfsOrder(roads, 'a')
//        → ['a', 'b', 'c', 'd', 'e']    nearest first, each node once
//
//      shortestPath(roads, 'a', 'e')
//        → ['a', 'b', 'd', 'e']         fewest hops, ends included
//      shortestPath(roads, 'a', 'a')  → ['a']
//      shortestPath(roads, 'a', 'zz') → null      no route
//
//      hasCycle(buildGraph([['a','b'],['b','c']], true))          → false
//      hasCycle(buildGraph([['a','b'],['b','c'],['c','a']], true)) → true
//
//  Visit neighbours in the order they appear in the adjacency list.
//  hasCycle takes a DIRECTED graph (an undirected edge would always look
//  like a cycle: a → b → a).
//
//  hint: BFS finds shortest paths for free if you record, for each node,
//  the node you arrived FROM — then walk that trail backwards from the
//  target. For cycles, a node currently on the DFS stack is different from
//  a node you have already finished with; only the first means a cycle.

import { test, eq } from '../../_lib/check.js';

export function buildGraph(edges, directed = false) {
  const graph = new Map();
  const ensure = (node) => {
    if (!graph.has(node)) graph.set(node, []);
    return graph.get(node);
  };

  for (const [from, to] of edges) {
    ensure(from).push(to);
    const backwards = ensure(to);
    if (!directed) backwards.push(from);
  }
  return graph;
}

//        a
//       / \        an undirected road map with a loop in the middle
//      b   c
//       \ /
//        d — e
const roads = buildGraph([
  ['a', 'b'],
  ['a', 'c'],
  ['b', 'd'],
  ['c', 'd'],
  ['d', 'e'],
]);

export function bfsOrder(graph, start) {
  throw new Error('TODO');
}

export function shortestPath(graph, from, to) {
  throw new Error('TODO');
}

export function hasCycle(graph) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('bfsOrder visits the graph level by level', () => {
  eq(bfsOrder(roads, 'a'), ['a', 'b', 'c', 'd', 'e']);
});

test('bfsOrder visits every node once despite the loop', () => {
  const order = bfsOrder(roads, 'd');
  eq(order.length, 5);
  eq(order[0], 'd');
  eq([...order].sort(), ['a', 'b', 'c', 'd', 'e']);
});

test('bfsOrder from an unknown node finds nothing', () => {
  eq(bfsOrder(roads, 'zz'), []);
});

test('shortestPath returns the whole route, both ends included', () => {
  eq(shortestPath(roads, 'a', 'e'), ['a', 'b', 'd', 'e']);
  eq(shortestPath(roads, 'b', 'c'), ['b', 'a', 'c']);
  eq(shortestPath(roads, 'c', 'c'), ['c'], 'a node reaches itself in 0 hops');
});

test('shortestPath returns null when there is no route', () => {
  const split = buildGraph([
    ['a', 'b'],
    ['x', 'y'],
  ]);
  eq(shortestPath(split, 'a', 'y'), null);
  eq(shortestPath(split, 'a', 'ghost'), null);
});

test('hasCycle is false for a directed acyclic graph', () => {
  const dag = buildGraph(
    [
      ['a', 'b'],
      ['b', 'c'],
      ['a', 'c'],
    ],
    true
  );
  eq(hasCycle(dag), false, 'two routes to c is a diamond, not a cycle');
});

test('hasCycle spots a directed loop and a self-loop', () => {
  const loop = buildGraph(
    [
      ['a', 'b'],
      ['b', 'c'],
      ['c', 'a'],
    ],
    true
  );
  eq(hasCycle(loop), true);
  eq(hasCycle(buildGraph([['a', 'a']], true)), true);
});

test('application: metro hops and a circular import chain', () => {
  const metro = buildGraph([
    ['central', 'museum'],
    ['central', 'park'],
    ['museum', 'harbor'],
    ['park', 'harbor'],
    ['harbor', 'airport'],
  ]);
  const route = shortestPath(metro, 'central', 'airport');
  eq(route, ['central', 'museum', 'harbor', 'airport']);
  eq(route.length - 1, 3, 'three hops');

  const imports = buildGraph(
    [
      ['app.js', 'utils.js'],
      ['utils.js', 'config.js'],
      ['config.js', 'app.js'],
    ],
    true
  );
  eq(hasCycle(imports), true, 'app → utils → config → app');
});
