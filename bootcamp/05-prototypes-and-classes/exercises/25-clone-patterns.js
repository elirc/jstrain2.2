// ─────────────────────────────────────────────────────────────────────────
//  25 · clone patterns                                     ★☆☆ warm-up
//  concepts: copy constructors · static from · this.constructor
//  run: node 25-clone-patterns.js
// ─────────────────────────────────────────────────────────────────────────
//
//  "Give me another one of these, just like this one" shows up in every
//  codebase. Three pieces do it properly:
//
//      Contact.from(other)   a static factory that reads any contact-shaped
//                            object and builds a real Contact
//      c.clone()             an instance asking its OWN class for a copy
//      c.withEmail(next)     a copy with one field changed
//
//      const ada = new Contact('Ada', 'ada@x.dev', ['friend']);
//      const copy = Contact.from(ada);
//      copy.tags.push('work');   → ada.tags is still ['friend']
//      ada.withEmail('a@y.dev').email → 'a@y.dev', ada.email unchanged
//
//  The array must be copied everywhere — in the constructor and in from()
//  — or two contacts end up sharing one tags array. And clone() must work
//  for subclasses too: a VipContact clone is a VipContact.
//
//  hint: inside a static, `this` is the class the call was made on, so
//  `new this(...)` builds the subclass when a subclass is doing the asking

import { test, eq, ok } from '../../_lib/check.js';

export class Contact {
  constructor(name, email, tags = []) {
    throw new Error('TODO');
  }

  static from(other) {
    throw new Error('TODO');
  }

  clone() {
    throw new Error('TODO');
  }

  withEmail(email) {
    throw new Error('TODO');
  }
}

// ──────────────────────────── tests ──────────────────────────────────────

test('from builds an equal but separate object', () => {
  const ada = new Contact('Ada', 'ada@x.dev', ['friend']);
  const copy = Contact.from(ada);
  eq(copy, ada, 'same fields, same class');
  ok(copy !== ada, 'but a different object');
  ok(copy instanceof Contact);
});

test('the copy does not share the tags array', () => {
  const ada = new Contact('Ada', 'ada@x.dev', ['friend']);
  const copy = Contact.from(ada);
  copy.tags.push('work');
  eq(ada.tags, ['friend']);
  eq(copy.tags, ['friend', 'work']);
});

test('the constructor copies its tags argument too', () => {
  const shared = ['friend'];
  const a = new Contact('Ada', 'ada@x.dev', shared);
  const b = new Contact('Bob', 'bob@x.dev', shared);
  a.tags.push('work');
  eq(b.tags, ['friend'], 'two contacts must never share one array');
  eq(shared, ['friend']);
});

test('from accepts any object with the right shape', () => {
  const raw = { name: 'Ada', email: 'ada@x.dev', tags: ['friend'] };
  const c = Contact.from(raw);
  ok(c instanceof Contact);
  eq(c.name, 'Ada');
  eq(c.tags, ['friend']);
});

test('clone asks the OWN class, so subclasses stay themselves', () => {
  class VipContact extends Contact {
    get label() {
      return `VIP ${this.name}`;
    }
  }
  const v = new VipContact('Ada', 'ada@x.dev', ['friend']);
  const copy = v.clone();
  ok(copy instanceof VipContact, 'hard-coding `new Contact` loses the type');
  eq(copy.label, 'VIP Ada');
  ok(copy !== v);
});

test('withEmail changes one field on a copy and leaves the original', () => {
  const ada = new Contact('Ada', 'ada@x.dev', ['friend']);
  const moved = ada.withEmail('ada@y.dev');
  eq(moved.email, 'ada@y.dev');
  eq(ada.email, 'ada@x.dev');
  eq(moved.name, 'Ada');
  eq(moved.tags, ['friend']);
  ok(moved.tags !== ada.tags);
});
