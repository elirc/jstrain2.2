// ─────────────────────────────────────────────────────────────────────────
//  10 · exit codes — SOLUTION                              ★★☆ core
//  run: node 10-exit-codes.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: one try/catch at the very top of the program is the whole
//  pattern. Everything below it is free to `throw new UsageError(...)`
//  from wherever it notices the problem, and only this function knows
//  about streams, prefixes and numbers.
//  `instanceof` in most-specific-first order does the mapping; a
//  `switch (err.name)` would work too but breaks the moment someone
//  subclasses. The final branch handles a thrown string — rare, but
//  `err.message` on a string is undefined and prints 'error: undefined'.
//  Returning the code instead of calling process.exit() is what makes
//  this testable: the caller does `process.exitCode = await runCli(...)`,
//  which also lets stdout finish flushing. process.exit() truncates it.

import { test, eq } from '../../_lib/check.js';

// Provided: the error vocabulary and the codes they map to.
export class UsageError extends Error {
  constructor(message) {
    super(message);
    this.name = 'UsageError';
  }
}

export class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export const EXIT = { OK: 0, FAILURE: 1, USAGE: 2, NOT_FOUND: 4 };

export async function runCli(main, { stderr }) {
  try {
    const code = await main();
    return typeof code === 'number' ? code : EXIT.OK;
  } catch (err) {
    if (err instanceof UsageError) {
      stderr.write(`usage: ${err.message}\n`);
      return EXIT.USAGE;
    }
    if (err instanceof NotFoundError) {
      stderr.write(`error: ${err.message}\n`);
      return EXIT.NOT_FOUND;
    }
    stderr.write(`error: ${err instanceof Error ? err.message : String(err)}\n`);
    return EXIT.FAILURE;
  }
}

// ──────────────────────────── tests ──────────────────────────────────────

// Provided: a stand-in for process.stderr that remembers what it was told.
function fakeStream() {
  const chunks = [];
  return {
    write: (s) => {
      chunks.push(s);
      return true;
    },
    text: () => chunks.join(''),
  };
}

test('a function that completes exits 0', async () => {
  eq(await runCli(() => {}, { stderr: fakeStream() }), 0);
  eq(await runCli(async () => 'ignored', { stderr: fakeStream() }), 0);
});

test('a number returned by the function becomes the exit code', async () => {
  eq(await runCli(() => 3, { stderr: fakeStream() }), 3);
});

test('success writes nothing to stderr', async () => {
  const stderr = fakeStream();
  await runCli(() => 0, { stderr });
  eq(stderr.text(), '');
});

test('a UsageError exits 2 and prints a usage line', async () => {
  const stderr = fakeStream();
  eq(
    await runCli(
      () => {
        throw new UsageError('task add <text>');
      },
      { stderr }
    ),
    2
  );
  eq(stderr.text(), 'usage: task add <text>\n');
});

test('a NotFoundError exits 4', async () => {
  const stderr = fakeStream();
  eq(
    await runCli(
      () => {
        throw new NotFoundError('no task #9');
      },
      { stderr }
    ),
    4
  );
  eq(stderr.text(), 'error: no task #9\n');
});

test('any other error exits 1', async () => {
  const stderr = fakeStream();
  eq(
    await runCli(
      () => {
        throw new TypeError('x is not a function');
      },
      { stderr }
    ),
    1
  );
  eq(stderr.text(), 'error: x is not a function\n');
});

test('a thrown non-Error is still reported', async () => {
  const stderr = fakeStream();
  eq(
    await runCli(
      () => {
        throw 'plain string';
      },
      { stderr }
    ),
    1
  );
  eq(stderr.text(), 'error: plain string\n');
});

test('a rejected promise is handled like a throw, never rethrown', async () => {
  const stderr = fakeStream();
  const code = await runCli(
    async () => {
      await Promise.resolve();
      throw new NotFoundError('task #9');
    },
    { stderr }
  );
  eq(code, 4);
  eq(stderr.text(), 'error: task #9\n');
});
