// ─────────────────────────────────────────────────────────────────────────
//  18 · mixins                                             ★★★ stretch
//  concepts: Object.assign · composition · duck typing
//  run: node 18-mixins.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A class can only extend one thing. Behaviours you want to sprinkle on
//  many unrelated classes go in plain objects instead, copied onto a
//  prototype. That is all a mixin is.
//
//    Serializable   toJSON()    → a plain object of the own fields
//                   serialize() → JSON.stringify of that
//    Comparable     compareTo(other) → -1 / 0 / 1, using the host class's
//                                      own sortKey() hook
//                   isBefore(other)  → true when compareTo is negative
//    mixin(Target, ...behaviours) → copies them onto Target.prototype and
//                                   returns Target
//
//      const Task = mixin(taskClass(), Serializable, Comparable);
//      const t = new Task('Ship', 2);
//      t.serialize()                     → '{"title":"Ship","priority":2}'
//      t.compareTo(new Task('Later', 5))     → -1
//      [b, a].sort((x, y) => x.compareTo(y)) → [a, b]
//
//  Comparable never mentions Task — it calls this.sortKey(), which the
//  host must provide. That contract is the whole design.
//
//  hint: Object.assign(target, ...sources) copies own enumerable
//  properties — methods in an object literal qualify

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
    throw new Error('TODO');
  },

  serialize() {
    throw new Error('TODO');
  },
};

export const Comparable = {
  compareTo(other) {
    throw new Error('TODO');
  },

  isBefore(other) {
    throw new Error('TODO');
  },
};

export function mixin(Target, ...behaviours) {
  throw new Error('TODO');
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
