// ─────────────────────────────────────────────────────────────────────────
//  21 · iterable deck — SOLUTION                           ★★☆ core
//  run: node 21-iterable-deck.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the iterable protocol is one method that returns an
//  ITERATOR — an object with next() → { value, done }. Writing that object
//  by hand means tracking a cursor yourself; `*[Symbol.iterator]()` makes
//  the engine do it, and `yield*` delegates straight to the array's own
//  iterator. Because the generator function runs from the top on every
//  call, each `for...of` gets its own independent walker — which is why
//  the repeat-walk and nested-loop tests pass.
//
//  The classic wrong turn is caching one iterator on the instance
//  (`this._it = this.cards[Symbol.iterator]()` and returning it): the
//  first loop drains it and every later loop sees an empty deck.
//  Second wrong turn: storing the caller's array instead of copying it —
//  then the deck changes behind your back.

import { test, eq } from '../../_lib/check.js';

export class Deck {
  #cards;

  constructor(cards = []) {
    this.#cards = [...cards];
  }

  get size() {
    return this.#cards.length;
  }

  *[Symbol.iterator]() {
    yield* this.#cards;
  }

  deal(count = 1) {
    return this.#cards.splice(0, count);
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
