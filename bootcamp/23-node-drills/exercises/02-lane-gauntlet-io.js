// ─────────────────────────────────────────────────────────────────────────
//  02 · lane gauntlet · inside I/O callbacks                     ★★☆ core
//  concepts: poll phase · check phase · nested callbacks · lane drains
//  run: node 02-lane-gauntlet-io.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Module 17 asked you this once, with one snippet. Three now, and this
//  time everything is scheduled from inside a `readFile` callback — the
//  poll phase, where real servers live.
//
//  Predict each printed order and fill in the matching array. Snippet 2
//  nests an I/O call inside an I/O call; note which phase each callback
//  can possibly run in.
//
//      answer1 → seven strings
//      answer2 → five strings
//      answer3 → seven strings

import { test, eq, ok } from '../../_lib/check.js';
import { readFile } from 'node:fs';
import { fileURLToPath } from 'node:url';

const THIS_FILE = fileURLToPath(import.meta.url);

// ── snippet 1 ────────────────────────────────────────────────────────────
//
//    readFile(THIS_FILE, () => {
//      log('io');
//      setImmediate(() => {
//        log('immediate');
//        process.nextTick(() => log('immediate>tick'));
//      });
//      setTimeout(() => log('timeout'), 0);
//      process.nextTick(() => {
//        log('tick');
//        queueMicrotask(() => log('tick>micro'));
//      });
//      Promise.resolve().then(() => log('promise'));
//    });
//
export function capture1() {
  return inIO(7, (log) => {
    log('io');
    setImmediate(() => {
      log('immediate');
      process.nextTick(() => log('immediate>tick'));
    });
    setTimeout(() => log('timeout'), 0);
    process.nextTick(() => {
      log('tick');
      queueMicrotask(() => log('tick>micro'));
    });
    Promise.resolve().then(() => log('promise'));
  });
}

// ── snippet 2 ────────────────────────────────────────────────────────────
//
//    readFile(THIS_FILE, () => {
//      log('outer-io');
//      setImmediate(() => log('outer>immediate'));
//      readFile(THIS_FILE, () => {
//        log('inner-io');
//        setImmediate(() => log('inner>immediate'));
//        process.nextTick(() => log('inner>tick'));
//      });
//    });
//
export function capture2() {
  return inIO(5, (log) => {
    log('outer-io');
    setImmediate(() => log('outer>immediate'));
    readFile(THIS_FILE, () => {
      log('inner-io');
      setImmediate(() => log('inner>immediate'));
      process.nextTick(() => log('inner>tick'));
    });
  });
}

// ── snippet 3 ────────────────────────────────────────────────────────────
//
//    readFile(THIS_FILE, () => {
//      log('io');
//      process.nextTick(() => {
//        log('tick-1');
//        process.nextTick(() => log('tick-2'));
//      });
//      Promise.resolve().then(() => {
//        log('promise');
//        process.nextTick(() => log('promise>tick'));
//        setImmediate(() => log('promise>immediate'));
//      });
//      setImmediate(() => log('immediate'));
//    });
//
export function capture3() {
  return inIO(7, (log) => {
    log('io');
    process.nextTick(() => {
      log('tick-1');
      process.nextTick(() => log('tick-2'));
    });
    Promise.resolve().then(() => {
      log('promise');
      process.nextTick(() => log('promise>tick'));
      setImmediate(() => log('promise>immediate'));
    });
    setImmediate(() => log('immediate'));
  });
}

// Provided: runs a snippet inside a readFile callback and resolves with
// the logs once all `count` of them have arrived.
function inIO(count, snippet) {
  return new Promise((resolve) => {
    readFile(THIS_FILE, () => {
      const out = [];
      snippet((message) => {
        out.push(message);
        if (out.length === count) resolve(out);
      });
    });
  });
}

const requireAnswer = (answer, name) => {
  if (answer.length === 0) throw new Error(`TODO: fill in \`${name}\``);
};

export const answer1 = [];

export const answer2 = [];

export const answer3 = [];

// ──────────────────────────── tests ──────────────────────────────────────

test('all three answers are filled in with strings', () => {
  for (const [answer, name] of [
    [answer1, 'answer1'],
    [answer2, 'answer2'],
    [answer3, 'answer3'],
  ]) {
    requireAnswer(answer, name);
    ok(answer.every((s) => typeof s === 'string'), `${name} holds strings`);
  }
});

test('snippet 1 lists every log exactly once', async () => {
  requireAnswer(answer1, 'answer1');
  eq([...answer1].sort(), [...(await capture1())].sort());
});

test('snippet 1 gets the order exactly right', async () => {
  requireAnswer(answer1, 'answer1');
  eq(answer1, await capture1());
});

test('snippet 2 gets the order exactly right', async () => {
  requireAnswer(answer2, 'answer2');
  eq(answer2, await capture2());
});

test('snippet 3 lists every log exactly once', async () => {
  requireAnswer(answer3, 'answer3');
  eq([...answer3].sort(), [...(await capture3())].sort());
});

test('snippet 3 gets the order exactly right', async () => {
  requireAnswer(answer3, 'answer3');
  eq(answer3, await capture3());
});

test('all three snippets print the same order every run', async () => {
  requireAnswer(answer1, 'answer1');
  eq(await capture1(), await capture1());
  eq(await capture2(), await capture2());
  eq(await capture3(), await capture3());
});
