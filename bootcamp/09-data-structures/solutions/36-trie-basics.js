// ─────────────────────────────────────────────────────────────────────────
//  36 · trie: insert, search, startsWith — SOLUTION         ★★☆ core
//  run: node 36-trie-basics.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: one node per character of shared prefix. insert walks the
//  word, creating missing children, and flags the final node as a word.
//  search and startsWith are the SAME walk — `walkTo` — and differ only in
//  the last line: startsWith asks "did I get there?", search also asks "is
//  this node flagged?".
//  Every operation is O(len) in the length of the word, and — this is the
//  point — completely independent of how many words the trie holds. A Set
//  matches that for exact lookups, but "does anything start with this?"
//  costs it O(n · len) because it has to test every entry. The trie pays
//  in memory instead: a node per distinct prefix character.
//  `children` is a Map, not a plain object, so 'constructor' and
//  'toString' are ordinary letters rather than inherited phantom keys —
//  the same trap the module README warns about.
//  Classic wrong turn: dropping the isWord flag and treating "I reached a
//  node" as "this is a word". Insert 'carpet' and suddenly 'car', 'ca' and
//  'c' all report true.

import { test, eq } from '../../_lib/check.js';

const walkTo = (start, characters) => {
  let node = start;
  for (const character of characters) {
    node = node.children.get(character);
    if (node === undefined) return null;
  }
  return node;
};

export class Trie {
  constructor() {
    this.root = { children: new Map(), isWord: false };
  }

  insert(word) {
    let node = this.root;
    for (const character of word) {
      if (!node.children.has(character)) {
        node.children.set(character, { children: new Map(), isWord: false });
      }
      node = node.children.get(character);
    }
    node.isWord = true;
    return this;
  }

  search(word) {
    const node = walkTo(this.root, word);
    return node !== null && node.isWord;
  }

  startsWith(prefix) {
    return walkTo(this.root, prefix) !== null;
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
