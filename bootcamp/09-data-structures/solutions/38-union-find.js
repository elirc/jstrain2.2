// ─────────────────────────────────────────────────────────────────────────
//  38 · union-find with path compression and rank — SOLUTION ★★★ stretch
//  run: node 38-union-find.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: each element points at a parent; follow the chain and you
//  reach the root that names the set. find walks up once to locate the
//  root, then walks again repointing every node it passed straight at it —
//  path compression. union finds both roots, and if they differ hangs the
//  shorter tree under the taller one, bumping the rank only when the two
//  were equal.
//  Together those two lines make find and union O(α(n)) amortised — the
//  inverse Ackermann function, which is below 5 for any n that fits in
//  this universe, so: effectively O(1). With NEITHER, a run of unions can
//  build a 1-deep-per-element chain and every find degrades to O(n).
//  Why this instead of BFS/DFS: DSU answers connectivity for a STREAM of
//  edges without ever building an adjacency list, and merging two groups
//  is one pointer write instead of a re-traversal. The price is that it
//  can only tell you WHETHER two nodes are linked, never the path — and it
//  cannot undo a union.
//  Classic wrong turn: `if (a !== b)` instead of comparing the two roots,
//  which merrily "merges" sets that were already the same and corrupts the
//  count.

import { test, eq, ok } from '../../_lib/check.js';

export class DisjointSet {
  constructor(size) {
    this.parent = Array.from({ length: size }, (_, i) => i);
    this.rank = new Array(size).fill(0);
    this.count = size;
  }

  find(x) {
    let root = x;
    while (this.parent[root] !== root) root = this.parent[root];

    let node = x; // second pass: everyone points at the root now
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

// ──────────────────────────── tests ──────────────────────────────────────

test('every element starts in its own set', () => {
  const ds = new DisjointSet(5);
  eq(ds.count, 5);
  eq(ds.find(3), 3, 'its own root');
  eq(ds.connected(0, 1), false);
});

test('union joins two sets and connected sees it', () => {
  const ds = new DisjointSet(5);
  eq(ds.union(0, 1), true);
  eq(ds.connected(0, 1), true);
  eq(ds.connected(0, 2), false, 'unrelated pairs stay apart');
});

test('union returns false when they were already together', () => {
  const ds = new DisjointSet(5);
  ds.union(0, 1);
  eq(ds.union(0, 1), false);
  eq(ds.union(1, 0), false, 'either way round');
  eq(ds.count, 4, 'and nothing was merged twice');
});

test('the count falls by exactly one per real merge', () => {
  const ds = new DisjointSet(6);
  ds.union(0, 1);
  ds.union(2, 3);
  eq(ds.count, 4);
  ds.union(1, 3);
  eq(ds.count, 3, 'two groups of two became one group of four');
});

test('connectivity is transitive', () => {
  const ds = new DisjointSet(5);
  ds.union(0, 1);
  ds.union(1, 2);
  eq(ds.connected(0, 2), true, 'never joined directly');
  eq(ds.connected(2, 4), false);
});

test('find flattens the whole path it walked', () => {
  const ds = new DisjointSet(4);
  ds.parent = [0, 0, 1, 2]; // hand-wired chain: 3 → 2 → 1 → 0
  eq(ds.find(3), 0);
  eq(ds.parent[3], 0, 'repointed straight at the root');
  eq(ds.parent[2], 0, 'and so is everything else on the way');
});

test('union by rank keeps the tree shallow', () => {
  const ds = new DisjointSet(4);
  ds.union(0, 1);
  ds.union(2, 3);
  ds.union(0, 2);
  eq(ds.find(3), 0, 'the taller tree keeps its root');
  ok(ds.rank[0] >= 2, 'and records that it grew');
});

test('application: are these two machines on the same switch?', () => {
  const network = new DisjointSet(6);
  for (const [a, b] of [
    [0, 1],
    [1, 2],
    [3, 4],
  ]) {
    network.union(a, b);
  }
  eq(network.connected(0, 2), true, 'same switch, two cables away');
  eq(network.connected(0, 4), false, 'a different switch entirely');
  eq(network.count, 3, 'three islands: {0,1,2} {3,4} {5}');
});
