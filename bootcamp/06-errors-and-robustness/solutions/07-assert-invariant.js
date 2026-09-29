// ─────────────────────────────────────────────────────────────────────────
//  07 · assert an invariant — SOLUTION                     ★☆☆ warm-up
//  run: node 07-assert-invariant.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: assert is four lines and it is the cheapest robustness
//  tool you own. It inverts the condition — you write what must be TRUE,
//  which reads far better than a pile of `if (bad) throw`.
//  In withdraw the order matters: check the type first, then the sign,
//  then the balance. Each guard may assume the ones above it passed, so
//  the last line ("return balance - amount") is unconditionally correct.
//  Note `Number.isFinite` — it rejects NaN and Infinity, which `typeof
//  amount === 'number'` happily lets through.

import { test, eq } from '../../_lib/check.js';

export function assert(condition, message) {
  if (!condition) throw new Error(message);
}

export function withdraw(balance, amount) {
  assert(Number.isFinite(amount), 'amount must be a number');
  assert(amount > 0, 'amount must be positive');
  assert(amount <= balance, 'insufficient funds');
  return balance - amount;
}

// returns the error `fn` threw, so a test can inspect it
function thrownBy(fn) {
  try {
    fn();
  } catch (err) {
    if (err instanceof Error && err.message === 'TODO') throw err;
    return err;
  }
  throw new Error('expected fn to throw, but it returned');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('assert is silent when the condition holds', () => {
  eq(assert(true, 'should not throw'), undefined);
});

test('assert throws a real Error with your message', () => {
  const err = thrownBy(() => assert(false, 'x must be positive'));
  eq(err.message, 'x must be positive');
  eq(err instanceof Error, true);
});

test('every falsy value trips it', () => {
  eq(thrownBy(() => assert(0, 'zero')).message, 'zero');
  eq(thrownBy(() => assert('', 'blank')).message, 'blank');
  eq(thrownBy(() => assert(null, 'missing')).message, 'missing');
});

test('withdraw returns the new balance', () => {
  eq(withdraw(100, 30), 70);
});

test('withdrawing the whole balance is allowed', () => {
  eq(withdraw(50, 50), 0);
});

test('withdraw refuses zero and negative amounts', () => {
  eq(thrownBy(() => withdraw(100, 0)).message, 'amount must be positive');
  eq(thrownBy(() => withdraw(100, -5)).message, 'amount must be positive');
});

test('withdraw refuses an overdraft', () => {
  eq(thrownBy(() => withdraw(100, 500)).message, 'insufficient funds');
});

test('withdraw refuses an amount that is not a number', () => {
  eq(thrownBy(() => withdraw(100, '30')).message, 'amount must be a number');
});
