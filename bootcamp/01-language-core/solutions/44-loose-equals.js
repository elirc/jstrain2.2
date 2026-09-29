// ─────────────────────────────────────────────────────────────────────────
//  44 · looseEquals — SOLUTION                               ★★★ stretch
//  run: node 44-loose-equals.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the whole algorithm is "make the two operands the same
//  type, one step at a time, then use ===". Every step reduces the problem
//  and recurses, so the function is six ifs and a recursive call.
//
//  Order is what people get wrong. Booleans are converted BEFORE objects,
//  which is why `[] == false` is true: false becomes 0, then [] becomes ''
//  via ToPrimitive, then '' becomes 0. Nothing ever converts an operand
//  "to a boolean" — `if (x)` does that, `==` never does.
//
//  Rule 2 is the reason `null == 0` is false while `null == undefined` is
//  true: null and undefined leave the algorithm immediately, before any
//  numeric conversion can happen. There is no coercion to blame.
//
//  Date is the built-in that makes the 'default' hint visible: its
//  @@toPrimitive treats 'default' as 'string', so `new Date(0) == 0` is
//  false even though `+new Date(0)` is 0. That asymmetry is also why
//  `date + 1` concatenates while `date - 1` subtracts.
//
//  And the takeaway the exercise is really for: this is a lot of machinery
//  to run on every `==`. Use `===`, and `value == null` when you genuinely
//  mean "null or undefined".

import { test, eq, throws } from '../../_lib/check.js';

const isObject = (v) =>
  v !== null && (typeof v === 'object' || typeof v === 'function');

function kindOf(value) {
  if (value === null) return 'null';
  const type = typeof value;
  if (type === 'symbol' || type === 'bigint') return 'unsupported';
  return isObject(value) ? 'object' : type;
}

function toPrimitiveDefault(object) {
  const exotic = object[Symbol.toPrimitive];
  if (typeof exotic === 'function') {
    const result = exotic.call(object, 'default');
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

export function looseEquals(a, b) {
  const left = kindOf(a);
  const right = kindOf(b);

  if (left === 'unsupported' || right === 'unsupported') {
    throw new TypeError(`unsupported type: ${left}/${right}`);
  }
  if (left === right) return a === b;

  const nullish = (kind) => kind === 'null' || kind === 'undefined';
  if (nullish(left) || nullish(right)) return nullish(left) && nullish(right);

  if (left === 'number' && right === 'string') {
    return looseEquals(a, Number(b));
  }
  if (left === 'string' && right === 'number') {
    return looseEquals(Number(a), b);
  }
  if (left === 'boolean') return looseEquals(Number(a), b);
  if (right === 'boolean') return looseEquals(a, Number(b));
  if (right === 'object') return looseEquals(a, toPrimitiveDefault(b));
  if (left === 'object') return looseEquals(toPrimitiveDefault(a), b);
  return false;
}

export function equalityTable(values) {
  return values.map((a) => values.map((b) => looseEquals(a, b)));
}

// ──────────────────────────── tests ──────────────────────────────────────

test('two values of the same type just use ===', () => {
  eq(looseEquals(1, 1), true);
  eq(looseEquals('a', 'a'), true);
  eq(looseEquals(true, true), true);
  eq(looseEquals(null, null), true);
  eq(looseEquals(undefined, undefined), true);
  const same = { id: 1 };
  eq(looseEquals(same, same), true);
  eq(looseEquals({ id: 1 }, { id: 1 }), false);
});

test('null and undefined equal each other and nothing else', () => {
  eq(looseEquals(null, undefined), true);
  eq(looseEquals(undefined, null), true);
  eq(looseEquals(null, 0), false);
  eq(looseEquals(null, ''), false);
  eq(looseEquals(null, false), false);
  eq(looseEquals(undefined, NaN), false);
  eq(looseEquals(null, {}), false);
});

test('the string is converted to a number, never the reverse', () => {
  eq(looseEquals(1, '1'), true);
  eq(looseEquals('1.0', 1), true);
  eq(looseEquals(0, ''), true);
  eq(looseEquals(0, '  '), true);
  eq(looseEquals('abc', 0), false);
  eq(looseEquals('0', ''), false); // both strings: no conversion happens
});

test('a boolean becomes a number first, which explains "1" == true', () => {
  eq(looseEquals(true, 1), true);
  eq(looseEquals(true, '1'), true);
  eq(looseEquals(false, 0), true);
  eq(looseEquals(false, ''), true);
  eq(looseEquals(false, []), true);
  eq(looseEquals(true, 2), false);
  eq(looseEquals(true, 'true'), false);
});

test('an object is flattened with the default hint before comparing', () => {
  eq(looseEquals([], ''), true);
  eq(looseEquals([1, 2], '1,2'), true);
  eq(looseEquals({ valueOf: () => 3 }, 3), true);
  eq(looseEquals(new Date(0), 0), false); // default hint gives a STRING
  eq(+new Date(0), 0); // the number hint would have given 0
});

test('NaN is equal to nothing, itself included', () => {
  eq(looseEquals(NaN, NaN), false);
  eq(looseEquals(NaN, 0), false);
  eq(looseEquals(NaN, 'NaN'), false);
  eq(looseEquals(NaN, undefined), false);
});

test('symbols and bigints are out of scope and are refused', () => {
  throws(() => looseEquals(Symbol('s'), 'x'), 'unsupported');
  throws(() => looseEquals(1n, 1), 'unsupported');
  throws(() => looseEquals(1, 1n), 'unsupported');
});

test('the table agrees with the native == operator, cell for cell', () => {
  eq(equalityTable([0, '', null]), [
    [true, true, false],
    [true, true, false],
    [false, false, true],
  ]);
  const values = [0, 1, '', '0', '1', false, true, null, undefined, NaN,
    [], [0], [1], {}];
  const table = equalityTable(values);
  eq(table.length, values.length);
  for (let i = 0; i < values.length; i++) {
    for (let j = 0; j < values.length; j++) {
      eq(table[i][j], values[i] == values[j],
        `${String(values[i])} == ${String(values[j])}`);
    }
  }
});
