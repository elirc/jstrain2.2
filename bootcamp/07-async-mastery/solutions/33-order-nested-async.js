// ─────────────────────────────────────────────────────────────────────────
//  33 · order · three async functions deep — SOLUTION       ★★☆ core
//  run: node 33-order-nested-async.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the sync pass goes all the way down. a() runs 'a start',
//  calls b() which runs 'b start', calls c() which runs 'c' and returns an
//  already-resolved promise. b suspends at its await, a suspends at its
//  await, control returns to the script: 'script end'.
//  Now unwind, one tick per level, against the ruler:
//   tick 1: b resumes → 'b end'; b's promise fulfils. 't1'.
//   tick 2: a was awaiting b's promise, so a resumes now → 'a end'. 't2'.
//   tick 3: a's promise fulfils, so the .then attached to a() runs →
//           'a resolved'. 't3'. Then 't4', 't5'.
//  That is the real cost model of layering: every `await` you nest adds
//  one microtask hop on the way back, so a 6-deep helper stack answers 6
//  ticks after the innermost work is finished. It is usually irrelevant —
//  until it decides a race, or until it is inside a loop of 10,000.
//  Wrong turn: expecting 'a end' immediately after 'b end' on the same
//  tick. b FULFILLING and a RESUMING are two separate microtasks.

import { test, eq, ok } from '../../_lib/check.js';

// Runs exactly the snippet above and returns the logs it produced.
export function capture() {
  return new Promise((resolve) => {
    const out = [];
    const log = (m) => {
      out.push(m);
      if (out.length === 13) resolve(out); // all thirteen logs are in
    };
    const c = async () => {
      log('c');
    };
    const b = async () => {
      log('b start');
      await c();
      log('b end');
    };
    const a = async () => {
      log('a start');
      await b();
      log('a end');
    };
    log('script start');
    a().then(() => log('a resolved'));
    Promise.resolve()
      .then(() => log('t1'))
      .then(() => log('t2'))
      .then(() => log('t3'))
      .then(() => log('t4'))
      .then(() => log('t5'));
    log('script end');
  });
}

const requireAnswer = () => {
  if (answer.length === 0) throw new Error('TODO: fill in `answer`');
};

export const answer = [
  'script start',
  'a start',
  'b start',
  'c',
  'script end',
  'b end',
  't1',
  'a end',
  't2',
  'a resolved',
  't3',
  't4',
  't5',
];

// ──────────────────────────── tests ──────────────────────────────────────

test('answer is a list of strings', () => {
  requireAnswer();
  ok(Array.isArray(answer) && answer.every((s) => typeof s === 'string'));
});

test('has one entry per log the snippet prints', async () => {
  requireAnswer();
  eq(answer.length, (await capture()).length);
});

test('lists every log exactly once', async () => {
  requireAnswer();
  const real = await capture();
  eq([...answer].sort(), [...real].sort());
});

test('runs all three bodies before script end', async () => {
  requireAnswer();
  const end = answer.indexOf('script end');
  ok(['a start', 'b start', 'c'].every((s) => answer.indexOf(s) < end));
});

test('unwinds the awaits one tick per level', async () => {
  requireAnswer();
  const real = await capture();
  eq(
    ['b end', 'a end', 'a resolved'].map((s) => answer.indexOf(s)),
    ['b end', 'a end', 'a resolved'].map((s) => real.indexOf(s))
  );
});

test('gets the order exactly right', async () => {
  requireAnswer();
  eq(answer, await capture());
});
