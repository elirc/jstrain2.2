// ─────────────────────────────────────────────────────────────────────────
//  40 · structuredClone edges                                ★★★ stretch
//  concepts: structuredClone · cycles · DataCloneError · lost prototypes
//  run: node 40-clone-edges.js
// ─────────────────────────────────────────────────────────────────────────
//
//  structuredClone is the built-in deep copy, and it is far better than
//  JSON at the job — cycles, Maps, Sets, Dates, RegExps and typed arrays
//  all survive. It has exactly two sharp edges, and both are here.
//
//  cloneDeep(value) clones, but re-throws anything structuredClone refuses
//  as a TypeError whose message names the original ('cannot clone:
//  DataCloneError') and keeps the original in `cause`:
//
//      cloneDeep({ a: [1, 2] })     → a deep copy
//      cloneDeep(() => {})          → throws TypeError, cause DataCloneError
//
//  Edge two: a clone is plain DATA. A class instance comes back with
//  Object.prototype and no methods. cloneInstance(instance) fixes that —
//  clone the own properties, then put the original prototype back:
//
//      cloneInstance(new Point(1, 2)) instanceof Point   → true
//
//  cloneWithout(value, keys) drops the named top-level keys and then
//  clones, so one uncloneable callback does not sink the whole object:
//
//      cloneWithout({ name: 'api', onSave() {} }, ['onSave'])
//      → { name: 'api' }
//
//  hint: `{ ...instance }` gives you the own enumerable data without the
//  prototype; `Object.create(proto)` plus Object.assign puts it back.
//  `new Error(msg, { cause })` is how you keep the original error.

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
  throw new Error('TODO');
}

export function cloneInstance(instance) {
  throw new Error('TODO');
}

export function cloneWithout(value, keys) {
  throw new Error('TODO');
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
