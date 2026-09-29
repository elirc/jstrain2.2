// ─────────────────────────────────────────────────────────────────────────
//  10 · gauntlet · chains — SOLUTION                       ★★★ stretch
//  run: node 10-gauntlet-chains.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough — there is only ONE microtask queue. `queueMicrotask` and
//  `.then` push into the same line; whatever is queued first runs first,
//  and anything queued WHILE draining goes to the back of the same line.
//
//  ── snippet 1 ────────────────────────────────────────────────────────
//  script: 's', queue qm1, queue p1, queue qm3, 'e'   → s, e
//  drain, in the order they were queued:
//    qm1                                              → qm1
//    p1 runs and appends qm2 to the back               → p1
//    qm3 runs and appends p2 to the back               → qm3
//    qm2                                              → qm2
//    p2                                               → p2
//  ⇒ s · e · qm1 · p1 · qm3 · qm2 · p2
//  The lesson: "microtask" is not a second, lower-priority queue.
//
//  ── snippet 2 ────────────────────────────────────────────────────────
//  Everything up to the first `await` is synchronous, so 'a start' and
//  'b' both print during the script — and 'promise ctor' after them,
//  because the executor is synchronous too.
//    sync:   script start, a start, b, promise ctor, script end
//    tick 1: a end (awaiting b()'s promise), then 1
//    tick 2: then 2
//    timer:  timeout
//  ⇒ script start · a start · b · promise ctor · script end ·
//    a end · then 1 · then 2 · timeout
//  `await b()` costs one tick here because b() is a native promise;
//  older engines charged three, which is why stale blog posts disagree.
//
//  ── snippet 3 ────────────────────────────────────────────────────────
//  `return await r` unwraps in ONE tick. `return r` — returning a promise
//  from an async function — costs TWO extra ticks, because the outer
//  promise has to adopt the inner one: one tick to call `r.then`, one
//  more for that callback to resolve the outer promise.
//    tick 1: t1 · retAwait settles
//    tick 2: t2 (and the adoption machinery for `ret` grinds on)
//    tick 3: ret · t3
//  Reading the log: t1, retAwait, t2, ret, t3, t4.
//  ⇒ t1 · retAwait · t2 · ret · t3 · t4
//  This is the whole reason `return await` inside a try/catch is not
//  redundant — and the reason `return somePromise` shifts your ordering.

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

export const answer1 = ['s', 'e', 'qm1', 'p1', 'qm3', 'qm2', 'p2'];

export const answer2 = [
  'script start',
  'a start',
  'b',
  'promise ctor',
  'script end',
  'a end',
  'then 1',
  'then 2',
  'timeout',
];

export const answer3 = ['t1', 'retAwait', 't2', 'ret', 't3', 't4'];

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
