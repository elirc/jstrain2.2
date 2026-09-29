// ─────────────────────────────────────────────────────────────────────────
//  12 · static members                                     ★★☆ core
//  concepts: static methods · static fields · registries
//  run: node 12-static-members.js
// ─────────────────────────────────────────────────────────────────────────
//
//  `static` puts a property on the CLASS object itself, not on the
//  prototype — so instances never see it. Use that for things that belong
//  to the type as a whole: id counters, registries, validators, factories.
//
//  Build a User whose ids and registry live on the class:
//
//      const ada = User.create('Ada');
//      ada.id                   → 1
//      User.create('Bob').id    → 2
//      User.find(1) === ada     → true
//      User.count               → 2      (a static getter)
//      User.reset();  User.count → 0     (and ids restart at 1)
//      ada.describe()           → '#1 Ada'
//      User.isValidName('  ')   → false
//      ada.rename('')           → throws 'name is required'
//
//  create() and rename() must both call the SAME static validator, and
//  create() trims the name before storing it. Keep the registry and the
//  id counter in private static fields.
//
//  hint: inside the class, write `User.#registry` (or `this.#registry`
//  in a static method) — private statics live on the class object

import { test, eq, ok, throws } from '../../_lib/check.js';

export class User {
  constructor(id, name) {
    throw new Error('TODO');
  }

  static isValidName(name) {
    throw new Error('TODO');
  }

  static create(name) {
    throw new Error('TODO');
  }

  static find(id) {
    throw new Error('TODO');
  }

  static get count() {
    throw new Error('TODO');
  }

  static reset() {
    throw new Error('TODO');
  }

  describe() {
    throw new Error('TODO');
  }

  rename(next) {
    throw new Error('TODO');
  }
}

// ──────────────────────────── tests ──────────────────────────────────────

test('create hands out increasing ids', () => {
  User.reset();
  eq(User.create('Ada').id, 1);
  eq(User.create('Bob').id, 2);
  eq(User.create('Cy').id, 3);
});

test('find returns the very same instance', () => {
  User.reset();
  const ada = User.create('Ada');
  ok(User.find(1) === ada);
  eq(User.find(99), undefined);
});

test('count tracks the registry, reset empties it', () => {
  User.reset();
  User.create('Ada');
  User.create('Bob');
  eq(User.count, 2);
  User.reset();
  eq(User.count, 0);
  eq(User.create('Zed').id, 1, 'ids restart after a reset');
});

test('create trims the name and describe formats it', () => {
  User.reset();
  const ada = User.create('  Ada  ');
  eq(ada.name, 'Ada');
  eq(ada.describe(), '#1 Ada');
});

test('the validator is shared by create and rename', () => {
  User.reset();
  const ada = User.create('Ada');
  eq(User.isValidName('Ada'), true);
  eq(User.isValidName('   '), false);
  eq(User.isValidName(42), false);
  throws(() => User.create(''), 'name is required');
  throws(() => ada.rename('  '), 'name is required');
  eq(ada.name, 'Ada', 'a refused rename changes nothing');
});

test('rename works and chains', () => {
  User.reset();
  const ada = User.create('Ada');
  eq(ada.rename('Ada L.').describe(), '#1 Ada L.');
});

test('statics belong to the class, not to instances', () => {
  User.reset();
  const ada = User.create('Ada');
  eq(ada.create, undefined);
  eq(ada.count, undefined);
  ok(typeof User.create === 'function');
  eq(Object.hasOwn(User.prototype, 'create'), false);
});
