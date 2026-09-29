// ─────────────────────────────────────────────────────────────────────────
//  12 · static members — SOLUTION                          ★★☆ core
//  run: node 12-static-members.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: a class is an object too, and `static x` is a property of
//  that object — `User.create`, not `User.prototype.create`. Instances
//  delegate to User.prototype, and User.prototype does NOT delegate to
//  User, so `ada.create` is undefined. That asymmetry is the last test.
//
//  The static factory pattern: make the constructor dumb (it just stores
//  what it is handed) and let `create` own the interesting policy —
//  validation, id assignment, registration. Callers get one obvious door.
//
//  `isValidName` is static because it needs no instance; both `create`
//  and `rename` call it, so the rule cannot drift. `reset` exists purely
//  so tests can start from a known state — a nudge that global mutable
//  state (which is what a static registry is) has to be resettable.

import { test, eq, ok, throws } from '../../_lib/check.js';

export class User {
  static #registry = new Map();
  static #nextId = 1;

  constructor(id, name) {
    this.id = id;
    this.name = name;
  }

  static isValidName(name) {
    return typeof name === 'string' && name.trim().length > 0;
  }

  static create(name) {
    if (!User.isValidName(name)) throw new TypeError('name is required');
    const user = new User(User.#nextId, name.trim());
    User.#nextId += 1;
    User.#registry.set(user.id, user);
    return user;
  }

  static find(id) {
    return User.#registry.get(id);
  }

  static get count() {
    return User.#registry.size;
  }

  static reset() {
    User.#registry.clear();
    User.#nextId = 1;
  }

  describe() {
    return `#${this.id} ${this.name}`;
  }

  rename(next) {
    if (!User.isValidName(next)) throw new TypeError('name is required');
    this.name = next.trim();
    return this;
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
