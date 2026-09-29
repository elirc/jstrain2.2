// ─────────────────────────────────────────────────────────────────────────
//  10 · class is sugar — SOLUTION                          ★★☆ core
//  run: node 10-class-is-sugar.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `class Tag { render() {} }` desugars to roughly
//
//      function Tag(label) { this.clicks = 0; this.label = label; }
//      Object.defineProperty(Tag.prototype, 'render',
//        { value: function () {...}, enumerable: false, writable: true });
//
//  — same objects, same links, two differences worth knowing: class
//  methods are non-enumerable (so `for...in` and Object.keys skip them,
//  which is why the last test sees an empty Object.keys(Tag.prototype)),
//  and the whole class body runs in strict mode.
//
//  whereDoesItLive is just the two questions side by side: hasOwn asks
//  about one object, `in` asks the entire chain. The last exercise's
//  allPropertyNames is the manual version of what `in` does for you.

import { test, eq } from '../../_lib/check.js';

// ── scaffolding: an ordinary class, already written ──────────────────────

export class Tag {
  clicks = 0;

  constructor(label) {
    this.label = label;
  }

  render() {
    return `<b>${this.label}</b>`;
  }

  bump() {
    this.clicks += 1;
    return this.clicks;
  }

  get loud() {
    return this.label.toUpperCase();
  }
}

export function whereDoesItLive(obj, key) {
  if (Object.hasOwn(obj, key)) return 'own';
  return key in obj ? 'prototype' : 'missing';
}

export function methodNames(Ctor) {
  return Object.getOwnPropertyNames(Ctor.prototype)
    .filter((name) => name !== 'constructor')
    .sort();
}

// ──────────────────────────── tests ──────────────────────────────────────

test('a class field lands on the instance', () => {
  eq(whereDoesItLive(new Tag('a'), 'clicks'), 'own');
});

test('so does anything the constructor assigns', () => {
  eq(whereDoesItLive(new Tag('a'), 'label'), 'own');
});

test('methods do NOT — they live on Tag.prototype', () => {
  eq(whereDoesItLive(new Tag('a'), 'render'), 'prototype');
  eq(whereDoesItLive(new Tag('a'), 'loud'), 'prototype');
});

test('the chain keeps going past Tag.prototype', () => {
  eq(whereDoesItLive(new Tag('a'), 'toString'), 'prototype');
});

test('unknown keys are missing, not own', () => {
  eq(whereDoesItLive(new Tag('a'), 'nope'), 'missing');
});

test('methodNames finds every method the class declared', () => {
  eq(methodNames(Tag), ['bump', 'loud', 'render']);
});

test('it works the same on a constructor function', () => {
  function Legacy() {}
  Legacy.prototype.ping = function () {};
  eq(methodNames(Legacy), ['ping']);
});

test('fields are enumerable, methods are not', () => {
  const t = new Tag('a');
  eq(whereDoesItLive(t, 'render'), 'prototype');
  eq(Object.keys(t).sort(), ['clicks', 'label']);
  eq(Object.keys(Tag.prototype), []);
});
