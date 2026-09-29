// ─────────────────────────────────────────────────────────────────────────
//  24 · duration compareTo — SOLUTION                      ★★☆ core
//  run: node 24-duration-compare.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: everything hangs off one number. compareTo reduces the
//  whole class to `Math.sign(a - b)`, and every other ordering question —
//  sort, min, max, "longer than" — is a caller of that one method. equals
//  is then just `compareTo(other) === 0` with the type check in front.
//
//  Two habits worth stealing. First, validate in the constructor so an
//  illegal Duration cannot exist; parse() only has to handle the string
//  shape and hand the number over. Second, the guard in compareTo: without
//  it, `a.compareTo(185)` reads `undefined` for other.seconds, the
//  subtraction yields NaN, Math.sign(NaN) is NaN, and your sort silently
//  produces garbage instead of throwing. Note that parse() says
//  `new Duration(...)` and not `new this(...)`, which is what lets the
//  sorting test pass it straight to .map() with no receiver.

import { test, eq, ok, throws } from '../../_lib/check.js';

export class Duration {
  constructor(seconds) {
    if (seconds < 0) throw new RangeError('duration cannot be negative');
    this.seconds = seconds;
    Object.freeze(this);
  }

  static parse(text) {
    const m = /^(\d+):([0-5]\d)$/.exec(String(text));
    if (!m) throw new SyntaxError(`bad duration: ${text}`);
    return new Duration(Number(m[1]) * 60 + Number(m[2]));
  }

  toString() {
    const minutes = Math.floor(this.seconds / 60);
    return `${minutes}:${String(this.seconds % 60).padStart(2, '0')}`;
  }

  compareTo(other) {
    if (!(other instanceof Duration)) throw new TypeError('not a Duration');
    return Math.sign(this.seconds - other.seconds);
  }

  equals(other) {
    return other instanceof Duration && this.compareTo(other) === 0;
  }

  plus(other) {
    return new Duration(this.seconds + other.seconds);
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
