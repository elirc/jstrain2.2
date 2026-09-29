// ─────────────────────────────────────────────────────────────────────────
//  28 · compose over inherit                               ★★★ stretch
//  concepts: composition · capabilities · Liskov
//  run: node 28-compose-over-inherit.js
// ─────────────────────────────────────────────────────────────────────────
//
//  The textbook hierarchy — Bird has fly(), Penguin extends Bird — breaks
//  on the first penguin. The usual patch is to override fly() and throw,
//  which leaves an object that ADVERTISES a method it cannot honour. Every
//  caller now needs a special case, and that is the tax inheritance
//  charges when the base class promised too much.
//
//  Refactor it: a bird gets only the capabilities it is granted.
//
//      const eagle   = makeBird('Eagle', canFly);
//      const penguin = makeBird('Penguin', canSwim);
//      const duck    = makeBird('Duck', canFly, canSwim);
//
//      eagle.fly()          → 'Eagle flies away'
//      penguin.swim()       → 'Penguin swims'
//      duck.sing()          → 'Duck sings'
//      'fly' in penguin     → false      (nothing to throw)
//      duck.can('swim')     → true
//      duck.describe()      → 'Duck can fly, swim'
//      makeBird('Kiwi').describe() → 'Kiwi can nothing'
//
//  Each capability is a function that takes the bird and returns an object
//  of methods. makeBird copies those onto the bird and remembers their
//  names, in the order they were granted.
//
//  hint: `Object.keys(methods)` gives you the ability names to remember,
//  and the capability closes over `bird`, so `bird.name` stays live

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
  throw new Error('TODO');
}

export function canSwim(bird) {
  throw new Error('TODO');
}

export function canSing(bird) {
  throw new Error('TODO');
}

export function makeBird(name, ...capabilities) {
  throw new Error('TODO');
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
