// ─────────────────────────────────────────────────────────────────────────
//  21 · graph as an adjacency list                         ★☆☆ warm-up
//  concepts: graphs · Map of arrays · directed vs undirected
//  run: node 21-graph-build.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A graph is nodes plus connections — followers, imports, roads, task
//  dependencies. The everyday representation is an adjacency list: a Map
//  from each node to the array of nodes it connects to.
//
//      buildGraph([['a', 'b'], ['b', 'c']])
//        → Map { 'a' => ['b'], 'b' => ['a', 'c'], 'c' => ['b'] }
//
//      buildGraph([['a', 'b']], true)          // directed
//        → Map { 'a' => ['b'], 'b' => [] }     // b knows nothing about a
//
//      neighbors(graph, 'b')      → ['a', 'c']
//      neighbors(graph, 'ghost')  → []         // unknown node, not a crash
//
//  Undirected means every edge is stored twice, once from each end. Both
//  endpoints of an edge must appear as keys, even a node with no outgoing
//  edges.

import { test, eq } from '../../_lib/check.js';

export function buildGraph(edges, directed = false) {
  throw new Error('TODO');
}

export function neighbors(graph, node) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('every node named by an edge becomes a key', () => {
  const graph = buildGraph([
    ['a', 'b'],
    ['b', 'c'],
  ]);
  eq([...graph.keys()].sort(), ['a', 'b', 'c']);
  eq(graph.size, 3);
});

test('an undirected edge is stored from both ends', () => {
  const graph = buildGraph([['a', 'b']]);
  eq(graph.get('a'), ['b']);
  eq(graph.get('b'), ['a']);
});

test('a directed edge is stored one way only', () => {
  const graph = buildGraph([['a', 'b']], true);
  eq(graph.get('a'), ['b']);
  eq(graph.get('b'), [], 'the target is still a node, with no way back');
});

test('a node collects all of its connections', () => {
  const graph = buildGraph([
    ['hub', 'a'],
    ['hub', 'b'],
    ['hub', 'c'],
  ]);
  eq(neighbors(graph, 'hub'), ['a', 'b', 'c']);
  eq(neighbors(graph, 'a'), ['hub']);
});

test('neighbors of an unknown node is an empty array', () => {
  const graph = buildGraph([['a', 'b']]);
  eq(neighbors(graph, 'ghost'), []);
});

test('an empty edge list builds an empty graph', () => {
  const graph = buildGraph([]);
  eq(graph.size, 0);
  eq(neighbors(graph, 'a'), []);
});

test('application: a follow graph answers who reaches whom', () => {
  const follows = buildGraph(
    [
      ['ann', 'bo'],
      ['ann', 'cy'],
      ['bo', 'cy'],
    ],
    true
  );
  eq(neighbors(follows, 'ann'), ['bo', 'cy']);
  eq(neighbors(follows, 'cy'), [], 'cy follows nobody back');
  eq(follows.size, 3);
});
