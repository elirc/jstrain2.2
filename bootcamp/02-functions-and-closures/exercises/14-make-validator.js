// ─────────────────────────────────────────────────────────────────────────
//  14 · makeValidator                                      ★★☆ core
//  concepts: higher-order functions · closures · spies
//  run: node 14-make-validator.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Turn a list of rules into a reusable validator. A rule is
//  `{ message, test }` where test(value) returns true when the value is
//  acceptable. The validator returns the messages of the rules that
//  FAILED, in the order the rules were given — an empty array means the
//  value is valid.
//
//      const check = makeValidator(passwordRules);
//      check('Str0ngEnough')  → []
//      check('abc')           → ['too short', 'needs a digit',
//                                'needs a capital']
//
//  hint: filter the rules that fail, then map them to their message

import { test, eq, spy } from '../../_lib/check.js';

export function makeValidator(rules) {
  throw new Error('TODO');
}

// ── given: the rules used by the tests ──
const passwordRules = [
  { message: 'too short', test: (v) => v.length >= 8 },
  { message: 'needs a digit', test: (v) => /\d/.test(v) },
  { message: 'needs a capital', test: (v) => /[A-Z]/.test(v) },
];

// ──────────────────────────── tests ──────────────────────────────────────

test('a valid value produces no messages', () => {
  eq(makeValidator(passwordRules)('Str0ngEnough'), []);
});

test('collects every failing message in rule order', () => {
  eq(makeValidator(passwordRules)('abc'), [
    'too short',
    'needs a digit',
    'needs a capital',
  ]);
});

test('reports only the rules that actually fail', () => {
  eq(makeValidator(passwordRules)('abcdefgh'), [
    'needs a digit',
    'needs a capital',
  ]);
  eq(makeValidator(passwordRules)('abcdefg1'), ['needs a capital']);
});

test('an empty rule list accepts everything', () => {
  const check = makeValidator([]);
  eq(check('anything'), []);
  eq(check(''), []);
});

test('one validator can be reused for many values', () => {
  const check = makeValidator(passwordRules);
  eq(check('Str0ngEnough'), []);
  eq(check('abcdefg1'), ['needs a capital']);
  eq(check('Str0ngEnough'), []);
});

test('every rule is tested with the value, once', () => {
  const rule = spy(() => true);
  const check = makeValidator([{ message: 'nope', test: rule }]);
  check('hello');
  eq(rule.calls, [['hello']]);
});

test('validators built from different rules stay independent', () => {
  const strict = makeValidator(passwordRules);
  const loose = makeValidator([passwordRules[0]]);
  eq(loose('abc'), ['too short']);
  eq(strict('abc').length, 3);
});
