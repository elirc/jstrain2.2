// ─────────────────────────────────────────────────────────────────────────
//  05 · fs text files                                      ★☆☆ warm-up
//  concepts: fs/promises · readFile · writeFile · appendFile
//  run: node 05-fs-text.js
// ─────────────────────────────────────────────────────────────────────────
//
//  `node:fs/promises` is the async API you should reach for by default:
//  every call returns a promise, and every failure is a rejection.
//
//      await writeText(file, 'hello')      → creates or replaces the file
//      await readText(file)                → 'hello'  (a string, not bytes)
//      await appendLine(file, 'a')         → adds 'a\n' to the end
//      await readLines(file)               → ['hello', 'a']
//
//  readText must return a string — readFile gives you a Buffer unless you
//  ask for an encoding. readLines splits on newlines and does NOT return
//  a phantom empty line for the trailing '\n'.

import { test, eq, ok, rejects } from '../../_lib/check.js';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

// Provided: each test gets its own empty directory, deleted afterwards
// even when the test fails. Unique name per run, so reruns never collide.
const TMP_ROOT = path.join(import.meta.dirname, '..', 'tmp-test');

async function withTempDir(run) {
  const dir = path.join(TMP_ROOT, randomUUID());
  await fs.mkdir(dir, { recursive: true });
  try {
    return await run(dir);
  } finally {
    await fs.rm(dir, { recursive: true, force: true, maxRetries: 3 });
    await fs.rmdir(TMP_ROOT).catch(() => {});
  }
}

export async function writeText(file, text) {
  throw new Error('TODO');
}

export async function readText(file) {
  throw new Error('TODO');
}

export async function appendLine(file, line) {
  throw new Error('TODO');
}

export async function readLines(file) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('writes a file and reads it back', async () => {
  await withTempDir(async (dir) => {
    const file = path.join(dir, 'note.txt');
    await writeText(file, 'hello');
    eq(await readText(file), 'hello');
  });
});

test('readText returns a string, not a Buffer', async () => {
  await withTempDir(async (dir) => {
    const file = path.join(dir, 'note.txt');
    await writeText(file, 'hello');
    ok(typeof (await readText(file)) === 'string');
  });
});

test('writeText replaces the whole file', async () => {
  await withTempDir(async (dir) => {
    const file = path.join(dir, 'note.txt');
    await writeText(file, 'first');
    await writeText(file, 'second');
    eq(await readText(file), 'second');
  });
});

test('appendLine creates the file when it does not exist', async () => {
  await withTempDir(async (dir) => {
    const file = path.join(dir, 'log.txt');
    await appendLine(file, 'started');
    eq(await readText(file), 'started\n');
  });
});

test('appendLine adds to the end without clobbering', async () => {
  await withTempDir(async (dir) => {
    const file = path.join(dir, 'log.txt');
    await appendLine(file, 'one');
    await appendLine(file, 'two');
    eq(await readText(file), 'one\ntwo\n');
  });
});

test('readLines ignores the trailing newline', async () => {
  await withTempDir(async (dir) => {
    const file = path.join(dir, 'log.txt');
    await writeText(file, 'alpha\nbeta\n');
    eq(await readLines(file), ['alpha', 'beta']);
  });
});

test('reading a missing file rejects with ENOENT', async () => {
  await withTempDir(async (dir) => {
    await writeText(path.join(dir, 'here.txt'), 'x');
    await rejects(() => readText(path.join(dir, 'gone.txt')), 'ENOENT');
  });
});
