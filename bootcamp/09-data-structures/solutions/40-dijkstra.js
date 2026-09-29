// ─────────────────────────────────────────────────────────────────────────
//  40 · cheapest route with a min-heap — SOLUTION           ★★★ stretch
//  run: node 40-dijkstra.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the same discovery loop as BFS with the queue replaced by
//  a min-heap keyed on cost-so-far. Pop the cheapest frontier node; if it
//  is already done, it is a stale entry — skip it. Otherwise mark it done
//  (its cost is now FINAL) and relax its edges: if going through it beats
//  the best known cost for a neighbour, record the new cost, remember
//  where you came from, and push the neighbour.
//  O((V + E) log V): every edge can push at most one heap entry and every
//  pop costs log V. Scanning an array for the cheapest unvisited node
//  instead is O(V²) — fine for a dozen nodes, hopeless for a road network.
//  The greedy invariant is the thing to understand: with non-negative
//  weights, nothing still on the heap can ever improve the node with the
//  smallest tentative cost, because every route to it goes through
//  something at least as expensive. That is why the first POP is final —
//  and why negative weights break the algorithm outright.
//  Classic wrong turn: marking a node done when you PUSH it. That locks in
//  the first route found rather than the cheapest, which turns this back
//  into BFS wearing a heap.

import { test, eq, ok } from '../../_lib/check.js';

class MinHeap {
  constructor(compare) {
    this.items = [];
    this.compare = compare;
  }

  insert(value) {
    const items = this.items;
    items.push(value);
    let i = items.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.compare(items[parent], items[i]) <= 0) break;
      [items[parent], items[i]] = [items[i], items[parent]];
      i = parent;
    }
    return this;
  }

  extractMin() {
    const items = this.items;
    if (items.length === 0) return undefined;
    const min = items[0];
    const last = items.pop();
    if (items.length === 0) return min;

    items[0] = last;
    let i = 0;
    for (;;) {
      const left = 2 * i + 1;
      const right = left + 1;
      let smallest = i;
      if (left < items.length && this.compare(items[left], items[smallest]) < 0) {
        smallest = left;
      }
      if (right < items.length && this.compare(items[right], items[smallest]) < 0) {
        smallest = right;
      }
      if (smallest === i) break;
      [items[smallest], items[i]] = [items[i], items[smallest]];
      i = smallest;
    }
    return min;
  }

  size() {
    return this.items.length;
  }
}

const buildWeightedGraph = (edges) => {
  const graph = new Map();
  const ensure = (node) => {
    if (!graph.has(node)) graph.set(node, []);
    return graph.get(node);
  };
  for (const [from, to, weight] of edges) {
    ensure(from).push([to, weight]);
    ensure(to).push([from, weight]);
  }
  return graph;
};

//      a ─────(9)───── d ──(4)── e        a → d direct costs 9
//      │               │                  a → b → c → d costs 7
//     (2)             (2)
//      │               │
//      b ────(3)────── c                  x — y is a separate island
const roads = buildWeightedGraph([
  ['a', 'b', 2],
  ['b', 'c', 3],
  ['c', 'd', 2],
  ['a', 'd', 9],
  ['d', 'e', 4],
  ['x', 'y', 1],
]);

export function cheapestRoute(graph, from, to) {
  if (!graph.has(from) || !graph.has(to)) return null;

  const best = new Map([[from, 0]]);
  const cameFrom = new Map([[from, null]]);
  const done = new Set();
  const frontier = new MinHeap((a, b) => a.cost - b.cost);
  frontier.insert({ node: from, cost: 0 });

  while (frontier.size() > 0) {
    const { node, cost } = frontier.extractMin();
    if (done.has(node)) continue; // a stale, more expensive entry
    done.add(node);

    if (node === to) {
      const path = [];
      for (let at = node; at !== null; at = cameFrom.get(at)) path.push(at);
      return { cost, path: path.reverse() };
    }

    for (const [next, weight] of graph.get(node)) {
      const candidate = cost + weight;
      if (candidate < (best.get(next) ?? Infinity)) {
        best.set(next, candidate);
        cameFrom.set(next, node);
        frontier.insert({ node: next, cost: candidate });
      }
    }
  }
  return null;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('the cheap detour beats the expensive direct road', () => {
  eq(cheapestRoute(roads, 'a', 'd'), { cost: 7, path: ['a', 'b', 'c', 'd'] });
});

test('costs accumulate along a longer chain', () => {
  eq(cheapestRoute(roads, 'a', 'e'), {
    cost: 11,
    path: ['a', 'b', 'c', 'd', 'e'],
  });
  eq(cheapestRoute(roads, 'b', 'd').cost, 5);
});

test('a node on another island is unreachable', () => {
  eq(cheapestRoute(roads, 'a', 'x'), null);
  eq(cheapestRoute(roads, 'y', 'e'), null);
});

test('an unknown place is null, not a crash', () => {
  eq(cheapestRoute(roads, 'a', 'zz'), null);
  eq(cheapestRoute(roads, 'zz', 'a'), null);
});

test('a route to yourself costs nothing', () => {
  eq(cheapestRoute(roads, 'c', 'c'), { cost: 0, path: ['c'] });
});

test('the path it returns is real: every step is an edge', () => {
  const { cost, path } = cheapestRoute(roads, 'a', 'e');
  let total = 0;
  for (let i = 0; i < path.length - 1; i += 1) {
    const hop = roads.get(path[i]).find(([next]) => next === path[i + 1]);
    ok(hop !== undefined, `no road from ${path[i]} to ${path[i + 1]}`);
    total += hop[1];
  }
  eq(total, cost, 'the weights add up to the reported cost');
});

test('application: the cheapest flight itinerary, layovers included', () => {
  const flights = buildWeightedGraph([
    ['NYC', 'BOS', 120],
    ['NYC', 'CHI', 150],
    ['BOS', 'CHI', 80],
    ['CHI', 'SFO', 200],
    ['NYC', 'SFO', 420],
  ]);
  const trip = cheapestRoute(flights, 'NYC', 'SFO');
  eq(trip, { cost: 350, path: ['NYC', 'CHI', 'SFO'] });
  eq(trip.path.length - 1, 2, 'two flights beat the one direct 420 flight');
});
