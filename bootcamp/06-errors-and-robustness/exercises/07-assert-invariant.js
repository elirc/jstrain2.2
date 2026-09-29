// ─────────────────────────────────────────────────────────────────────────
//  07 · assert an invariant                                ★☆☆ warm-up
//  concepts: guard clauses · invariants
//  run: node 07-assert-invariant.js
// ─────────────────────────────────────────────────────────────────────────
//
//  An invariant is something that must be true or the rest of the
//  function is nonsense. Checking it at the top, loudly, beats debugging
//  a negative bank balance three screens later.
//
//    assert(condition, message)
//        assert(true, 'nope')     → undefined (silence is success)
//        assert(0, 'count required')  → throws Error('count required')
//
//    withdraw(balance, amount) — uses assert for its three rules, then
//    returns the new balance:
//        withdraw(100, 30)   → 70
//        withdraw(100, 0)    → throws 'amount must be positive'
//        withdraw(100, 500)  → throws 'insufficient funds'
//        withdraw(100, '30') → throws 'amount must be a number'
//
//  hint: assert throws on FALSY, not on false.

import { test, eq } from '../../_lib/check.js';

export function assert(condition, message) {
  throw new Error('TODO');
}

export function withdraw(balance, amount) {
  throw new Error('TODO');
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
