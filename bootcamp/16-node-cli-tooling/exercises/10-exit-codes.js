// ─────────────────────────────────────────────────────────────────────────
//  10 · exit codes                                         ★★☆ core
//  concepts: error types · exit codes · stderr · injected streams
//  run: node 10-exit-codes.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A CLI that always exits 0 is unusable in a script. Write the one
//  try/catch that wraps the whole program: it runs `main`, reports any
//  error to the INJECTED stderr, and RETURNS the exit code instead of
//  calling process.exit() — that is what makes it testable, and it also
//  lets stdout finish flushing before the process ends.
//
//      runCli(() => {})                     → 0
//      runCli(() => 3)                      → 3   (a returned number wins)
//      throw new UsageError('task add <text>')
//                     → 2, stderr 'usage: task add <text>\n'
//      throw new NotFoundError('no task #9')
//                     → 4, stderr 'error: no task #9\n'
//      throw new TypeError('boom')
//                     → 1, stderr 'error: boom\n'
//
//  A thrown non-Error (`throw 'oops'`) must still be reported, not printed
//  as 'error: undefined'. runCli must never reject.
//
//  hint: check the specific classes first, and remember that `.message`
//  on a plain string is undefined

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
  throw new Error('TODO');
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
