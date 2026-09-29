// ─────────────────────────────────────────────────────────────────────────
//  29 · RPN calculator and the shunting yard                ★★★ stretch
//  concepts: stacks · postfix notation · operator precedence
//  run: node 29-rpn-shunting-yard.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Two halves of a calculator, one stack each.
//
//  evalRPN(tokens) — evaluate postfix (Reverse Polish) notation, where the
//  operator comes AFTER its two operands and precedence is already baked
//  into the order:
//      evalRPN(['2', '3', '+'])                       → 5
//      evalRPN(['5', '1', '2', '+', '4', '*', '+'])   → 17
//      evalRPN(['3', '9', '-'])                       → -6   (order matters)
//
//  toPostfix(tokens) — Dijkstra's shunting yard: turn ordinary infix into
//  that postfix form, honouring precedence and parentheses:
//      toPostfix(['3', '+', '4', '*', '2'])
//        → ['3', '4', '2', '*', '+']
//      toPostfix(['(', '3', '+', '4', ')', '*', '2'])
//        → ['3', '4', '+', '2', '*']
//
//  Tokens are strings; numbers may be negative. `* /` bind tighter than
//  `+ -` and everything is left-associative. OPS and PRECEDENCE are given.
//
//  hint: for toPostfix, pop operators that bind at LEAST as tightly as the
//  incoming one before pushing it — and '(' is a floor nothing pops past

import { test, eq } from '../../_lib/check.js';

const OPS = {
  '+': (a, b) => a + b,
  '-': (a, b) => a - b,
  '*': (a, b) => a * b,
  '/': (a, b) => a / b,
};

const PRECEDENCE = { '+': 1, '-': 1, '*': 2, '/': 2 };

export function evalRPN(tokens) {
  throw new Error('TODO');
}

export function toPostfix(tokens) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('evalRPN works through the classic expression', () => {
  eq(evalRPN(['5', '1', '2', '+', '4', '*', '+', '3', '-']), 14);
});

test('evalRPN subtracts and divides in the right order', () => {
  eq(evalRPN(['3', '9', '-']), -6, 'the FIRST value popped is the right one');
  eq(evalRPN(['8', '2', '/']), 4);
});

test('evalRPN handles a bare number and negative operands', () => {
  eq(evalRPN(['42']), 42);
  eq(evalRPN(['-4', '2', '*']), -8);
});

test('toPostfix lets multiplication bind tighter than addition', () => {
  eq(toPostfix(['3', '+', '4', '*', '2']), ['3', '4', '2', '*', '+']);
  eq(toPostfix(['3', '*', '4', '+', '2']), ['3', '4', '*', '2', '+']);
});

test('parentheses override precedence', () => {
  eq(toPostfix(['(', '3', '+', '4', ')', '*', '2']), [
    '3',
    '4',
    '+',
    '2',
    '*',
  ]);
});

test('equal precedence stays left to right', () => {
  eq(toPostfix(['8', '-', '3', '-', '2']), ['8', '3', '-', '2', '-']);
  eq(evalRPN(toPostfix(['8', '-', '3', '-', '2'])), 3, 'not 8 - (3 - 2)');
});

test('nested parentheses unwind from the inside out', () => {
  const infix = ['2', '*', '(', '(', '1', '+', '2', ')', '/', '3', ')'];
  eq(toPostfix(infix), ['2', '1', '2', '+', '3', '/', '*']);
  eq(evalRPN(toPostfix(infix)), 2);
});

test('application: a spreadsheet formula is parsed, then evaluated', () => {
  const formula = ['(', '2', '+', '3', ')', '*', '4', '-', '6', '/', '2'];
  const postfix = toPostfix(formula);
  eq(postfix, ['2', '3', '+', '4', '*', '6', '2', '/', '-']);
  eq(evalRPN(postfix), 17, '(2 + 3) * 4 - 6 / 2');
});
