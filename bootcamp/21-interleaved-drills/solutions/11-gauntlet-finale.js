// ─────────────────────────────────────────────────────────────────────────
//  11 · gauntlet · finale — SOLUTION                       ★★★ stretch
//  run: node 11-gauntlet-finale.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough — every extra tick in this file comes from one rule: when
//  a promise is resolved WITH something thenable, the engine has to call
//  that thing's `.then` in a microtask of its own before it can settle.
//
//  ── snippet 1 ────────────────────────────────────────────────────────
//  `thenable` is a plain object with a `then` method, not a promise, so
//  `Promise.resolve(thenable)` builds a NEW promise and queues a job to
//  call `thenable.then`. That job is queued during the script, right
//  behind the m1 callback.
//    sync:   sync end
//    tick 1: m1 · then the queued job calls thenable.then, which logs and
//            resolves with 'T'; the `got T` callback is queued
//    tick 2: m2 · got T          ← m2 was queued first, so it goes first
//    tick 3: m3
//  ⇒ sync end · m1 · thenable.then · m2 · got T · m3
//  Note 'thenable.then' runs INSIDE tick 1, after m1 — a thenable costs
//  you a tick before its value even exists.
//
//  ── snippet 2 ────────────────────────────────────────────────────────
//  `Promise.resolve(p)` where `p` is already a native promise is the
//  identity function: it returns p itself, no new promise, no extra tick.
//  So its `.then` is attached to an ALREADY-resolved promise and its
//  callback is queued immediately — first in line, before t1.
//  `new Promise((res) => res(p))` cannot take that shortcut: resolving
//  with a thenable costs two ticks (one to call `p.then`, one for that
//  callback to settle the outer promise).
//    tick 1: resolve(p) · t1
//    tick 2: t2
//    tick 3: new(res p) · t3
//  Reading the log: resolve(p), t1, t2, new(res p), t3.
//  ⇒ resolve(p) · t1 · t2 · new(res p) · t3
//
//  ── snippet 3 ────────────────────────────────────────────────────────
//  `await 1` on a non-promise still costs exactly one tick — and so does
//  `await Promise.resolve()`, since modern V8 stopped charging three for
//  a native promise. `Promise.resolve(Promise.resolve())` is identity
//  again, so g's await is a one-tick await of an already-settled promise,
//  not a nested one.
//    sync:   f1 · g1
//    tick 1: f2 · g2 · c1        ← queued in that order during the script
//    tick 2: f3 · c2             ← f3 queued inside tick 1 before c1 ran
//    tick 3: c3
//    tick 4: c4
//  ⇒ f1 · g1 · f2 · g2 · c1 · f3 · c2 · c3 · c4

import { test, eq } from '../../_lib/check.js';

export function capture1() {
  const out = [];
  let finish;
  const done = new Promise((resolve) => {
    finish = resolve;
  });
  const log = (m) => {
    out.push(m);
    if (out.length === 6) finish(out);
  };

  const thenable = {
    then(res) {
      log('thenable.then');
      res('T');
    },
  };
  Promise.resolve()
    .then(() => log('m1'))
    .then(() => log('m2'))
    .then(() => log('m3'));
  Promise.resolve(thenable).then((v) => log('got ' + v));
  log('sync end');

  return done;
}

export function capture2() {
  const out = [];
  let finish;
  const done = new Promise((resolve) => {
    finish = resolve;
  });
  const log = (m) => {
    out.push(m);
    if (out.length === 5) finish(out);
  };

  const p = Promise.resolve('P');
  Promise.resolve(p).then(() => log('resolve(p)'));
  new Promise((res) => res(p)).then(() => log('new(res p)'));
  Promise.resolve()
    .then(() => log('t1'))
    .then(() => log('t2'))
    .then(() => log('t3'));

  return done;
}

export function capture3() {
  const out = [];
  let finish;
  const done = new Promise((resolve) => {
    finish = resolve;
  });
  const log = (m) => {
    out.push(m);
    if (out.length === 9) finish(out);
  };

  const f = async () => {
    log('f1');
    await 1;
    log('f2');
    await Promise.resolve();
    log('f3');
  };
  const g = async () => {
    log('g1');
    await Promise.resolve(Promise.resolve());
    log('g2');
  };
  f();
  g();
  Promise.resolve()
    .then(() => log('c1'))
    .then(() => log('c2'))
    .then(() => log('c3'))
    .then(() => log('c4'));

  return done;
}

const need = (list, n) => {
  if (list.length === 0) throw new Error(`TODO: fill in answer${n}`);
};

export const answer1 = [
  'sync end',
  'm1',
  'thenable.then',
  'm2',
  'got T',
  'm3',
];

export const answer2 = ['resolve(p)', 't1', 't2', 'new(res p)', 't3'];

export const answer3 = [
  'f1',
  'g1',
  'f2',
  'g2',
  'c1',
  'f3',
  'c2',
  'c3',
  'c4',
];

// ──────────────────────────── tests ──────────────────────────────────────

test('snippet 1 · every log once, nothing invented', async () => {
  need(answer1, 1);
  eq([...answer1].sort(), [...(await capture1())].sort());
});

test('snippet 1 · exact order', async () => {
  need(answer1, 1);
  eq(answer1, await capture1());
});

test('snippet 2 · every log once, nothing invented', async () => {
  need(answer2, 2);
  eq([...answer2].sort(), [...(await capture2())].sort());
});

test('snippet 2 · exact order', async () => {
  need(answer2, 2);
  eq(answer2, await capture2());
});

test('snippet 3 · every log once, nothing invented', async () => {
  need(answer3, 3);
  eq([...answer3].sort(), [...(await capture3())].sort());
});

test('snippet 3 · exact order', async () => {
  need(answer3, 3);
  eq(answer3, await capture3());
});
