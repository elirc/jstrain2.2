// ─────────────────────────────────────────────────────────────────────────
//  01 · stub and fake                                       ★☆☆ warm-up
//  concepts: test doubles · closures · call recording
//  run: node 01-test-doubles.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A test double is a stand-in you hand to the code under test so the real
//  collaborator — an HTTP client, a mailer, a payment gateway — never runs.
//  Build the two you will reach for most. A STUB answers with a canned
//  value; a FAKE runs a tiny implementation you supply.
//
//      const getRate = stub(1.25);
//      getRate('EUR'); getRate('GBP');
//      getRate('EUR')              → 1.25    (always)
//      getRate.callCount           → 3
//      getRate.calls               → [['EUR'], ['GBP'], ['EUR']]
//      getRate.lastCall            → ['EUR']  (undefined before any call)
//      getRate.calledWith('GBP')   → true     (deep comparison)
//
//      const add = fake((a, b) => a + b);
//      add(2, 3)                   → 5
//      add.results                 → [{ type: 'return', value: 5 }]
//
//  A fake that throws records `{ type: 'throw', value: theError }` and then
//  re-throws. Both doubles share the `calls / callCount / lastCall /
//  calledWith` surface — `attach` below is provided for that.

import { test, eq, ok, throws } from '../../_lib/check.js';
import { isDeepStrictEqual } from 'node:util';

// Provided: the shared bookkeeping every double needs.
function attach(double) {
  double.calls = [];
  double.callCount = 0;
  double.lastCall = undefined;
  double.calledWith = (...want) =>
    double.calls.some((got) => isDeepStrictEqual(got, want));
  return double;
}

export function stub(returnValue) {
  throw new Error('TODO');
}

export function fake(impl) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('a stub returns the same value on every call', () => {
  const getRate = stub(1.25);
  eq(getRate('EUR'), 1.25);
  eq(getRate(), 1.25);
});

test('a stub records the arguments of every call', () => {
  const getRate = stub(1);
  getRate('EUR', 2);
  getRate('GBP');
  eq(getRate.calls, [['EUR', 2], ['GBP']]);
  eq(getRate.callCount, 2);
});

test('lastCall is undefined until the double is called', () => {
  const getRate = stub(1);
  eq(getRate.lastCall, undefined);
  getRate('EUR');
  getRate('GBP');
  eq(getRate.lastCall, ['GBP']);
});

test('calledWith compares arguments deeply, not by reference', () => {
  const save = stub(true);
  save({ id: 1, tags: ['a'] });
  ok(save.calledWith({ id: 1, tags: ['a'] }));
  ok(!save.calledWith({ id: 2, tags: ['a'] }));
  ok(!save.calledWith());
});

test('a fake delegates to the implementation', () => {
  const add = fake((a, b) => a + b);
  eq(add(2, 3), 5);
  eq(add.calls, [[2, 3]]);
});

test('a fake records what the implementation returned', () => {
  const add = fake((a, b) => a + b);
  add(1, 1);
  add(2, 2);
  eq(add.results, [
    { type: 'return', value: 2 },
    { type: 'return', value: 4 },
  ]);
});

test('a fake records a throw and still re-throws it', () => {
  const send = fake((to) => {
    if (!to) throw new Error('no recipient');
    return 'sent';
  });
  send('a@b.c');
  throws(() => send(''), 'no recipient');
  eq(send.callCount, 2);
  eq(send.results[0], { type: 'return', value: 'sent' });
  eq(send.results[1].type, 'throw');
  eq(send.results[1].value.message, 'no recipient');
});

test('two doubles never share their recordings', () => {
  const a = stub(1);
  const b = stub(1);
  a('x');
  eq(a.callCount, 1);
  eq(b.callCount, 0);
  eq(b.calls, []);
});
