// ─────────────────────────────────────────────────────────────────────────
//  25 · clone patterns — SOLUTION                          ★☆☆ warm-up
//  run: node 25-clone-patterns.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: three layers, each doing one job. The constructor owns the
//  copying rule (`[...tags]`), from() knows how to read a contact-shaped
//  thing, and clone() just routes: `this.constructor.from(this)`.
//
//  The two details that matter are both about who builds what. `new this()`
//  inside a static means "the class this call was made on", so
//  VipContact.from() returns a VipContact — write `new Contact()` there and
//  every subclass silently degrades into a base instance. And copying the
//  array in ONE place (the constructor) means from(), clone() and
//  withEmail() all inherit the fix; a shared array between two contacts is
//  the bug that shows up a week later as "editing Ada changed Bob".

import { test, eq, ok } from '../../_lib/check.js';

export class Contact {
  constructor(name, email, tags = []) {
    this.name = name;
    this.email = email;
    this.tags = [...tags];
  }

  static from(other) {
    return new this(other.name, other.email, other.tags);
  }

  clone() {
    return this.constructor.from(this);
  }

  withEmail(email) {
    const copy = this.clone();
    copy.email = email;
    return copy;
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
