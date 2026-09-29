// ─────────────────────────────────────────────────────────────────────────
//  30 · loose vs private — SOLUTION                        ★☆☆ warm-up
//  run: node 30-loose-vs-private.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `_count` is a normal property with a sad face painted on
//  it. It shows up in Object.keys, in JSON.stringify, in a spread copy,
//  and anybody can write to it — the underscore is documentation, not a
//  guard. `#count` is a different mechanism: a slot addressed by a name
//  that only this class body can even spell. No reflection API lists it,
//  which is why the JSON and spread tests come back empty.
//
//  That last point cuts both ways and is worth remembering: `{ ...obj }`
//  and JSON round-trips lose #private state entirely, so a class with
//  private fields needs its own toJSON()/from() if it has to travel.
//
//  holdsCount uses the `#count in value` brand check — true only for
//  objects this constructor actually ran on. Note the guard in front: on
//  a primitive, private-in throws a TypeError instead of answering false.

import { test, eq, ok } from '../../_lib/check.js';

export class LooseCounter {
  constructor(start = 0) {
    this._count = start;
  }

  inc() {
    this._count += 1;
    return this;
  }

  get value() {
    return this._count;
  }
}

export class StrictCounter {
  #count;

  constructor(start = 0) {
    this.#count = start;
  }

  inc() {
    this.#count += 1;
    return this;
  }

  get value() {
    return this.#count;
  }

  static holdsCount(value) {
    return typeof value === 'object' && value !== null && #count in value;
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
