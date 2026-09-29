// ─────────────────────────────────────────────────────────────────────────
//  16 · tree traversals: depth-first vs breadth-first         ★★☆ core
//  concepts: recursion · queues · traversal order
//  run: node 16-tree-traversals.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Most trees you meet at work are not textbook binary trees — they are
//  plain nested objects: a file system, a DOM, a comment thread, a JSON
//  config. Every node is { name, children }, and a node may have any
//  number of children.
//
//  Two ways to walk it, and the choice changes the ORDER, not the result:
//
//      depthFirstNames(tree)    dive into a branch, finish it, come back
//        → ['project', 'src', 'index.js', 'util', 'dates.js', ...]
//
//      breadthFirstNames(tree)  finish a whole level, then go deeper
//        → ['project', 'src', 'docs', 'package.json', 'index.js', ...]
//
//  Visit the node itself first, then its children in order.
//
//  hint: depth-first falls out of recursion (or a stack); breadth-first
//  needs a queue — take from the front, add children to the back

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
  throw new Error('TODO');
}

export function breadthFirstNames(node) {
  throw new Error('TODO');
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
