// ─────────────────────────────────────────────────────────────────────────
//  36 · trie: insert, search, startsWith                    ★★☆ core
//  concepts: tries · prefix trees · Map children
//  run: node 36-trie-basics.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A Set answers "is this exact word in the dictionary?" in O(1). It
//  cannot answer "does ANYTHING start with 'ca'?" without looking at every
//  entry. A trie stores words as a tree of characters, so both questions
//  cost the length of the word you typed — no matter how many words you
//  are holding.
//
//      const t = new Trie();
//      t.insert('cat'); t.insert('car');
//      t.search('cat')       → true
//      t.search('ca')        → false    ('ca' is a prefix, not a word)
//      t.startsWith('ca')    → true
//      t.startsWith('dog')   → false
//
//  Each node is { children: Map, isWord: boolean }. The root is given to
//  you; walk it character by character, creating nodes as you go, and mark
//  the LAST node of an inserted word with isWord = true.
//
//  hint: search and startsWith are the same walk — they only differ in
//  what they ask about the node they land on

import { test, eq } from '../../_lib/check.js';

export class Trie {
  constructor() {
    this.root = { children: new Map(), isWord: false };
  }

  insert(word) {
    throw new Error('TODO');
  }

  search(word) {
    throw new Error('TODO');
  }

  startsWith(prefix) {
    throw new Error('TODO');
  }
}

// ──────────────────────────── tests ──────────────────────────────────────

test('an inserted word is found', () => {
  const t = new Trie();
  t.insert('cat');
  eq(t.search('cat'), true);
  eq(t.startsWith('cat'), true, 'a word is a prefix of itself');
});

test('a prefix of a word is not itself a word', () => {
  const t = new Trie();
  t.insert('cat');
  eq(t.search('ca'), false);
  eq(t.search('c'), false);
  eq(t.startsWith('ca'), true);
});

test('letters that exist along other words do not make a word', () => {
  const t = new Trie();
  t.insert('cat');
  t.insert('car');
  eq(t.search('cab'), false, 'c-a exists, b does not');
  eq(t.startsWith('cab'), false);
});

test('an unknown prefix is rejected', () => {
  const t = new Trie();
  t.insert('cat');
  eq(t.startsWith('dog'), false);
  eq(t.search('dog'), false);
});

test('a word and a longer word sharing its letters can both be words', () => {
  const t = new Trie();
  t.insert('car');
  t.insert('carpet');
  eq(t.search('car'), true);
  eq(t.search('carpet'), true);
  eq(t.search('carp'), false, 'on the path, but nobody marked it');
});

test('inserting the same word twice is harmless', () => {
  const t = new Trie();
  t.insert('cat');
  t.insert('cat');
  eq(t.search('cat'), true);
  eq(t.root.children.size, 1, 'one branch, not two');
});

test('an empty trie finds nothing', () => {
  const t = new Trie();
  eq(t.search('anything'), false);
  eq(t.startsWith('a'), false);
});

test('application: a router answers "is anything registered under this"', () => {
  const routes = new Trie();
  for (const path of ['/api/v1/users', '/api/v1/orders', '/health']) {
    routes.insert(path);
  }
  eq(routes.startsWith('/api/v1/'), true, 'mount the v1 middleware');
  eq(routes.startsWith('/api/v2'), false, '404 the whole branch');
  eq(routes.search('/health'), true);
  eq(routes.search('/api/v1'), false, 'a prefix, not a registered route');
});
