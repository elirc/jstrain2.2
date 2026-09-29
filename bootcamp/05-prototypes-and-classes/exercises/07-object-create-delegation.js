// ─────────────────────────────────────────────────────────────────────────
//  07 · delegation with Object.create                      ★★☆ core
//  concepts: Object.create · delegation · shadowing
//  run: node 07-object-create-delegation.js
// ─────────────────────────────────────────────────────────────────────────
//
//  No constructors, no classes — just one object borrowing behaviour from
//  another. Fill in `robotBehaviour` (the shared methods) and
//  createRobot(name), which must link a new object TO that behaviour
//  object and give it its own `name`.
//
//      const r = createRobot('Ada');
//      r.greet()                                → 'Hi, I am Ada'
//      Object.getPrototypeOf(r) === robotBehaviour   → true
//      Object.hasOwn(r, 'greet')                → false   (it is borrowed)
//      r.rename('Bob').greet()                  → 'Hi, I am Bob'
//
//  hint: Object.create(proto) returns a new object whose prototype link
//  points at `proto` — nothing is copied

import { test, eq, ok } from '../../_lib/check.js';

export const robotBehaviour = {
  greet() {
    throw new Error('TODO');
  },

  rename(next) {
    throw new Error('TODO');
  },
};

export function createRobot(name) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('greet reads the name of the object it was called on', () => {
  eq(createRobot('Ada').greet(), 'Hi, I am Ada');
  eq(createRobot('Bob').greet(), 'Hi, I am Bob');
});

test('the shared behaviour object IS the prototype', () => {
  const r = createRobot('Ada');
  ok(Object.getPrototypeOf(r) === robotBehaviour);
});

test('only `name` is an own property — greet is borrowed', () => {
  const r = createRobot('Ada');
  eq(Object.keys(r), ['name']);
  eq(Object.hasOwn(r, 'greet'), false);
  eq('greet' in r, true);
});

test('every robot uses the very same function object', () => {
  const a = createRobot('Ada');
  const b = createRobot('Bob');
  ok(a.greet === b.greet);
  ok(a.greet === robotBehaviour.greet);
});

test('rename changes the instance and returns it for chaining', () => {
  const a = createRobot('Ada');
  const b = createRobot('Bob');
  eq(a.rename('Zed').greet(), 'Hi, I am Zed');
  eq(b.greet(), 'Hi, I am Bob', 'the prototype must not be touched');
});

test('a method added to the prototype later shows up immediately', () => {
  const r = createRobot('Ada');
  robotBehaviour.shout = function () {
    return `${this.name.toUpperCase()}!`;
  };
  eq(r.shout(), 'ADA!', 'lookup happens at call time, not at creation');
});

test('assigning on the instance shadows the shared method', () => {
  const a = createRobot('Ada');
  const b = createRobot('Bob');
  a.greet = () => 'custom';
  eq(a.greet(), 'custom');
  eq(b.greet(), 'Hi, I am Bob');
  eq(Object.hasOwn(a, 'greet'), true);
});
