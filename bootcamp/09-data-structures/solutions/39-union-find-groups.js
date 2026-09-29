// ─────────────────────────────────────────────────────────────────────────
//  39 · cycles and groups over an edge list — SOLUTION      ★★☆ core
//  run: node 39-union-find-groups.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: both answers fall out of `union` alone. Feed it every
//  edge; it returns false exactly when both ends already shared a root,
//  which means this edge closes a loop — that IS the cycle test. Feed it
//  every edge and read `count`, and you have the number of connected
//  components, because every real merge removes exactly one group.
//  One pass over the edges at O(E · α(n)) ≈ O(E), with O(n) memory and no
//  adjacency list built at all. DFS solves the same problems in O(V + E),
//  but only after you construct the graph, and it needs the awkward
//  "ignore the edge I just came down" bookkeeping to avoid calling every
//  undirected edge a cycle. DSU also works on a STREAM: edges can arrive
//  one at a time, forever, and each answer is available immediately.
//  A self-loop [2,2] is caught for free — find(2) === find(2).
//  Classic wrong turn: pointing this at a DIRECTED graph. Union-find
//  cannot see direction, so a → c and b → c looks like a cycle to it. For
//  directed graphs use the three-colour DFS from exercise 22.

import { test, eq } from '../../_lib/check.js';

class DisjointSet {
  constructor(size) {
    this.parent = Array.from({ length: size }, (_, i) => i);
    this.rank = new Array(size).fill(0);
    this.count = size;
  }

  find(x) {
    let root = x;
    while (this.parent[root] !== root) root = this.parent[root];
    let node = x;
    while (this.parent[node] !== root) {
      const next = this.parent[node];
      this.parent[node] = root;
      node = next;
    }
    return root;
  }

  union(a, b) {
    const rootA = this.find(a);
    const rootB = this.find(b);
    if (rootA === rootB) return false;

    if (this.rank[rootA] < this.rank[rootB]) {
      this.parent[rootA] = rootB;
    } else if (this.rank[rootA] > this.rank[rootB]) {
      this.parent[rootB] = rootA;
    } else {
      this.parent[rootB] = rootA;
      this.rank[rootA] += 1;
    }
    this.count -= 1;
    return true;
  }

  connected(a, b) {
    return this.find(a) === this.find(b);
  }
}

export function hasCycleUndirected(n, edges) {
  const sets = new DisjointSet(n);
  for (const [a, b] of edges) {
    if (!sets.union(a, b)) return true; // both ends already connected
  }
  return false;
}

export function countGroups(n, edges) {
  const sets = new DisjointSet(n);
  for (const [a, b] of edges) sets.union(a, b);
  return sets.count;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('a tree has no cycle', () => {
  const tree = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
  ];
  eq(hasCycleUndirected(5, tree), false, 'n nodes, n-1 edges, all connected');
  eq(countGroups(5, tree), 1);
});

test('one extra edge between connected nodes closes a loop', () => {
  const looped = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],
  ];
  eq(hasCycleUndirected(4, looped), true);
});

test('a duplicate edge counts as a cycle', () => {
  eq(
    hasCycleUndirected(3, [
      [0, 1],
      [0, 1],
    ]),
    true,
    'the second cable is redundant'
  );
});

test('a self-loop is the smallest cycle there is', () => {
  eq(hasCycleUndirected(3, [[2, 2]]), true);
});

test('with no edges every node is its own group', () => {
  eq(countGroups(4, []), 4);
  eq(hasCycleUndirected(4, []), false);
});

test('two clusters and a loner make three groups', () => {
  const edges = [
    [0, 1],
    [1, 2],
    [3, 4],
  ];
  eq(countGroups(6, edges), 3, '{0,1,2} {3,4} {5}');
});

test('two disjoint triangles: a cycle, and two groups', () => {
  const edges = [
    [0, 1],
    [1, 2],
    [2, 0],
    [3, 4],
    [4, 5],
    [5, 3],
  ];
  eq(hasCycleUndirected(6, edges), true);
  eq(countGroups(6, edges), 2);
});

test('application: friend circles, and the cable that loops', () => {
  const friendships = [
    [0, 1],
    [1, 2],
    [4, 5],
  ];
  eq(countGroups(7, friendships), 4, '{0,1,2} {3} {4,5} {6}');

  const cables = [
    [0, 1],
    [1, 2],
    [2, 0],
  ];
  eq(hasCycleUndirected(3, cables), true, 'unplug one — it adds nothing');
});
