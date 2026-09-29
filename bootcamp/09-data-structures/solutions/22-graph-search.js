// ─────────────────────────────────────────────────────────────────────────
//  22 · graph search — SOLUTION                            ★★★ stretch
//  run: node 22-graph-search.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: three algorithms, one idea — visit nodes in a controlled
//  order and remember what you have seen. All are O(nodes + edges).
//  bfsOrder: a queue plus a `seen` Set. Mark a node seen when you ENQUEUE
//  it, not when you dequeue it, or a diamond graph queues the same node
//  twice and it comes out duplicated.
//  shortestPath: the same BFS, but record `cameFrom[next] = node` on
//  discovery, then walk that chain backwards from the target and reverse.
//  BFS reaches every node by the fewest hops possible, so the first time
//  you touch the target you already hold the shortest route — which is why
//  DFS is the wrong tool here: it finds *a* path, rarely the shortest.
//  (Weighted edges are a different problem: that is Dijkstra, which is
//  this loop with the min-heap from exercise 18 instead of a queue.)
//  hasCycle: three states, not two. GRAY means "on the current DFS stack",
//  BLACK means "finished". Meeting a GRAY node means you looped back onto
//  your own path — a cycle. Meeting a BLACK node is just a second route
//  into an already-explored region, which is fine. Collapsing those two
//  into one `visited` Set is the classic false positive: it reports the
//  diamond a → b → c, a → c as a cycle.

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
  if (!graph.has(start)) return [];
  const seen = new Set([start]);
  const queue = [start];
  let head = 0;
  const order = [];

  while (head < queue.length) {
    const node = queue[head];
    head += 1;
    order.push(node);
    for (const next of graph.get(node)) {
      if (seen.has(next)) continue;
      seen.add(next);
      queue.push(next);
    }
  }
  return order;
}

export function shortestPath(graph, from, to) {
  if (!graph.has(from) || !graph.has(to)) return null;
  if (from === to) return [from];

  const cameFrom = new Map([[from, null]]);
  const queue = [from];
  let head = 0;

  while (head < queue.length) {
    const node = queue[head];
    head += 1;
    for (const next of graph.get(node)) {
      if (cameFrom.has(next)) continue;
      cameFrom.set(next, node);
      if (next === to) {
        const path = [];
        for (let at = to; at !== null; at = cameFrom.get(at)) path.push(at);
        return path.reverse();
      }
      queue.push(next);
    }
  }
  return null;
}

export function hasCycle(graph) {
  const GRAY = 1;
  const BLACK = 2;
  const state = new Map();

  const visit = (node) => {
    const colour = state.get(node);
    if (colour === GRAY) return true; // back onto the current path
    if (colour === BLACK) return false; // already fully explored
    state.set(node, GRAY);
    for (const next of graph.get(node) ?? []) {
      if (visit(next)) return true;
    }
    state.set(node, BLACK);
    return false;
  };

  for (const node of graph.keys()) {
    if (visit(node)) return true;
  }
  return false;
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
