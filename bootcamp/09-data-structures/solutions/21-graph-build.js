// ─────────────────────────────────────────────────────────────────────────
//  21 · graph as an adjacency list — SOLUTION              ★☆☆ warm-up
//  run: node 21-graph-build.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: an `ensure` helper that creates the empty array on first
//  sight keeps the loop to three lines and guarantees both endpoints exist
//  as keys — including a directed target with no outgoing edges, which is
//  easy to forget and makes every later traversal crash on `undefined`.
//  Why a Map of arrays? Building is O(edges), and "who is next to me?" is
//  one hash lookup: O(1) to reach the list, O(degree) to read it. The
//  alternative is an adjacency MATRIX (a grid of booleans), which is O(1)
//  for "is a connected to b?" but costs n² memory — 10k nodes would need
//  100M cells. Real graphs are sparse, so the list wins almost always.
//  Direction is a modelling decision, not a detail: "follows" is directed,
//  "is friends with" is undirected, and storing one as the other quietly
//  invents relationships that do not exist.

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

export function neighbors(graph, node) {
  return graph.get(node) ?? [];
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
