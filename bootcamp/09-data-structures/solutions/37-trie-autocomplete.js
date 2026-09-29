// ─────────────────────────────────────────────────────────────────────────
//  37 · autocomplete: top suggestions — SOLUTION            ★★★ stretch
//  run: node 37-trie-autocomplete.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: three phases. Walk to the prefix node — O(p) in the length
//  of what was typed, and an early return if that path does not exist.
//  Depth-first collect every counted node beneath it, rebuilding each word
//  from the characters on the way down — O(m) for m matches. Then rank:
//  count descending, alphabetical on ties — O(m log m) — and slice.
//  The win is what m IS: the size of the SUBTREE, not the dictionary. Ten
//  million products and a typed 'ca' still only touches the ca-branch. The
//  alternative — words.filter(w => w.startsWith(prefix)) — is O(N · p) on
//  EVERY keystroke, which is exactly the loop you cannot afford in a
//  search box.
//  The tie-break matters more than it looks: without it, two equally
//  popular terms swap places depending on Map insertion order, and the UI
//  flickers between renders. Deterministic ranking is a feature.
//  Classic wrong turns: sorting with a bare .sort() (string comparison, so
//  count 9 beats count 50), and mutating one shared prefix string during
//  the walk instead of passing `word + character` down.

import { test, eq } from '../../_lib/check.js';

export class Autocomplete {
  constructor() {
    this.root = { children: new Map(), count: 0 };
  }

  insert(word, count = 1) {
    let node = this.root;
    for (const character of word) {
      if (!node.children.has(character)) {
        node.children.set(character, { children: new Map(), count: 0 });
      }
      node = node.children.get(character);
    }
    node.count += count;
    return this;
  }

  suggest(prefix, limit = 5) {
    let node = this.root;
    for (const character of prefix) {
      node = node.children.get(character);
      if (node === undefined) return [];
    }

    const found = [];
    const collect = (current, word) => {
      if (current.count > 0) found.push([word, current.count]);
      for (const [character, child] of current.children) {
        collect(child, word + character);
      }
    };
    collect(node, prefix);

    found.sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));
    return found.slice(0, limit).map(([word]) => word);
  }
}

const dictionary = () => {
  const box = new Autocomplete();
  box.insert('car', 50);
  box.insert('cart', 20);
  box.insert('care', 20);
  box.insert('cardigan', 5);
  box.insert('dog', 90);
  return box;
};

// ──────────────────────────── tests ──────────────────────────────────────

test('suggestions come back most popular first', () => {
  const box = dictionary();
  eq(box.suggest('ca'), ['car', 'care', 'cart', 'cardigan']);
});

test('ties fall back to alphabetical order', () => {
  const box = dictionary();
  const hits = box.suggest('ca');
  eq([hits[1], hits[2]], ['care', 'cart'], 'both scored 20');
});

test('an unknown prefix suggests nothing', () => {
  const box = dictionary();
  eq(box.suggest('zz'), []);
  eq(box.suggest('cars'), [], 'no word continues past this path');
  eq(new Autocomplete().suggest('a'), []);
});

test('the limit truncates, and a generous limit returns everything', () => {
  const box = dictionary();
  eq(box.suggest('ca', 2), ['car', 'care']);
  eq(box.suggest('ca', 1), ['car']);
  eq(box.suggest('ca', 99).length, 4);
});

test('inserting a word again raises its rank', () => {
  const box = dictionary();
  box.insert('cart', 100);
  eq(box.suggest('ca', 1), ['cart'], '20 + 100 now beats car at 50');
});

test('the prefix itself is suggested when it is a stored word', () => {
  const box = dictionary();
  eq(box.suggest('car')[0], 'car');
  eq(box.suggest('car').length, 4, 'car, care, cart, cardigan');
});

test('the empty prefix ranks the whole dictionary', () => {
  const box = dictionary();
  eq(box.suggest('', 2), ['dog', 'car']);
  eq(box.suggest('', 99).length, 5);
});

test('application: a search box ranks car above cardigan', () => {
  const box = new Autocomplete();
  for (const [term, hits] of [
    ['car', 900],
    ['cardigan', 12],
    ['carpet', 300],
    ['camera', 450],
  ]) {
    box.insert(term, hits);
  }
  eq(box.suggest('car', 3), ['car', 'carpet', 'cardigan']);
  eq(box.suggest('ca', 2), ['car', 'camera']);
});
