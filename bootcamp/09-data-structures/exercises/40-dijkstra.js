// ─────────────────────────────────────────────────────────────────────────
//  40 · cheapest route with a min-heap                      ★★★ stretch
//  concepts: weighted graphs · greedy · priority queue
//  run: node 40-dijkstra.js
// ─────────────────────────────────────────────────────────────────────────
//
//  BFS (exercise 22) finds the route with the FEWEST HOPS. Put a price on
//  each road and that answer is often wrong: one long expensive road can
//  lose to three short cheap ones. Dijkstra's algorithm swaps the queue
//  for a priority queue and always expands the cheapest frontier first.
//
//      cheapestRoute(roads, 'a', 'd')
//        → { cost: 7, path: ['a', 'b', 'c', 'd'] }   not the 9-cost hop
//      cheapestRoute(roads, 'c', 'c')  → { cost: 0, path: ['c'] }
//      cheapestRoute(roads, 'a', 'x')  → null        (no route at all)
//      cheapestRoute(roads, 'a', 'zz') → null        (never heard of it)
//
//  The graph is a Map of node → [[neighbour, weight], …]; the MinHeap and
//  the graph builder are given. Track the best known cost per node and
//  where you arrived from, so you can rebuild the path at the end.
//
//  hint: a node is FINISHED the first time you pop it, not when you push
//  it — so keep a `done` set and skip stale heap entries instead of
//  hunting them down to delete

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
  throw new Error('TODO');
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
