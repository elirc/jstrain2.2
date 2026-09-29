// ─────────────────────────────────────────────────────────────────────────
//  05 · trace · runToCompletion — SOLUTION                   ★★☆ core
//  run: node 05-yield-mechanics.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: read trace top to bottom and mark the two `yield`s —
//  those are the only places the function can be frozen. Nothing above
//  the first yield runs until the first next(); the code between the
//  two yields runs on the SECOND next(), not the first. That off-by-one
//  is the whole lesson: work happens on the pull that follows it.
//
//  `return 'done!'` rides out on the step where done is true. for-of
//  and spread ignore that step's value entirely, which is why
//  runToCompletion has to loop on next() by hand.

import { test, eq } from '../../_lib/check.js';

// scaffolding: a finished generator to test runToCompletion against.
function* twoThenTotal() {
  yield 1;
  yield 2;
  return 3;
}

export function* trace(log) {
  log.push('start');
  yield 'a';
  log.push('middle');
  yield 'b';
  log.push('end');
  return 'done!';
}

export function runToCompletion(generator) {
  let step = generator.next();
  while (!step.done) step = generator.next();
  return step.value;
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
