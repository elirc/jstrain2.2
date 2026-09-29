// ─────────────────────────────────────────────────────────────────────────
//  09 · gauntlet · queues                                  ★★☆ core
//  concepts: event loop · microtasks · macrotasks
//  run: node 09-gauntlet-queues.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Three snippets. Predict each output BEFORE you run anything, then fill
//  in answer1 / answer2 / answer3. Node and browsers agree on all three.
//
//  ── snippet 1 ────────────────────────────────────────────────────────
//      log('A');
//      setTimeout(() => log('B'), 0);
//      Promise.resolve().then(() => {
//        log('C');
//        setTimeout(() => log('D'), 0);
//      });
//      setTimeout(() => {
//        log('E');
//        Promise.resolve().then(() => log('F'));
//      }, 0);
//      log('G');
//
//  ── snippet 2 ────────────────────────────────────────────────────────
//      const p = new Promise((resolve) => {
//        log('executor');
//        resolve('v');
//      });
//      log('after ctor');
//      p.then((v) => log('then ' + v));
//      Promise.resolve().then(() => log('other'));
//      log('end');
//
//  ── snippet 3 ────────────────────────────────────────────────────────
//      const work = async () => {
//        log('w1');
//        await null;
//        log('w2');
//        await null;
//        log('w3');
//      };
//      log('start');
//      work();
//      Promise.resolve()
//        .then(() => log('m1'))
//        .then(() => log('m2'))
//        .then(() => log('m3'));
//      log('end');

import { test, eq } from '../../_lib/check.js';

// Each capture runs exactly the snippet above it and resolves with the
// logs it produced, in order.

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

  log('A');
  setTimeout(() => log('B'), 0);
  Promise.resolve().then(() => {
    log('C');
    setTimeout(() => log('D'), 0);
  });
  setTimeout(() => {
    log('E');
    Promise.resolve().then(() => log('F'));
  }, 0);
  log('G');

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

  const p = new Promise((resolve) => {
    log('executor');
    resolve('v');
  });
  log('after ctor');
  p.then((v) => log('then ' + v));
  Promise.resolve().then(() => log('other'));
  log('end');

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
    if (out.length === 8) finish(out);
  };

  const work = async () => {
    log('w1');
    await null;
    log('w2');
    await null;
    log('w3');
  };
  log('start');
  work();
  Promise.resolve()
    .then(() => log('m1'))
    .then(() => log('m2'))
    .then(() => log('m3'));
  log('end');

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
