// ─────────────────────────────────────────────────────────────────────────
//  38 · union-find with path compression and rank           ★★★ stretch
//  concepts: disjoint sets · path compression · union by rank
//  run: node 38-union-find.js
// ─────────────────────────────────────────────────────────────────────────
//
//  "Are these two things in the same group?" — asked over and over while
//  groups keep merging. A disjoint set (union-find) answers it in
//  effectively constant time by storing, for each element, a parent to
//  follow upward. Same root ⇒ same set.
//
//      const ds = new DisjointSet(5);
//      ds.union(0, 1)        → true    (two sets became one)
//      ds.union(1, 0)        → false   (already together)
//      ds.connected(0, 1)    → true
//      ds.count              → 4       (sets remaining)
//
//  Two optimisations, both required here:
//    · path compression — find(x) repoints EVERY node it walks straight
//      at the root, so the next lookup is one hop
//    · union by rank — attach the shorter tree under the taller one; on
//      equal rank the root of `a` wins and its rank goes up by one
//
//  hint: union must compare ROOTS, never the raw arguments — find first,
//  then decide which root adopts the other

import { test, eq, ok } from '../../_lib/check.js';

export class DisjointSet {
  constructor(size) {
    this.parent = Array.from({ length: size }, (_, i) => i);
    this.rank = new Array(size).fill(0);
    this.count = size;
  }

  find(x) {
    throw new Error('TODO');
  }

  union(a, b) {
    throw new Error('TODO');
  }

  connected(a, b) {
    throw new Error('TODO');
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
