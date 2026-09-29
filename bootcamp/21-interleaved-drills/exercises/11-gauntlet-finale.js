// ─────────────────────────────────────────────────────────────────────────
//  11 · gauntlet · finale                                  ★★★ stretch
//  concepts: event loop · thenables · promise adoption
//  run: node 11-gauntlet-finale.js
// ─────────────────────────────────────────────────────────────────────────
//
//  The tricky ones. Predict first, fill in answer1/2/3, then run.
//
//  ── snippet 1 ────────────────────────────────────────────────────────
//      const thenable = {
//        then(res) {
//          log('thenable.then');
//          res('T');
//        },
//      };
//      Promise.resolve()
//        .then(() => log('m1'))
//        .then(() => log('m2'))
//        .then(() => log('m3'));
//      Promise.resolve(thenable).then((v) => log('got ' + v));
//      log('sync end');
//
//  ── snippet 2 ────────────────────────────────────────────────────────
//      const p = Promise.resolve('P');
//      Promise.resolve(p).then(() => log('resolve(p)'));
//      new Promise((res) => res(p)).then(() => log('new(res p)'));
//      Promise.resolve()
//        .then(() => log('t1'))
//        .then(() => log('t2'))
//        .then(() => log('t3'));
//
//  ── snippet 3 ────────────────────────────────────────────────────────
//      const f = async () => {
//        log('f1');
//        await 1;
//        log('f2');
//        await Promise.resolve();
//        log('f3');
//      };
//      const g = async () => {
//        log('g1');
//        await Promise.resolve(Promise.resolve());
//        log('g2');
//      };
//      f();
//      g();
//      Promise.resolve()
//        .then(() => log('c1'))
//        .then(() => log('c2'))
//        .then(() => log('c3'))
//        .then(() => log('c4'));
//
//  Count ticks on paper. Two of these three punish a guess.

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

export const answer1 = [];
export const answer2 = [];
export const answer3 = [];

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
