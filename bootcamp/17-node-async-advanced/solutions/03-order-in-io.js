// ─────────────────────────────────────────────────────────────────────────
//  03 · order · inside an I/O callback — SOLUTION              ★★☆ core
//  run: node 03-order-in-io.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the readFile callback runs in the POLL phase. Its own
//  synchronous log goes first. The moment that callback returns, Node
//  drains the nextTick queue ('tick'), then the microtask queue
//  ('promise') — that pair happens between every callback, in every
//  phase. Then libuv moves on to the next phase in the cycle, which is
//  CHECK, so 'immediate' runs. The zero-delay timer has to wait for the
//  TIMERS phase, and timers already ran earlier this turn, so it lands on
//  the next trip around the loop — last.
//  That is the rule worth memorising: inside any I/O callback,
//  setImmediate always beats setTimeout(…, 0). At the top level of a
//  program the same two lines race, because whether the first timers
//  phase finds a 1 ms timer already expired depends on how long the
//  process took to start. Wrong turn: "0 ms means first". A zero-delay
//  timer is clamped to 1 ms and still has to wait its phase.

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

export const answer = ['io', 'tick', 'promise', 'immediate', 'timeout'];

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
