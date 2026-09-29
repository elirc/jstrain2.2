// ─────────────────────────────────────────────────────────────────────────
//  23 · vector value object — SOLUTION                     ★★☆ core
//  run: node 23-vector-value-object.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: JavaScript compares objects by identity and offers no hook
//  to change that — Set, Map keys, includes() and indexOf() all use ===.
//  So a value object carries two things: equals() for direct comparison,
//  and key() as the poor man's hashCode for the collections that will only
//  ever look at strings. uniq() is the payoff: one Map keyed by key().
//
//  `other instanceof Vec2` first is what stops duck-typed look-alikes from
//  sneaking in — the classic wrong turn is `other.x === this.x && ...`,
//  which happily calls a plain object equal, and blows up on null.
//  Object.freeze(this) at the end of the constructor is the other half:
//  key() and equals() are only trustworthy while the value cannot move,
//  which is also why add() returns a new vector instead of mutating.

import { test, eq, ok, throws } from '../../_lib/check.js';

export class Vec2 {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    Object.freeze(this);
  }

  equals(other) {
    return other instanceof Vec2 && other.x === this.x && other.y === this.y;
  }

  key() {
    return `${this.x},${this.y}`;
  }

  add(other) {
    return new Vec2(this.x + other.x, this.y + other.y);
  }

  static uniq(vectors) {
    const seen = new Map();
    for (const v of vectors) {
      if (!seen.has(v.key())) seen.set(v.key(), v);
    }
    return [...seen.values()];
  }
}

// ──────────────────────────── tests ──────────────────────────────────────

test('two vectors with the same components are equal but not identical', () => {
  const a = new Vec2(3, 4);
  const b = new Vec2(3, 4);
  eq(a === b, false);
  eq(a.equals(b), true);
  eq(b.equals(a), true, 'equality is symmetric');
  eq(a.equals(a), true, 'and reflexive');
});

test('different components are not equal', () => {
  const a = new Vec2(3, 4);
  eq(a.equals(new Vec2(3, 5)), false);
  eq(a.equals(new Vec2(4, 3)), false);
});

test('equals refuses look-alikes from another type', () => {
  class Point {
    constructor(x, y) {
      this.x = x;
      this.y = y;
    }
  }
  const a = new Vec2(3, 4);
  eq(a.equals({ x: 3, y: 4 }), false, 'a plain object is not a Vec2');
  eq(a.equals(new Point(3, 4)), false);
  eq(a.equals(null), false);
});

test('key() is the value written as a string', () => {
  eq(new Vec2(3, 4).key(), '3,4');
  eq(new Vec2(-1, 0).key(), '-1,0');
  eq(new Vec2(3, 4).key() === new Vec2(3, 4).key(), true);
  eq(new Vec2(3, 4).key() === new Vec2(4, 3).key(), false);
});

test('a Set dedupes by identity, a key-ed Map dedupes by value', () => {
  const a = new Vec2(3, 4);
  const b = new Vec2(3, 4);
  eq(new Set([a, b]).size, 2, 'Set compares with ===, so both survive');
  eq(new Map([[a.key(), a], [b.key(), b]]).size, 1);
});

test('uniq keeps the first of each value, in order', () => {
  const first = new Vec2(3, 4);
  const list = [first, new Vec2(0, 0), new Vec2(3, 4), new Vec2(0, 0)];
  const out = Vec2.uniq(list);
  eq(out.map((v) => v.key()), ['3,4', '0,0']);
  ok(out[0] === first, 'the first occurrence is the one that stays');
});

test('add returns a new vector and leaves both operands alone', () => {
  const a = new Vec2(3, 4);
  const b = new Vec2(1, 1);
  const sum = a.add(b);
  eq([sum.x, sum.y], [4, 5]);
  eq([a.x, a.y], [3, 4]);
  eq([b.x, b.y], [1, 1]);
  ok(sum instanceof Vec2);
});

test('a vector cannot be changed after it is built', () => {
  const a = new Vec2(3, 4);
  throws(() => {
    a.x = 99;
  });
  eq(a.x, 3);
  eq(Object.isFrozen(a), true);
});
