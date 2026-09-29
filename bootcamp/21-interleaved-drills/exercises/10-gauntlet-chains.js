// ─────────────────────────────────────────────────────────────────────────
//  10 · gauntlet · chains                                  ★★★ stretch
//  concepts: event loop · queueMicrotask · await vs then
//  run: node 10-gauntlet-chains.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Three harder snippets. Predict first, fill in answer1/2/3, then run.
//
//  ── snippet 1 ────────────────────────────────────────────────────────
//      log('s');
//      queueMicrotask(() => log('qm1'));
//      Promise.resolve().then(() => {
//        log('p1');
//        queueMicrotask(() => log('qm2'));
//      });
//      queueMicrotask(() => {
//        log('qm3');
//        Promise.resolve().then(() => log('p2'));
//      });
//      log('e');
//
//  ── snippet 2 ────────────────────────────────────────────────────────
//      const b = async () => { log('b'); };
//      const a = async () => {
//        log('a start');
//        await b();
//        log('a end');
//      };
//      log('script start');
//      setTimeout(() => log('timeout'), 0);
//      a();
//      new Promise((res) => { log('promise ctor'); res(); })
//        .then(() => log('then 1'))
//        .then(() => log('then 2'));
//      log('script end');
//
//  ── snippet 3 ────────────────────────────────────────────────────────
//      const r = Promise.resolve('R');
//      const ret = async () => r;             // returns a promise
//      const retAwait = async () => await r;  // awaits, then returns
//      ret().then(() => log('ret'));
//      retAwait().then(() => log('retAwait'));
//      Promise.resolve()
//        .then(() => log('t1'))
//        .then(() => log('t2'))
//        .then(() => log('t3'))
//        .then(() => log('t4'));
//
//  Snippet 3 is worth counting ticks on paper before you run it.

import { test, eq } from '../../_lib/check.js';

export function capture1() {
  const out = [];
  let finish;
  const done = new Promise((resolve) => {
    finish = resolve;
  });
  const log = (m) => {
    out.push(m);
    if (out.length === 7) finish(out);
  };

  log('s');
  queueMicrotask(() => log('qm1'));
  Promise.resolve().then(() => {
    log('p1');
    queueMicrotask(() => log('qm2'));
  });
  queueMicrotask(() => {
    log('qm3');
    Promise.resolve().then(() => log('p2'));
  });
  log('e');

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
    if (out.length === 9) finish(out);
  };

  const b = async () => {
    log('b');
  };
  const a = async () => {
    log('a start');
    await b();
    log('a end');
  };
  log('script start');
  setTimeout(() => log('timeout'), 0);
  a();
  new Promise((res) => {
    log('promise ctor');
    res();
  })
    .then(() => log('then 1'))
    .then(() => log('then 2'));
  log('script end');

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
    if (out.length === 6) finish(out);
  };

  const r = Promise.resolve('R');
  const ret = async () => r;
  const retAwait = async () => await r;
  ret().then(() => log('ret'));
  retAwait().then(() => log('retAwait'));
  Promise.resolve()
    .then(() => log('t1'))
    .then(() => log('t2'))
    .then(() => log('t3'))
    .then(() => log('t4'));

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
