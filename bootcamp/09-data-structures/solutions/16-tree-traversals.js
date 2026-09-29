// ─────────────────────────────────────────────────────────────────────────
//  16 · tree traversals — SOLUTION                            ★★☆ core
//  run: node 16-tree-traversals.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the two walks are the SAME loop with one difference — the
//  container you pull the next node from. Take from the end (a stack, or
//  the call stack via recursion) and you dive: depth-first. Take from the
//  front (a queue) and you sweep: breadth-first. That is the whole
//  distinction, and it is worth internalising because it is exactly the
//  difference between DFS and BFS on a graph later.
//  Both are O(n) time and visit every node once. Space differs: DFS costs
//  O(height) (fine for a deep, narrow tree, but a 50k-deep chain will
//  overflow the call stack — switch to an explicit stack), BFS costs
//  O(widest level) (fine for deep trees, expensive for a fan-out of
//  100k children).
//  Use BFS when shallow answers are better answers: nearest match, fewest
//  hops, rendering a tree top-down. Use DFS when you must finish a subtree
//  before moving on: computing folder sizes, evaluating an expression.
//  In the BFS loop, `queue.shift()` is O(n) — the head-index queue from
//  exercise 04 is the fix once the tree gets big.

import { test, eq } from '../../_lib/check.js';

export const projectTree = {
  name: 'project',
  children: [
    {
      name: 'src',
      children: [
        { name: 'index.js', size: 120, children: [] },
        {
          name: 'util',
          children: [
            { name: 'dates.js', size: 90, children: [] },
            { name: 'money.js', size: 60, children: [] },
          ],
        },
      ],
    },
    {
      name: 'docs',
      children: [{ name: 'readme.md', size: 40, children: [] }],
    },
    { name: 'package.json', size: 30, children: [] },
  ],
};

const deepChain = {
  name: 'a',
  children: [{ name: 'b', children: [{ name: 'c', children: [] }] }],
};

export function depthFirstNames(node) {
  const names = [node.name];
  for (const child of node.children) {
    names.push(...depthFirstNames(child));
  }
  return names;
}

export function breadthFirstNames(node) {
  const names = [];
  const queue = [node];
  let head = 0;
  while (head < queue.length) {
    const current = queue[head];
    head += 1;
    names.push(current.name);
    for (const child of current.children) queue.push(child);
  }
  return names;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('depth-first visits a node before its children', () => {
  eq(depthFirstNames(deepChain), ['a', 'b', 'c']);
});

test('depth-first finishes one branch before starting the next', () => {
  eq(depthFirstNames(projectTree), [
    'project',
    'src',
    'index.js',
    'util',
    'dates.js',
    'money.js',
    'docs',
    'readme.md',
    'package.json',
  ]);
});

test('breadth-first lists a whole level before descending', () => {
  eq(breadthFirstNames(projectTree), [
    'project',
    'src',
    'docs',
    'package.json',
    'index.js',
    'util',
    'readme.md',
    'dates.js',
    'money.js',
  ]);
});

test('breadth-first walks a deep chain one level at a time', () => {
  eq(breadthFirstNames(deepChain), ['a', 'b', 'c']);
});

test('a leaf returns only its own name', () => {
  const leaf = { name: 'solo.txt', size: 1, children: [] };
  eq(depthFirstNames(leaf), ['solo.txt']);
  eq(breadthFirstNames(leaf), ['solo.txt']);
});

test('both walks visit every node exactly once', () => {
  const dfs = depthFirstNames(projectTree);
  const bfs = breadthFirstNames(projectTree);
  eq(dfs.length, 9);
  eq([...dfs].sort(), [...bfs].sort());
});

test('application: index files depth-first, draw the sidebar top-down', () => {
  const indexed = depthFirstNames(projectTree).filter((n) => n.includes('.'));
  eq(indexed, [
    'index.js',
    'dates.js',
    'money.js',
    'readme.md',
    'package.json',
  ]);
  const sidebar = breadthFirstNames(projectTree).slice(0, 4);
  eq(sidebar, ['project', 'src', 'docs', 'package.json']);
});
