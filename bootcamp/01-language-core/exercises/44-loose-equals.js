// ─────────────────────────────────────────────────────────────────────────
//  44 · looseEquals                                          ★★★ stretch
//  concepts: abstract equality · ToPrimitive · the coercion table
//  run: node 44-loose-equals.js
// ─────────────────────────────────────────────────────────────────────────
//
//  The capstone: implement `==` yourself, without using `==` or `!=`
//  anywhere. Once you have written the algorithm the famous table stops
//  being a meme and becomes six rules.
//
//    1. same type            → compare with === and stop
//    2. null vs undefined    → true; either against anything else → false
//    3. number vs string     → convert the STRING to a number, retry
//    4. either is a boolean  → convert the BOOLEAN to a number, retry
//    5. object vs primitive  → convert the object with ToPrimitive
//                              (the 'default' hint), retry
//    6. anything left        → false
//
//      looseEquals(0, '')          → true      looseEquals('0', '')  → false
//      looseEquals(null, undefined)→ true      looseEquals(null, 0)  → false
//      looseEquals(1, '1')         → true      looseEquals(NaN, NaN) → false
//      looseEquals(false, [])      → true      looseEquals(true, 2)  → false
//      looseEquals(new Date(0), 0) → false     ← the 'default' hint bites
//
//  Symbols and bigints are out of scope: either operand throws a TypeError
//  whose message contains 'unsupported'.
//
//  equalityTable(values) returns the square matrix of every pair:
//
//      equalityTable([0, '', null])
//      → [[true, true, false], [true, true, false], [false, false, true]]
//
//  hint: recursion is what makes rules 3–5 short — convert one operand and
//  call yourself again. For ToPrimitive: Symbol.toPrimitive with the
//  'default' hint if present, otherwise valueOf() then toString(), taking
//  the first result that is not an object.

import { test, eq, throws } from '../../_lib/check.js';

export function looseEquals(a, b) {
  throw new Error('TODO');
}

export function equalityTable(values) {
  throw new Error('TODO');
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
