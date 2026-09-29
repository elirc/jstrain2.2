// ─────────────────────────────────────────────────────────────────────────
//  18 · mixins — SOLUTION                                  ★★★ stretch
//  run: node 18-mixins.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `mixin` is one line — Object.assign(Target.prototype,
//  ...behaviours) — because a prototype is just an object and methods are
//  just properties. Copying them in makes every existing and future
//  instance find them by delegation. Later sources overwrite earlier
//  ones, which is where "last one wins" comes from.
//
//  Comparable is written against a HOOK, `this.sortKey()`, not against
//  Task. Any class that answers sortKey can take the mixin — duck typing
//  as an explicit contract. This is composition: pick the behaviours you
//  want instead of inheriting a chain you mostly do not.
//
//  Two costs to know. Copied methods are enumerable (the last test), so
//  they show up in `for...in` and in Object.keys of the prototype, unlike
//  real class methods — use Object.defineProperties if that matters.
//  And there is no `super`: a mixin cannot call the method it replaced.
//  The alternative pattern, `const Serializable = (Base) => class extends
//  Base { ... }`, keeps super at the price of a real chain link.

import { test, eq, ok } from '../../_lib/check.js';

// ── scaffolding: a fresh, un-mixed class for every test ──────────────────

function taskClass() {
  return class Task {
    constructor(title, priority) {
      this.title = title;
      this.priority = priority;
    }

    sortKey() {
      return this.priority;
    }
  };
}

export const Serializable = {
  toJSON() {
    return { ...this };
  },

  serialize() {
    return JSON.stringify(this.toJSON());
  },
};

export const Comparable = {
  compareTo(other) {
    const mine = this.sortKey();
    const theirs = other.sortKey();
    if (mine < theirs) return -1;
    return mine > theirs ? 1 : 0;
  },

  isBefore(other) {
    return this.compareTo(other) < 0;
  },
};

export function mixin(Target, ...behaviours) {
  Object.assign(Target.prototype, ...behaviours);
  return Target;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('mixin returns the class and lands the methods on its prototype', () => {
  const Task = mixin(taskClass(), Serializable);
  ok(Object.hasOwn(Task.prototype, 'serialize'));
  ok(Object.hasOwn(Task.prototype, 'toJSON'));
});

test('serialize writes out the instance fields', () => {
  const Task = mixin(taskClass(), Serializable);
  const t = new Task('Ship', 2);
  eq(t.toJSON(), { title: 'Ship', priority: 2 });
  eq(t.serialize(), '{"title":"Ship","priority":2}');
  eq(JSON.stringify(t), '{"title":"Ship","priority":2}', 'toJSON is free');
});

test('mixed-in methods are shared, exactly like class methods', () => {
  const Task = mixin(taskClass(), Serializable);
  const a = new Task('a', 1);
  const b = new Task('b', 2);
  ok(a.serialize === b.serialize);
  eq(Object.hasOwn(a, 'serialize'), false);
});

test('Comparable leans on the host class sortKey hook', () => {
  const Task = mixin(taskClass(), Comparable);
  const soon = new Task('soon', 1);
  const later = new Task('later', 5);
  eq(soon.compareTo(later), -1);
  eq(later.compareTo(soon), 1);
  eq(soon.compareTo(new Task('same', 1)), 0);
  eq(soon.isBefore(later), true);
});

test('so sorting works with no comparator knowledge of Task', () => {
  const Task = mixin(taskClass(), Comparable);
  const list = [new Task('c', 3), new Task('a', 1), new Task('b', 2)];
  const sorted = list.sort((x, y) => x.compareTo(y)).map((t) => t.title);
  eq(sorted, ['a', 'b', 'c']);
});

test('two behaviours compose, and the last one wins a clash', () => {
  const Loud = { serialize: () => 'LOUD' };
  const Task = mixin(taskClass(), Serializable, Comparable, Loud);
  const t = new Task('Ship', 2);
  eq(t.serialize(), 'LOUD');
  eq(t.compareTo(new Task('x', 9)), -1);
});

test('other classes are untouched — nothing is global', () => {
  const Mixed = mixin(taskClass(), Serializable);
  const Plain = taskClass();
  eq('serialize' in new Mixed('a', 1), true);
  eq('serialize' in new Plain('a', 1), false);
});

test('but Object.assign copies as ENUMERABLE, unlike class methods', () => {
  const Task = mixin(taskClass(), Serializable);
  eq(Object.keys(Task.prototype).sort(), ['serialize', 'toJSON']);
  eq(Object.keys(taskClass().prototype), []);
});
