// ─────────────────────────────────────────────────────────────────────────
//  23 · vector value object                                ★★☆ core
//  concepts: value objects · equals · identity vs equality
//  run: node 23-vector-value-object.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Some objects ARE their contents. Two Vec2(3, 4) are the same point even
//  though they are two objects — `===` will never agree, so a value object
//  has to say so itself, and hand out a string key for the times you need
//  a Map or a Set to agree too.
//
//      const a = new Vec2(3, 4);
//      const b = new Vec2(3, 4);
//      a === b                → false      (two objects)
//      a.equals(b)            → true       (one value)
//      a.key()                → '3,4'
//      new Set([a, b]).size   → 2          (Sets compare identity!)
//      Vec2.uniq([a, b, new Vec2(0, 0)]).length → 2
//      a.add(b)               → Vec2(6, 8), with a and b untouched
//
//  equals() must reject anything that is not a Vec2, even a plain object
//  with the right two fields. Freeze each vector in the constructor: a
//  value that can change is not a value.
//
//  hint: build the Map in uniq() keyed by key() and keep the FIRST vector
//  you see for each key — `if (!seen.has(k)) seen.set(k, v)`

import { test, eq, ok, throws } from '../../_lib/check.js';

export class Vec2 {
  constructor(x, y) {
    throw new Error('TODO');
  }

  equals(other) {
    throw new Error('TODO');
  }

  key() {
    throw new Error('TODO');
  }

  add(other) {
    throw new Error('TODO');
  }

  static uniq(vectors) {
    throw new Error('TODO');
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
