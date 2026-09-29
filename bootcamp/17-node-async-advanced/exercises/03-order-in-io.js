// ─────────────────────────────────────────────────────────────────────────
//  03 · order · inside an I/O callback                         ★★☆ core
//  concepts: libuv phases · poll vs check · setImmediate
//  run: node 03-order-in-io.js
// ─────────────────────────────────────────────────────────────────────────
//
//  At the top level of a program, `setTimeout(fn, 0)` versus
//  `setImmediate(fn)` is a genuine coin flip — it depends on how long
//  Node took to boot. Inside an I/O callback it is not a coin flip at
//  all. Predict this:
//
//      fs.readFile(thisFile, () => {
//        log('io');
//        setTimeout(() => log('timeout'), 0);
//        setImmediate(() => log('immediate'));
//        process.nextTick(() => log('tick'));
//        Promise.resolve().then(() => log('promise'));
//      });
//
//  Fill `answer` with the five strings in printed order. The deciding
//  question: when the readFile callback returns, which libuv phase does
//  the loop visit NEXT, and which one did it already pass this turn?
//
//  hint: the phases run in a fixed cycle — timers → poll (your I/O
//  callback) → check (setImmediate) → back to timers

import { test, eq, ok } from '../../_lib/check.js';
import { readFile } from 'node:fs';
import { fileURLToPath } from 'node:url';

const THIS_FILE = fileURLToPath(import.meta.url);

// Runs exactly the snippet above and returns the logs it produced.
export function capture() {
  return new Promise((resolve) => {
    readFile(THIS_FILE, () => {
      const out = [];
      const log = (m) => {
        out.push(m);
        if (out.length === 5) resolve(out); // all five logs are in
      };
      log('io');
      setTimeout(() => log('timeout'), 0);
      setImmediate(() => log('immediate'));
      process.nextTick(() => log('tick'));
      Promise.resolve().then(() => log('promise'));
    });
  });
}

const requireAnswer = () => {
  if (answer.length === 0) throw new Error('TODO: fill in `answer`');
};

export const answer = [];

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

test("starts with the I/O callback's own log", async () => {
  requireAnswer();
  eq(answer[0], (await capture())[0]);
});

test('the order is stable across runs — no coin flip in here', async () => {
  requireAnswer();
  eq(await capture(), await capture());
});

test('gets the order exactly right', async () => {
  requireAnswer();
  eq(answer, await capture());
});
