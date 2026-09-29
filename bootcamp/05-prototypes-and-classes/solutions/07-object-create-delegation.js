// ─────────────────────────────────────────────────────────────────────────
//  07 · delegation with Object.create — SOLUTION           ★★☆ core
//  run: node 07-object-create-delegation.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `Object.create(robotBehaviour)` creates an object with a
//  LINK to robotBehaviour. Nothing is copied. When you call `r.greet()`,
//  the engine looks on `r`, misses, follows the link, finds `greet` on
//  robotBehaviour — and still calls it with `this === r`. That is
//  delegation: shared code, per-object data.
//
//  Two consequences the tests pin down. Adding a method to the prototype
//  later is visible to objects that already exist, because lookup happens
//  at call time. And ASSIGNMENT never walks the chain: `a.greet = ...`
//  creates an own property that shadows the shared one for `a` only.
//
//  This is the whole machine. `new`, `class` and `extends` are ways to
//  set up exactly these links with less typing.

import { test, eq, ok } from '../../_lib/check.js';

export const robotBehaviour = {
  greet() {
    return `Hi, I am ${this.name}`;
  },

  rename(next) {
    this.name = next;
    return this;
  },
};

export function createRobot(name) {
  const robot = Object.create(robotBehaviour);
  robot.name = name;
  return robot;
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
