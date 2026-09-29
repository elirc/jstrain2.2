// ─────────────────────────────────────────────────────────────────────────
//  40 · structuredClone edges — SOLUTION                     ★★★ stretch
//  run: node 40-clone-edges.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: structuredClone implements the HTML structured clone
//  algorithm, which keeps a memo of everything it has already copied —
//  that memo is what makes cycles work and what makes two references to
//  the same object stay one object in the copy. A hand-written recursive
//  copy (exercise 23) needs a WeakMap to match it.
//
//  What the algorithm cannot carry is behaviour. Functions and symbols
//  throw DataCloneError; class instances are serialised as their own data
//  and rebuilt as plain objects, so methods and getters vanish silently.
//  cloneInstance is the standard repair: copy the data, then re-attach the
//  original prototype with Object.create.
//
//  Wrapping the throw in a TypeError with `cause` keeps the stack story
//  intact — the classic wrong turn is `catch { return null }`, which turns
//  "your callback cannot be cloned" into a null that surfaces three
//  layers away with nothing to point at.

import { test, eq, ok, throws } from '../../_lib/check.js';

class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  get sum() {
    return this.x + this.y;
  }
  describe() {
    return `(${this.x}, ${this.y})`;
  }
}

class Basket {
  constructor(items) {
    this.items = items;
  }
  get size() {
    return this.items.length;
  }
}

export function cloneDeep(value) {
  try {
    return structuredClone(value);
  } catch (error) {
    throw new TypeError(`cannot clone: ${error.name}`, { cause: error });
  }
}

export function cloneInstance(instance) {
  const data = cloneDeep({ ...instance });
  return Object.assign(Object.create(Object.getPrototypeOf(instance)), data);
}

export function cloneWithout(value, keys) {
  const stripped = { ...value };
  for (const key of keys) delete stripped[key];
  return cloneDeep(stripped);
}

// ──────────────────────────── tests ──────────────────────────────────────

test('a cycle comes back as a cycle, not an infinite copy', () => {
  const node = { name: 'root' };
  node.self = node;
  node.children = [node];
  const copy = cloneDeep(node);
  ok(copy !== node, 'a new object');
  ok(copy.self === copy, 'the cycle points at the COPY');
  ok(copy.children[0] === copy);
  eq(copy.name, 'root');
});

test('Map, Set, Date, RegExp and typed arrays survive as instances', () => {
  const source = {
    map: new Map([['k', { n: 1 }]]),
    set: new Set([1, 2]),
    when: new Date(86400000),
    pattern: /ab+c/gi,
    bytes: new Uint8Array([1, 2]),
    failure: new Error('boom'),
  };
  const copy = cloneDeep(source);
  ok(copy.map instanceof Map);
  eq(copy.map.get('k'), { n: 1 });
  ok(copy.map.get('k') !== source.map.get('k'), 'deep, not shared');
  ok(copy.set instanceof Set && copy.set.has(2));
  eq(copy.when.getTime(), 86400000);
  eq([copy.pattern.source, copy.pattern.flags], ['ab+c', 'gi']);
  ok(copy.bytes instanceof Uint8Array);
  ok(copy.failure instanceof Error && copy.failure.message === 'boom');
});

test('undefined and NaN survive, which a JSON round trip destroys', () => {
  const source = { a: undefined, b: NaN, when: new Date(0) };
  const copy = cloneDeep(source);
  ok(Object.hasOwn(copy, 'a'), 'the key is still there');
  ok(Number.isNaN(copy.b));
  ok(copy.when instanceof Date);
  eq(JSON.parse(JSON.stringify(source)), {
    b: null,
    when: '1970-01-01T00:00:00.000Z',
  });
});

test('functions and symbols cannot be cloned at all', () => {
  throws(() => cloneDeep(() => {}), 'DataCloneError');
  throws(() => cloneDeep(Symbol('s')), 'DataCloneError');
  throws(() => cloneDeep({ onSave: () => {} }), 'DataCloneError');
});

test('the original DataCloneError is kept as the cause', () => {
  throws(() => cloneDeep(() => {}), 'cannot clone');
  let caught = null;
  try {
    cloneDeep(() => {});
  } catch (error) {
    caught = error;
  }
  ok(caught instanceof TypeError);
  eq(caught.cause.name, 'DataCloneError');
});

test('a clone is plain data — cloneInstance puts the class back', () => {
  const point = new Point(1, 2);
  const plain = cloneDeep(point);
  ok(!(plain instanceof Point), 'the prototype is gone');
  eq(plain.sum, undefined);
  eq(Object.getPrototypeOf(plain), Object.prototype);

  const restored = cloneInstance(point);
  ok(restored instanceof Point);
  ok(restored !== point);
  eq(restored.sum, 3);
  eq(restored.describe(), '(1, 2)');
});

test('cloneInstance copies the data deeply, not by reference', () => {
  const basket = new Basket(['apple']);
  const copy = cloneInstance(basket);
  ok(copy instanceof Basket);
  ok(copy.items !== basket.items, 'a new array');
  copy.items.push('pear');
  eq(basket.items, ['apple']);
  eq(copy.size, 2);
});

test('cloneWithout drops the awkward keys and clones the rest', () => {
  const config = { name: 'api', retries: 3, onSave: () => {} };
  throws(() => cloneDeep(config), 'DataCloneError');
  const copy = cloneWithout(config, ['onSave']);
  eq(copy, { name: 'api', retries: 3 });
  ok(!Object.hasOwn(copy, 'onSave'));
  ok(Object.hasOwn(config, 'onSave'), 'the original still has it');
  eq(cloneWithout({ a: 1 }, []), { a: 1 });
});
