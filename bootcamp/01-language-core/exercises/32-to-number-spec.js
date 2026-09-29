// ─────────────────────────────────────────────────────────────────────────
//  32 · the ToNumber table                                   ★★★ stretch
//  concepts: ToNumber · ToPrimitive · what every operator really calls
//  run: node 32-to-number-spec.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Every arithmetic operator runs the same abstract algorithm on its
//  operands. Implement it, so the table stops being something you memorise
//  and starts being something you can read:
//
//      undefined  → NaN            null      → 0
//      true / false → 1 / 0        number    → itself
//      string     → Number(text), so '' and '  ' are 0
//      bigint     → TypeError      symbol    → TypeError
//      object     → convert to a primitive first, then start over
//
//      specNumber([])        → 0        specNumber([5])   → 5
//      specNumber(['1','2']) → NaN      specNumber({})    → NaN
//      specNumber(new Date(86400000))   → 86400000
//
//  The object step is toPrimitiveNumber(object), the 'number'-hint half of
//  ToPrimitive: use object[Symbol.toPrimitive]('number') if there is one,
//  otherwise try valueOf() then toString(), taking the first result that
//  is not an object. If neither gives a primitive, throw a TypeError whose
//  message mentions 'primitive'.
//
//  The refusals must be TypeErrors whose message contains the typeof name
//  ('bigint', 'symbol') — this is why `+1n` throws while `Number(1n)`, a
//  different function with a special case, does not.
//
//  hint: `Number(text)` is allowed for the string branch only; every other
//  line has to be an explicit decision. specNumber calls itself once the
//  object has been flattened.

import { test, eq, throws } from '../../_lib/check.js';

export function specNumber(value) {
  throw new Error('TODO');
}

export function toPrimitiveNumber(object) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('the four values with fixed answers', () => {
  eq(specNumber(undefined), NaN);
  eq(specNumber(null), 0);
  eq(specNumber(true), 1);
  eq(specNumber(false), 0);
});

test('numbers pass through untouched, NaN and -0 included', () => {
  eq(specNumber(7.5), 7.5);
  eq(specNumber(-3), -3);
  eq(specNumber(NaN), NaN);
  eq(specNumber(-0), -0);
  eq(specNumber(Infinity), Infinity);
});

test('strings follow Number, so blank ones are zero', () => {
  eq(specNumber('12'), 12);
  eq(specNumber('-3.5'), -3.5);
  eq(specNumber('1e3'), 1000);
  eq(specNumber('0x1f'), 31);
  eq(specNumber(''), 0);
  eq(specNumber('   '), 0);
  eq(specNumber('abc'), NaN);
});

test('bigints and symbols are refused, exactly like unary + refuses', () => {
  throws(() => specNumber(1n), 'bigint');
  throws(() => specNumber(Symbol('s')), 'symbol');
  throws(() => +1n, 'Cannot convert a BigInt');
  throws(() => +Symbol('s'), 'Cannot convert a Symbol');
});

test('arrays convert through their string form', () => {
  eq(specNumber([]), 0);
  eq(specNumber([5]), 5);
  eq(specNumber(['1', '2']), NaN);
  eq(specNumber({}), NaN);
});

test('valueOf is tried before toString', () => {
  eq(specNumber({ valueOf: () => 7, toString: () => '99' }), 7);
  eq(specNumber({ toString: () => '99' }), 99);
  eq(toPrimitiveNumber({ valueOf: () => 7 }), 7);
});

test('Symbol.toPrimitive wins, and is handed the number hint', () => {
  const value = {
    [Symbol.toPrimitive](hint) {
      return hint === 'number' ? 42 : 'wrong hint';
    },
    valueOf: () => 1,
  };
  eq(specNumber(value), 42);
  eq(toPrimitiveNumber(value), 42);
});

test('a Date converts via its epoch millis; nothing usable throws', () => {
  eq(specNumber(new Date(86400000)), 86400000);
  throws(() => specNumber(Object.create(null)), 'primitive');
  throws(() => specNumber({ valueOf: () => ({}), toString: () => ({}) }),
    'primitive');
});
