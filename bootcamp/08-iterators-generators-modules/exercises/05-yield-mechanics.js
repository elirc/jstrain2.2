// ─────────────────────────────────────────────────────────────────────────
//  05 · trace · runToCompletion                              ★★☆ core
//  concepts: pause points · next() · done · return value
//  run: node 05-yield-mechanics.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Write trace(log) so that pulling it one next() at a time produces
//  exactly this. `log` is an array you push progress marks into:
//
//      const g = trace(log);   log is still []      (no code ran)
//      g.next()  → { value: 'a', done: false }      log: ['start']
//      g.next()  → { value: 'b', done: false }      log: [.., 'middle']
//      g.next()  → { value: 'done!', done: true }   log: [.., 'end']
//      g.next()  → { value: undefined, done: true }
//
//  So: the body runs up to the first yield and stops THERE. The next
//  pull resumes right after that yield.
//
//  Then runToCompletion(generator): drive it to the end and return the
//  value it RETURNS (not the values it yields — for-of drops that one).
//
//  hint: `return 'done!'` inside a generator shows up as the value of
//        the final { value, done: true } step

import { test, eq } from '../../_lib/check.js';

// scaffolding: a finished generator to test runToCompletion against.
function* twoThenTotal() {
  yield 1;
  yield 2;
  return 3;
}

export function* trace(log) {
  throw new Error('TODO');
}

export function runToCompletion(generator) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('calling trace runs none of the body', () => {
  const log = [];
  const g = trace(log);
  eq(log, [], 'a generator call must not execute anything');
  eq(g.next().value, 'a');
  eq(log, ['start']);
});

test('the first next() stops at the first yield', () => {
  const log = [];
  const g = trace(log);
  eq(g.next(), { value: 'a', done: false });
  eq(log, ['start'], 'it must not run past the first yield');
});

test('the second next() resumes after that yield', () => {
  const log = [];
  const g = trace(log);
  g.next();
  eq(g.next(), { value: 'b', done: false });
  eq(log, ['start', 'middle']);
});

test('the third next() finishes and reports the return value', () => {
  const log = [];
  const g = trace(log);
  g.next();
  g.next();
  eq(g.next(), { value: 'done!', done: true });
  eq(log, ['start', 'middle', 'end']);
});

test('every next() after that is done with undefined', () => {
  const g = trace([]);
  g.next();
  g.next();
  g.next();
  eq(g.next(), { value: undefined, done: true });
  eq(g.next(), { value: undefined, done: true });
});

test('for-of and spread collect the yields and drop the return', () => {
  eq([...trace([])], ['a', 'b']);
});

test('runToCompletion hands back the returned value', () => {
  eq(runToCompletion(trace([])), 'done!');
});

test('runToCompletion works on any generator object', () => {
  eq(runToCompletion(twoThenTotal()), 3);
  eq(runToCompletion(twoThenTotal()), 3);
});
