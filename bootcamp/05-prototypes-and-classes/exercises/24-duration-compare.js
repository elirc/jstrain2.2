// ─────────────────────────────────────────────────────────────────────────
//  24 · duration compareTo                                 ★★☆ core
//  concepts: compareTo · ordering · static parse
//  run: node 24-duration-compare.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A value object that has an ORDER needs one more method than equals():
//  compareTo, returning a negative number, zero or a positive one. Write it
//  once and every sort, min, max and "is this longer than that" follows.
//
//      const d = Duration.parse('3:05');
//      d.seconds              → 185
//      String(d)              → '3:05'
//      d.compareTo(Duration.parse('0:30'))  →  1
//      d.compareTo(Duration.parse('3:05'))  →  0
//      d.equals(Duration.parse('3:05'))     → true
//      d.plus(new Duration(55))             → 4:00, d unchanged
//      list.sort((a, b) => a.compareTo(b))  → shortest first
//
//  Return exactly -1, 0 or 1. Reject junk early: parse('later') throws
//  'bad duration', new Duration(-5) throws 'duration cannot be negative',
//  and comparing against anything that is not a Duration throws
//  'not a Duration' — a bare number is the slip that costs you an hour.
//
//  hint: Math.sign turns any difference into -1 / 0 / 1, and
//  String(s % 60).padStart(2, '0') gives you the seconds field

import { test, eq, ok, throws } from '../../_lib/check.js';

export class Duration {
  constructor(seconds) {
    throw new Error('TODO');
  }

  static parse(text) {
    throw new Error('TODO');
  }

  toString() {
    throw new Error('TODO');
  }

  compareTo(other) {
    throw new Error('TODO');
  }

  equals(other) {
    throw new Error('TODO');
  }

  plus(other) {
    throw new Error('TODO');
  }
}

// ──────────────────────────── tests ──────────────────────────────────────

test('parse and toString round-trip', () => {
  eq(Duration.parse('3:05').seconds, 185);
  eq(String(Duration.parse('3:05')), '3:05');
  eq(Duration.parse('0:07').seconds, 7);
  eq(String(Duration.parse('0:07')), '0:07');
});

test('toString pads the seconds field to two digits', () => {
  eq(String(new Duration(61)), '1:01');
  eq(String(new Duration(0)), '0:00');
  eq(String(new Duration(3600)), '60:00', 'minutes are not capped at 59');
});

test('compareTo answers with the sign of the difference', () => {
  const short = new Duration(30);
  const long = new Duration(185);
  eq(short.compareTo(long), -1);
  eq(long.compareTo(short), 1);
  eq(long.compareTo(new Duration(185)), 0);
});

test('equals agrees with compareTo === 0', () => {
  const a = new Duration(185);
  const b = new Duration(185);
  eq(a.equals(b), true);
  eq(a.compareTo(b) === 0, a.equals(b));
  eq(a.equals(new Duration(184)), false);
  eq(a.equals({ seconds: 185 }), false, 'a look-alike is not a Duration');
});

test('one compareTo gives you sorting for free', () => {
  const list = ['3:05', '0:30', '10:00', '1:00'].map(Duration.parse);
  const sorted = list.sort((a, b) => a.compareTo(b)).map(String);
  eq(sorted, ['0:30', '1:00', '3:05', '10:00']);
});

test('plus returns a new duration and leaves both alone', () => {
  const a = new Duration(185);
  const b = new Duration(55);
  const total = a.plus(b);
  eq(String(total), '4:00');
  eq(a.seconds, 185);
  eq(b.seconds, 55);
  ok(total instanceof Duration);
});

test('junk is rejected at the door', () => {
  throws(() => Duration.parse('later'), 'bad duration');
  throws(() => Duration.parse('3:5:9'), 'bad duration');
  throws(() => Duration.parse(''), 'bad duration');
  throws(() => new Duration(-5), 'duration cannot be negative');
});

test('comparing against a non-Duration throws instead of lying', () => {
  const a = new Duration(185);
  throws(() => a.compareTo(185), 'not a Duration');
  throws(() => a.compareTo({ seconds: 185 }), 'not a Duration');
  throws(() => a.compareTo(null), 'not a Duration');
});
