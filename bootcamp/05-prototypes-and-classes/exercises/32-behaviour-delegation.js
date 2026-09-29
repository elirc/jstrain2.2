// ─────────────────────────────────────────────────────────────────────────
//  32 · behaviour delegation                               ★★☆ core
//  concepts: Object.create · prototype chains · shared behaviour
//  run: node 32-behaviour-delegation.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Exercise 07 linked an object to one behaviour object. Now stack them:
//  behaviour objects that delegate to other behaviour objects, with the
//  data at the bottom. This is what a game entity system looks like when
//  you skip classes — and what `extends` is doing underneath.
//
//      const creature = { describe(), is(behaviour) }   ← you write these
//      const guard   = extendBehaviour(creature, { rally() {…} });
//      const captain = extendBehaviour(guard,    { rally() {…} });
//
//      const cap = spawn(captain, { name: 'Ada', kind: 'captain' });
//      cap.describe()          → 'Ada the captain'   (found 3 links up)
//      cap.rally()             → captain's version wins
//      cap.is(creature)        → true   (anywhere in the chain counts)
//      Object.keys(cap)        → ['name', 'kind']    data only
//
//  spawn() must link the new object to the behaviour and copy the data in
//  as own properties. Ten thousand guards then share ONE rally function —
//  that is the memory story delegation is really about.
//
//  hint: `Object.create(proto)` makes the link and `Object.assign(obj,
//  data)` fills in the own properties; `proto.isPrototypeOf(obj)` walks
//  the whole chain for you

import { test, eq, ok } from '../../_lib/check.js';

export const creature = {
  describe() {
    throw new Error('TODO');
  },

  is(behaviour) {
    throw new Error('TODO');
  },
};

export function extendBehaviour(parent, methods) {
  throw new Error('TODO');
}

export function spawn(behaviour, data) {
  throw new Error('TODO');
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
