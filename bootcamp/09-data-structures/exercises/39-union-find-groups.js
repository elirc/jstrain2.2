// ─────────────────────────────────────────────────────────────────────────
//  39 · cycles and groups over an edge list                 ★★☆ core
//  concepts: disjoint sets · connected components · cycle detection
//  run: node 39-union-find-groups.js
// ─────────────────────────────────────────────────────────────────────────
//
//  The DisjointSet from exercise 38 is given below, finished. This one is
//  about USING it: two classic questions about an UNDIRECTED edge list
//  over nodes numbered 0 … n - 1, answered in one pass with no adjacency
//  list and no traversal.
//
//  hasCycleUndirected(n, edges) — does any edge join two nodes that were
//  already connected?
//      hasCycleUndirected(4, [[0,1], [1,2], [2,3]])          → false
//      hasCycleUndirected(4, [[0,1], [1,2], [2,3], [3,0]])   → true
//
//  countGroups(n, edges) — how many connected components ("friend
//  circles") are there?
//      countGroups(5, [[0,1], [1,2]])   → 3   ({0,1,2} {3} {4})
//      countGroups(3, [])               → 3
//
//  hint: `union` already tells you everything — it returns false exactly
//  when the two ends were in the same set, and the set keeps its own count

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
  throw new Error('TODO');
}

export function countGroups(n, edges) {
  throw new Error('TODO');
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
