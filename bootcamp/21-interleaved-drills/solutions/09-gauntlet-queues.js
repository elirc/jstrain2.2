// ─────────────────────────────────────────────────────────────────────────
//  09 · gauntlet · queues — SOLUTION                       ★★☆ core
//  run: node 09-gauntlet-queues.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough — one rule, applied three times: run the script to the
//  end, then DRAIN the microtask queue completely, then take ONE
//  macrotask (timer), then drain microtasks again, and repeat.
//
//  ── snippet 1 ────────────────────────────────────────────────────────
//  script:      log A, queue timer B, queue microtask C, queue timer E,
//               log G                        → A, G
//  microtasks:  C runs and queues timer D    → C
//  timers, one at a time, draining microtasks after each:
//               B                            → B
//               E runs, queues microtask F; F drains before the next
//               timer                        → E, F
//               D                            → D
//  ⇒ A · G · C · B · E · F · D
//  The trap is D: it was queued from a MICROTASK that ran before timer B
//  even started, yet it lands last, because a timer scheduled at time T
//  goes behind the timers already waiting.
//
//  ── snippet 2 ────────────────────────────────────────────────────────
//  The `new Promise` executor is SYNCHRONOUS — 'executor' prints before
//  'after ctor', in the middle of the script. Resolving inside it does
//  not run `.then`; that is always a microtask. `p` is already resolved
//  when `.then` is attached, so its callback is queued immediately —
//  ahead of the `Promise.resolve().then` on the next line.
//  ⇒ executor · after ctor · end · then v · other
//
//  ── snippet 3 ────────────────────────────────────────────────────────
//  An async body runs synchronously up to the first `await`, so 'w1'
//  prints during the script. `await null` costs exactly one tick even
//  though there is no promise involved, and `work()` was called BEFORE
//  the then-chain was built, so it holds a one-step lead the whole way:
//  tick 1 → w2, m1;  tick 2 → w3, m2;  tick 3 → m3.
//  ⇒ start · w1 · end · w2 · m1 · w3 · m2 · m3

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

export const answer1 = ['A', 'G', 'C', 'B', 'E', 'F', 'D'];

export const answer2 = ['executor', 'after ctor', 'end', 'then v', 'other'];

export const answer3 = [
  'start',
  'w1',
  'end',
  'w2',
  'm1',
  'w3',
  'm2',
  'm3',
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
