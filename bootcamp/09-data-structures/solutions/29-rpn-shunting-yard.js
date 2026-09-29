// ─────────────────────────────────────────────────────────────────────────
//  29 · RPN calculator and the shunting yard — SOLUTION     ★★★ stretch
//  run: node 29-rpn-shunting-yard.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: both halves are one pass with one stack — O(n) time, O(n)
//  space — and both exist because a stack is exactly the shape of
//  "deferred work". evalRPN needs no precedence rules at all: the ORDER
//  already encodes them, so you push numbers and, on an operator, pop the
//  two most recent results and push the answer back.
//  toPostfix is the machine that produces that order. Numbers go straight
//  out; an operator first pops every stacked operator that binds at least
//  as tightly (>= precedence), which is what makes equal precedence run
//  left to right; '(' is pushed as a floor that nothing pops past, and ')'
//  drains back down to it. Whatever is left on the stack at the end pours
//  out in reverse.
//  Why a stack rather than recursion: it is a flat loop with an explicit,
//  inspectable state — no call-depth limit on a 10,000-token formula.
//  Classic wrong turn: popping the operands in the wrong order. `b` comes
//  off FIRST, so it is OPS[token](a, b) — get it backwards and '+' and '*'
//  still pass every test while '-' and '/' silently invert.

import { test, eq } from '../../_lib/check.js';

const OPS = {
  '+': (a, b) => a + b,
  '-': (a, b) => a - b,
  '*': (a, b) => a * b,
  '/': (a, b) => a / b,
};

const PRECEDENCE = { '+': 1, '-': 1, '*': 2, '/': 2 };

export function evalRPN(tokens) {
  const stack = [];
  for (const token of tokens) {
    if (Object.hasOwn(OPS, token)) {
      const b = stack.pop();
      const a = stack.pop();
      stack.push(OPS[token](a, b));
    } else {
      stack.push(Number(token));
    }
  }
  return stack.pop();
}

export function toPostfix(tokens) {
  const output = [];
  const ops = [];

  for (const token of tokens) {
    if (token === '(') {
      ops.push(token);
    } else if (token === ')') {
      while (ops.length > 0 && ops[ops.length - 1] !== '(') {
        output.push(ops.pop());
      }
      ops.pop(); // discard the '('
    } else if (Object.hasOwn(PRECEDENCE, token)) {
      while (
        ops.length > 0 &&
        ops[ops.length - 1] !== '(' &&
        PRECEDENCE[ops[ops.length - 1]] >= PRECEDENCE[token]
      ) {
        output.push(ops.pop());
      }
      ops.push(token);
    } else {
      output.push(token);
    }
  }
  while (ops.length > 0) output.push(ops.pop());
  return output;
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
