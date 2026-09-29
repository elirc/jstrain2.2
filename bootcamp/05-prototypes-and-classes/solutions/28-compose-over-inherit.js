// ─────────────────────────────────────────────────────────────────────────
//  28 · compose over inherit — SOLUTION                    ★★★ stretch
//  run: node 28-compose-over-inherit.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: inheritance forces one answer to "what is this?", and the
//  base class's promises come along whether they are true or not. The
//  override-and-throw penguin still passes `typeof bird.fly === 'function'`
//  — it satisfies the type and violates the contract, which is exactly
//  what Liskov substitution rules out. Composition asks a different
//  question, "what can this do?", and an ungranted ability is simply
//  absent, so `can('fly')` is a real answer instead of a landmine.
//
//  A capability is a function of the bird returning a bag of methods, so
//  it closes over `bird` and never needs `this` — detach duck.fly and it
//  still works, unlike a prototype method. The cost is honest and worth
//  saying out loud: one closure per bird per ability instead of one shared
//  function on a prototype. Fine for hundreds of objects, not for
//  millions — which is when you go back to a prototype (see 32).

import { test, eq, ok, throws } from '../../_lib/check.js';

// ── scaffolding: the hierarchy this exercise is refactoring away ─────────

class Bird {
  constructor(name) {
    this.name = name;
  }

  fly() {
    return `${this.name} flies away`;
  }
}

class InheritedPenguin extends Bird {
  fly() {
    throw new Error('penguins cannot fly');
  }
}

export function canFly(bird) {
  return {
    fly: () => `${bird.name} flies away`,
  };
}

export function canSwim(bird) {
  return {
    swim: () => `${bird.name} swims`,
  };
}

export function canSing(bird) {
  return {
    sing: () => `${bird.name} sings`,
  };
}

export function makeBird(name, ...capabilities) {
  const bird = {
    name,
    abilities: [],

    can(ability) {
      return typeof this[ability] === 'function';
    },

    describe() {
      const list = this.abilities.length ? this.abilities.join(', ') : 'nothing';
      return `${this.name} can ${list}`;
    },
  };

  for (const grant of capabilities) {
    const methods = grant(bird);
    bird.abilities.push(...Object.keys(methods));
    Object.assign(bird, methods);
  }

  return bird;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('a bird gets exactly the capabilities it was granted', () => {
  const eagle = makeBird('Eagle', canFly);
  eq(eagle.name, 'Eagle');
  eq(eagle.fly(), 'Eagle flies away');
  eq('swim' in eagle, false);
  eq(eagle.can('fly'), true);
  eq(eagle.can('swim'), false);
});

test('the penguin simply has no fly — nothing left to override', () => {
  const penguin = makeBird('Penguin', canSwim);
  eq(penguin.swim(), 'Penguin swims');
  eq('fly' in penguin, false);
  eq(penguin.fly, undefined);
});

test('capabilities compose, in any number', () => {
  const duck = makeBird('Duck', canFly, canSwim, canSing);
  eq(duck.fly(), 'Duck flies away');
  eq(duck.swim(), 'Duck swims');
  eq(duck.sing(), 'Duck sings');
  eq(duck.can('sing'), true);
});

test('a capability closes over the bird, so it sees later changes', () => {
  const duck = makeBird('Duck', canFly);
  duck.name = 'Donald';
  eq(duck.fly(), 'Donald flies away');
});

test('describe lists the abilities in the order they were granted', () => {
  eq(makeBird('Duck', canSwim, canFly).describe(), 'Duck can swim, fly');
  eq(makeBird('Eagle', canFly).describe(), 'Eagle can fly');
  eq(makeBird('Kiwi').describe(), 'Kiwi can nothing');
});

test('the inherited penguin lies: it has fly, it just explodes', () => {
  const liar = new InheritedPenguin('Pingu');
  eq(typeof liar.fly, 'function', 'the API says it flies');
  throws(() => liar.fly(), 'penguins cannot fly');
  const flock = [makeBird('Eagle', canFly), makeBird('Penguin', canSwim)];
  eq(flock.filter((b) => b.can('fly')).length, 1, 'asking is now honest');
});

test('capabilities can be handed out one bird at a time', () => {
  const ostrich = makeBird('Ostrich');
  eq(ostrich.can('fly'), false);
  Object.assign(ostrich, canSwim(ostrich));
  eq(ostrich.swim(), 'Ostrich swims');
  eq(makeBird('Emu').can('swim'), false, 'no other bird changed');
});

test('the price of composition: every bird owns its own functions', () => {
  const a = makeBird('Eagle', canFly);
  const b = makeBird('Hawk', canFly);
  ok(a.fly !== b.fly, 'closures cost memory — a prototype shares one copy');
  eq(Object.hasOwn(a, 'fly'), true);
});
