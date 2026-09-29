// ─────────────────────────────────────────────────────────────────────────
//  21 · iterable deck                                      ★★☆ core
//  concepts: Symbol.iterator · generators · for-of
//  run: node 21-iterable-deck.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A class is not iterable just because it holds an array inside. `for...of`,
//  spread and destructuring all look for one thing: a [Symbol.iterator]
//  method. Give Deck that method and the rest of the language joins in.
//
//      const d = new Deck(['A♠', 'K♥', 'Q♦']);
//      [...d]                 → ['A♠', 'K♥', 'Q♦']
//      for (const c of d) …   → walks top to bottom
//      const [top] = d;       → 'A♠'
//      d.deal(2)              → ['A♠', 'K♥']   (taken off the deck)
//      d.size                 → 1
//
//  The constructor must COPY the array it is handed, and every call to
//  [Symbol.iterator] must hand back a FRESH walker — a deck you can only
//  loop over once is a bug, not a feature.
//
//  hint: put a `*` in front of the method name and it becomes a generator,
//  which is already an iterator — the done/value bookkeeping is free

import { test, eq } from '../../_lib/check.js';

export class Deck {
  constructor(cards = []) {
    throw new Error('TODO');
  }

  get size() {
    throw new Error('TODO');
  }

  [Symbol.iterator]() {
    throw new Error('TODO');
  }

  deal(count = 1) {
    throw new Error('TODO');
  }
}

// ──────────────────────────── tests ──────────────────────────────────────

test('spread collects every card in order', () => {
  const d = new Deck(['A♠', 'K♥', 'Q♦']);
  eq([...d], ['A♠', 'K♥', 'Q♦']);
  eq(d.size, 3);
});

test('for...of walks the deck top to bottom', () => {
  const d = new Deck(['A♠', 'K♥', 'Q♦']);
  const seen = [];
  for (const card of d) seen.push(card);
  eq(seen, ['A♠', 'K♥', 'Q♦']);
});

test('destructuring and Array.from come free', () => {
  const d = new Deck(['A♠', 'K♥', 'Q♦']);
  const [top, second] = d;
  eq(top, 'A♠');
  eq(second, 'K♥');
  eq(Array.from(d, (c) => c[0]), ['A', 'K', 'Q']);
});

test('the same deck can be walked more than once', () => {
  const d = new Deck(['A♠', 'K♥']);
  eq([...d], ['A♠', 'K♥']);
  eq([...d], ['A♠', 'K♥'], 'a one-shot iterator is the classic bug here');
});

test('nested loops each get their own walker', () => {
  const d = new Deck(['A♠', 'K♥']);
  const pairs = [];
  for (const a of d) for (const b of d) pairs.push(a + b);
  eq(pairs, ['A♠A♠', 'A♠K♥', 'K♥A♠', 'K♥K♥']);
});

test('deal takes cards off the top and shrinks the deck', () => {
  const d = new Deck(['A♠', 'K♥', 'Q♦']);
  eq(d.deal(2), ['A♠', 'K♥']);
  eq(d.size, 1);
  eq([...d], ['Q♦']);
  eq(d.deal(), ['Q♦'], 'deal() defaults to one card');
});

test('an empty deck iterates zero times', () => {
  const d = new Deck();
  eq([...d], []);
  eq(d.size, 0);
  let rounds = 0;
  for (const card of d) rounds += 1;
  eq(rounds, 0);
});

test('the constructor copies the array it is handed', () => {
  const source = ['A♠'];
  const d = new Deck(source);
  source.push('K♥');
  eq([...d], ['A♠']);
  eq(Object.hasOwn(Deck.prototype, Symbol.iterator), true, 'shared, not own');
});
