// ─────────────────────────────────────────────────────────────────────────
//  30 · loose vs private                                   ★☆☆ warm-up
//  concepts: _convention · #private · encapsulation
//  run: node 30-loose-vs-private.js
// ─────────────────────────────────────────────────────────────────────────
//
//  `_count` and `#count` read the same way in a code review and behave
//  nothing alike. Build the same counter twice and let the tests show the
//  difference.
//
//      LooseCounter   keeps its state in `this._count`
//      StrictCounter  keeps its state in `#count`
//
//      both:  new X(2).inc().value   → 3
//
//      Object.keys(loose)            → ['_count']
//      Object.keys(strict)           → []
//      JSON.stringify(loose)         → '{"_count":2}'
//      JSON.stringify(strict)        → '{}'
//      loose._count = 'oops'         → allowed, and it breaks inc()
//      { ...strict }                 → {}   (the state does not copy)
//
//  Give StrictCounter one more thing: `StrictCounter.holdsCount(value)`,
//  a brand check that answers true only for real strict counters — and
//  false, not a crash, for numbers and null.
//
//  hint: `#count in value` is the brand test; it throws on primitives, so
//  check `typeof value === 'object' && value !== null` first

import { test, eq, ok } from '../../_lib/check.js';

export class LooseCounter {
  constructor(start = 0) {
    throw new Error('TODO');
  }

  inc() {
    throw new Error('TODO');
  }

  get value() {
    throw new Error('TODO');
  }
}

export class StrictCounter {
  #count;

  constructor(start = 0) {
    throw new Error('TODO');
  }

  inc() {
    throw new Error('TODO');
  }

  get value() {
    throw new Error('TODO');
  }

  static holdsCount(value) {
    throw new Error('TODO');
  }
}

// ──────────────────────────── tests ──────────────────────────────────────

test('both counters behave identically through the public API', () => {
  eq(new LooseCounter(2).inc().value, 3);
  eq(new StrictCounter(2).inc().value, 3);
  eq(new LooseCounter().inc().inc().value, 2, 'inc chains');
  eq(new StrictCounter().inc().inc().value, 2);
});

test('the underscore field is an ordinary, visible property', () => {
  const c = new LooseCounter(2);
  eq(Object.keys(c), ['_count']);
  eq(JSON.stringify(c), '{"_count":2}');
  eq(c._count, 2);
});

test('the private field is not a property at all', () => {
  const s = new StrictCounter(2);
  eq(Object.keys(s), []);
  eq(Object.getOwnPropertyNames(s), []);
  eq(JSON.stringify(s), '{}');
  eq(s.count, undefined, 'there is no `count` to read from outside');
});

test('outside code can reach into the loose counter and break it', () => {
  const c = new LooseCounter(2);
  c._count = 'oops';
  eq(c.inc().value, 'oops1', 'a convention is not a guard');
});

test('the strict counter has no door to reach through', () => {
  const s = new StrictCounter(2);
  s.count = 99;
  s._count = 99;
  eq(s.value, 2, 'writing a look-alike property changes nothing');
  eq(s.inc().value, 3);
});

test('spreading copies the loose state and silently loses the private one', () => {
  eq({ ...new LooseCounter(2) }, { _count: 2 });
  eq({ ...new StrictCounter(2) }, {}, 'a shallow copy is an empty shell');
});

test('the brand check knows a real strict counter from a look-alike', () => {
  ok(StrictCounter.holdsCount(new StrictCounter(1)));
  eq(StrictCounter.holdsCount(new LooseCounter(1)), false);
  eq(StrictCounter.holdsCount({ _count: 1 }), false);
  eq(StrictCounter.holdsCount(3), false, 'primitives answer false, not throw');
  eq(StrictCounter.holdsCount(null), false);
});
