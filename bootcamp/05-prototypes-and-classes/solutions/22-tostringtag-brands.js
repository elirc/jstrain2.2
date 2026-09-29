// ─────────────────────────────────────────────────────────────────────────
//  22 · toStringTag and brands — SOLUTION                  ★★☆ core
//  run: node 22-tostringtag-brands.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: Object.prototype.toString returns '[object X]', where X
//  comes from an internal slot for built-ins and from Symbol.toStringTag
//  for everything else. Slicing off the fixed 8-character prefix and the
//  final ']' leaves the name. It is the only check that separates null,
//  arrays, Dates and Maps without a pile of special cases.
//
//  Then the point of the exercise: a tag is a LABEL and a brand is a
//  FACT. `#id in value` is true only for objects your constructor ran on,
//  so it beats both the tag (copyable) and instanceof (Object.create can
//  fake the chain, and it breaks across realms). The catch is that
//  private-in throws a TypeError on primitives, so the guard comes first.

import { test, eq, ok } from '../../_lib/check.js';

export function typeTag(value) {
  return Object.prototype.toString.call(value).slice(8, -1);
}

export class Ticket {
  #id;

  constructor(id) {
    this.#id = id;
  }

  get id() {
    return this.#id;
  }

  get [Symbol.toStringTag]() {
    return 'Ticket';
  }

  static isTicket(value) {
    return typeof value === 'object' && value !== null && #id in value;
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
