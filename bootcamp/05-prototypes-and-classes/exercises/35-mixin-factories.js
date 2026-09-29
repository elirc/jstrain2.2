// ─────────────────────────────────────────────────────────────────────────
//  35 · mixin factories                                    ★★☆ core
//  concepts: class expressions · subclass factories · super
//  run: node 35-mixin-factories.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Exercise 18 copied methods onto a prototype with Object.assign. This is
//  the other way: a function that TAKES a class and returns a subclass of
//  it. Stack the calls and each mixin becomes a real link in the chain.
//
//      const Base = Serializable(Comparable(Doc));
//      class Note extends Base {}
//
//      new Note('Ship', 2).serialize()   → '{"title":"Ship","priority":2}'
//      note.compareTo(other)             → -1 / 0 / 1 via this.sortKey()
//
//  Because a mixin returns a real subclass, `super` works inside it:
//
//      Loud(Doc)     describe() → super.describe() upper-cased, plus '!'
//      Loud(Loud(Doc)) stacks — apply it twice and you get two '!'
//
//  Write the three factories as arrow functions returning anonymous class
//  expressions. Doc is provided below.
//
//  hint: `const Mixin = (Base) => class extends Base { … };` — the class
//  keyword is an expression here, so it needs no name

import { test, eq, ok } from '../../_lib/check.js';

// ── scaffolding: the base class every test composes onto ─────────────────

class Doc {
  constructor(title, priority) {
    this.title = title;
    this.priority = priority;
  }

  sortKey() {
    return this.priority;
  }

  describe() {
    return `doc ${this.title}`;
  }
}

export const Serializable = (Base) => {
  throw new Error('TODO');
};

export const Comparable = (Base) => {
  throw new Error('TODO');
};

export const Loud = (Base) => {
  throw new Error('TODO');
};

// ──────────────────────────── tests ──────────────────────────────────────

test('a composed class gets every mixed-in method', () => {
  class Note extends Serializable(Comparable(Doc)) {}
  const note = new Note('Ship', 2);
  eq(note.serialize(), '{"title":"Ship","priority":2}');
  eq(note.compareTo(new Note('Later', 5)), -1);
  eq(note.describe(), 'doc Ship', 'and still reaches the base class');
});

test('the methods are real prototype methods, not enumerable copies', () => {
  class Note extends Serializable(Doc) {}
  eq(new Note('Ship', 2).serialize(), '{"title":"Ship","priority":2}');
  const mixinProto = Object.getPrototypeOf(Note.prototype);
  eq(Object.keys(mixinProto), [], 'unlike Object.assign, which copies these');
  eq(Object.hasOwn(mixinProto, 'serialize'), true);
});

test('each mixin is one link in the prototype chain, in order', () => {
  class Note extends Serializable(Comparable(Doc)) {}
  const chain = [];
  let link = Object.getPrototypeOf(Note.prototype);
  while (link) {
    chain.push(link);
    link = Object.getPrototypeOf(link);
  }
  eq(chain.length, 4, 'Serializable, Comparable, Doc, Object');
  ok(Object.hasOwn(chain[0], 'serialize'));
  ok(Object.hasOwn(chain[1], 'compareTo'));
  ok(Object.hasOwn(chain[2], 'describe'));
  ok(chain[2] === Doc.prototype);
});

test('super works inside a mixin, so it can decorate the base', () => {
  class Note extends Loud(Doc) {}
  eq(new Note('Ship', 2).describe(), 'DOC SHIP!');
});

test('applying the same mixin twice stacks it', () => {
  class Note extends Loud(Loud(Doc)) {}
  eq(new Note('Ship', 2).describe(), 'DOC SHIP!!');
});

test('every call to a mixin builds a NEW class', () => {
  ok(Serializable(Doc) !== Serializable(Doc), 'two calls, two classes');
  const Mixed = Serializable(Doc);
  class Note extends Mixed {}
  const note = new Note('Ship', 2);
  ok(note instanceof Mixed, 'the saved one is in the chain');
  eq(note instanceof Serializable(Doc), false, 'a fresh one never will be');
  ok(note instanceof Doc, 'the base is always reachable');
});

test('one mixin serves unrelated base classes', () => {
  class Ticket {
    constructor(id) {
      this.id = id;
    }
    sortKey() {
      return this.id;
    }
  }
  class LoudTicket extends Serializable(Comparable(Ticket)) {}
  const a = new LoudTicket(1);
  eq(a.serialize(), '{"id":1}');
  eq(a.compareTo(new LoudTicket(9)), -1);
});

test('a subclass can override a mixed-in method and call super', () => {
  class Note extends Serializable(Doc) {
    serialize() {
      return `note:${super.serialize()}`;
    }
  }
  eq(new Note('Ship', 2).serialize(), 'note:{"title":"Ship","priority":2}');
});
