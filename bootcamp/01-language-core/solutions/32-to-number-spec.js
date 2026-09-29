// ─────────────────────────────────────────────────────────────────────────
//  32 · the ToNumber table — SOLUTION                        ★★★ stretch
//  run: node 32-to-number-spec.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: ToNumber is a flat table over the seven primitive types
//  plus one recursive case for objects. Writing it out makes the famous
//  oddities boring: `Number('')` is 0 because the string branch says so,
//  and `+[]` is 0 because ToPrimitive([]) is '' and then the string branch
//  says so. Nothing special-cases arrays anywhere.
//
//  ToPrimitive is the part people forget exists. The order is fixed:
//  Symbol.toPrimitive if present, otherwise valueOf then toString, taking
//  the first result that is not an object. Date is the value that swaps
//  the last two for the 'string' and 'default' hints — which is why
//  `new Date() + 1` concatenates but `new Date() - 1` subtracts.
//
//  The bigint/symbol refusals are the abstract operation's, not Number()'s:
//  `Number(1n)` is 1 because the Number FUNCTION has a documented special
//  case, while `+1n` runs this algorithm and throws.

import { test, eq, throws } from '../../_lib/check.js';

const isObject = (v) =>
  v !== null && (typeof v === 'object' || typeof v === 'function');

export function specNumber(value) {
  if (value === null) return 0;
  const type = typeof value;
  if (type === 'undefined') return NaN;
  if (type === 'boolean') return value ? 1 : 0;
  if (type === 'number') return value;
  if (type === 'string') return Number(value);
  if (type === 'bigint' || type === 'symbol') {
    throw new TypeError(`cannot convert a ${type} to a number`);
  }
  return specNumber(toPrimitiveNumber(value));
}

export function toPrimitiveNumber(object) {
  const exotic = object[Symbol.toPrimitive];
  if (typeof exotic === 'function') {
    const result = exotic.call(object, 'number');
    if (!isObject(result)) return result;
  } else {
    for (const name of ['valueOf', 'toString']) {
      const method = object[name];
      if (typeof method !== 'function') continue;
      const result = method.call(object);
      if (!isObject(result)) return result;
    }
  }
  throw new TypeError('cannot convert object to primitive value');
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
