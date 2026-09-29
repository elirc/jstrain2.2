// ─────────────────────────────────────────────────────────────────────────
//  22 · toStringTag and brands                             ★★☆ core
//  concepts: Symbol.toStringTag · brand checks · private-in
//  run: node 22-tostringtag-brands.js
// ─────────────────────────────────────────────────────────────────────────
//
//  `typeof` has five useful answers and calls everything else 'object'.
//  The old trick that does better is Object.prototype.toString, which reads
//  a hidden label — and Symbol.toStringTag lets your class supply its own.
//
//      typeTag(null)              → 'Null'
//      typeTag([])                → 'Array'
//      typeTag(new Ticket('T-1')) → 'Ticket'
//
//  But a label is decoration: anyone can copy it. For "is this really one
//  of mine?" use a BRAND — a private field only your constructor installs.
//
//      Ticket.isTicket(new Ticket('T-1'))            → true
//      Ticket.isTicket({ [Symbol.toStringTag]: 'Ticket' }) → false
//      Ticket.isTicket(3)                            → false, and no throw
//
//  Build typeTag(value), then Ticket with an `id` getter, a toStringTag
//  getter, and the static brand check.
//
//  hint: `#id in value` is the brand test — but it throws a TypeError when
//  value is a primitive, so screen those out first

import { test, eq, ok } from '../../_lib/check.js';

export function typeTag(value) {
  throw new Error('TODO');
}

export class Ticket {
  #id;

  constructor(id) {
    throw new Error('TODO');
  }

  get id() {
    throw new Error('TODO');
  }

  get [Symbol.toStringTag]() {
    throw new Error('TODO');
  }

  static isTicket(value) {
    throw new Error('TODO');
  }
}

// ──────────────────────────── tests ──────────────────────────────────────

test('typeTag names the built-ins that typeof lumps together', () => {
  eq(typeTag(null), 'Null');
  eq(typeTag(undefined), 'Undefined');
  eq(typeTag([]), 'Array');
  eq(typeTag(new Date(0)), 'Date');
  eq(typeTag(/x/), 'RegExp');
  eq(typeTag(new Map()), 'Map');
  eq(typeTag(7), 'Number');
  eq([typeof null, typeof [], typeof new Map()], ['object', 'object', 'object']);
});

test('a plain object is still just Object', () => {
  eq(typeTag({}), 'Object');
  eq(typeTag(Object.create(null)), 'Object');
});

test('a Ticket announces its own tag', () => {
  const t = new Ticket('T-1');
  eq(typeTag(t), 'Ticket');
  eq(String(t), '[object Ticket]');
  eq(t.id, 'T-1');
});

test('the tag is a symbol key, so it stays out of the data', () => {
  const t = new Ticket('T-1');
  eq(Object.keys(t), []);
  eq(JSON.stringify(t), '{}');
  eq(Object.getOwnPropertyNames(t), []);
});

test('a look-alike can copy the tag but not the brand', () => {
  const fake = { id: 'T-1', [Symbol.toStringTag]: 'Ticket' };
  eq(typeTag(fake), 'Ticket', 'the label is decoration — anyone can wear it');
  eq(Ticket.isTicket(fake), false);
  eq(fake instanceof Ticket, false);
  eq(Ticket.isTicket(new Ticket('T-2')), true);
});

test('the brand travels to subclasses, because they call super()', () => {
  class RushTicket extends Ticket {}
  const r = new RushTicket('T-9');
  eq(Ticket.isTicket(r), true);
  eq(r.id, 'T-9');
});

test('instanceof can be true for something the constructor never built', () => {
  const hollow = Object.create(Ticket.prototype);
  eq(hollow instanceof Ticket, true, 'the chain says yes...');
  eq(Ticket.isTicket(hollow), false, '...but no constructor ever ran');
});

test('the brand check answers false for primitives instead of throwing', () => {
  eq(Ticket.isTicket(3), false);
  eq(Ticket.isTicket('T-1'), false);
  eq(Ticket.isTicket(null), false);
  eq(Ticket.isTicket(undefined), false);
  ok(Ticket.isTicket(new Ticket('T-3')));
});
