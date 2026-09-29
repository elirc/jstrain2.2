// ─────────────────────────────────────────────────────────────────────────
//  01 · stub and fake — SOLUTION                            ★☆☆ warm-up
//  run: node 01-test-doubles.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: a function IS an object, so the recording lives on the
//  double itself — no external registry to reset between tests, and two
//  doubles can never share state by accident. `attach` builds the shared
//  bookkeeping once; stub and fake then differ only in what they do after
//  recording.
//  The `results` array is why a fake beats a stub: it keeps the OUTCOME,
//  so a test can assert "the second call blew up" without the double
//  knowing anything about the code that called it. Note the re-throw
//  inside the catch — a double that swallows the error is a double that
//  lies about the real collaborator.
//  The bootcamp's own `spy` in _lib/check.js is the same idea with less
//  furniture: calls, returns, callCount — no `results`, no `calledWith`,
//  no throw recording. Compare the two files; yours is a superset.

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
  const s = (...args) => {
    s.calls.push(args);
    s.callCount = s.calls.length;
    s.lastCall = args;
    return returnValue;
  };
  return attach(s);
}

export function fake(impl) {
  const f = (...args) => {
    f.calls.push(args);
    f.callCount = f.calls.length;
    f.lastCall = args;
    try {
      const value = impl(...args);
      f.results.push({ type: 'return', value });
      return value;
    } catch (error) {
      f.results.push({ type: 'throw', value: error });
      throw error;
    }
  };
  attach(f);
  f.results = [];
  return f;
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
