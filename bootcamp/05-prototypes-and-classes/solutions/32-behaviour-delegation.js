// ─────────────────────────────────────────────────────────────────────────
//  32 · behaviour delegation — SOLUTION                    ★★☆ core
//  run: node 32-behaviour-delegation.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: two one-liners build an inheritance system. Object.create
//  makes the link; Object.assign fills in the own data. Stack the links
//  and you have the same structure `class Captain extends Guard extends
//  Creature` produces — the chain is the mechanism, `extends` is the
//  spelling.
//
//  The memory story is the reason to care. 500 spawned guards each own
//  exactly one property (`name`); rally exists once, on the guard
//  behaviour, and all 500 borrow it at call time. Compose with closures
//  instead (see 28) and you get 500 copies of the function — flexible,
//  but you pay per object. That trade-off is the whole prototype/closure
//  argument in one sentence.
//
//  `this` is always the object the call started from, not the object the
//  method was found on, which is what makes one shared rally() print 500
//  different names. And there is no `super` here: to reach the version you
//  are overriding, walk one link up yourself with
//  Object.getPrototypeOf(behaviour).method.call(this) — clumsier than
//  `super.rally()`, and exactly what `super` compiles down to.

import { test, eq, ok } from '../../_lib/check.js';

export const creature = {
  describe() {
    return `${this.name} the ${this.kind}`;
  },

  is(behaviour) {
    return behaviour.isPrototypeOf(this);
  },
};

export function extendBehaviour(parent, methods) {
  return Object.assign(Object.create(parent), methods);
}

export function spawn(behaviour, data) {
  return Object.assign(Object.create(behaviour), data);
}

// ──────────────────────────── tests ──────────────────────────────────────

test('spawn links to the behaviour and copies the data in', () => {
  const c = spawn(creature, { name: 'Ada', kind: 'creature' });
  eq(c.describe(), 'Ada the creature');
  eq(Object.keys(c), ['name', 'kind'], 'data is own, behaviour is borrowed');
  eq(Object.hasOwn(c, 'describe'), false);
  ok(Object.getPrototypeOf(c) === creature);
});

test('a chain of behaviours resolves at the nearest definition', () => {
  const guard = extendBehaviour(creature, {
    rally() {
      return `${this.name} holds the line`;
    },
    patrol() {
      return `${this.name} patrols`;
    },
  });
  const captain = extendBehaviour(guard, {
    rally() {
      return `${this.name} shouts CHARGE`;
    },
  });
  const cap = spawn(captain, { name: 'Ada', kind: 'captain' });
  eq(cap.rally(), 'Ada shouts CHARGE', 'the nearest one wins');
  eq(cap.patrol(), 'Ada patrols', 'inherited from two links up');
  eq(cap.describe(), 'Ada the captain', 'and three links up');
});

test('a behaviour can extend the one it delegates to', () => {
  const guard = extendBehaviour(creature, {
    rally() {
      return `${this.name} holds the line`;
    },
  });
  const captain = extendBehaviour(guard, {
    rally() {
      return `${Object.getPrototypeOf(captain).rally.call(this)}, twice`;
    },
  });
  eq(spawn(captain, { name: 'Ada' }).rally(), 'Ada holds the line, twice');
});

test('every spawned object shares one copy of each function', () => {
  const guard = extendBehaviour(creature, {
    rally() {
      return this.name;
    },
  });
  const army = Array.from({ length: 500 }, (_, i) =>
    spawn(guard, { name: `g${i}` })
  );
  ok(army.every((g) => g.rally === army[0].rally), 'one function, 500 objects');
  eq(army[499].rally(), 'g499');
  eq(army.reduce((n, g) => n + Object.getOwnPropertyNames(g).length, 0), 500);
});

test('a method added later is visible to objects that already exist', () => {
  const guard = extendBehaviour(creature, {});
  const g = spawn(guard, { name: 'Ada', kind: 'guard' });
  creature.salute = function () {
    return `${this.name} salutes`;
  };
  eq(g.salute(), 'Ada salutes', 'lookup happens at call time');
  delete creature.salute;
});

test('assigning on one object shadows without touching its siblings', () => {
  const guard = extendBehaviour(creature, {
    rally() {
      return 'standard';
    },
  });
  const a = spawn(guard, { name: 'Ada' });
  const b = spawn(guard, { name: 'Bob' });
  a.rally = () => 'improvised';
  eq(a.rally(), 'improvised');
  eq(b.rally(), 'standard');
  eq(guard.rally(), 'standard');
});

test('is() walks the whole chain, not just the nearest link', () => {
  const guard = extendBehaviour(creature, {});
  const captain = extendBehaviour(guard, {});
  const cap = spawn(captain, { name: 'Ada' });
  eq(cap.is(captain), true);
  eq(cap.is(guard), true);
  eq(cap.is(creature), true);
  eq(spawn(guard, { name: 'Bob' }).is(captain), false);
});
