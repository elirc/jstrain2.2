// ─────────────────────────────────────────────────────────────────────────
//  05 · fs text files — SOLUTION                           ★☆☆ warm-up
//  run: node 05-fs-text.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the whole lesson is "pass the encoding". readFile with no
//  encoding hands back a Buffer, and `buffer + ''` looks fine right up to
//  the first non-ASCII character. writeFile always truncates; appendFile
//  is the one that adds to the end — and it creates the file if it is not
//  there, so no existence check is needed.
//  readLines strips one trailing newline BEFORE splitting; splitting
//  first gives you a bogus '' as the last element. The /\r?\n/ pattern
//  means a file written on Windows reads back the same as one from CI.

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
  await fs.writeFile(file, text, 'utf8');
}

export async function readText(file) {
  return fs.readFile(file, 'utf8');
}

export async function appendLine(file, line) {
  await fs.appendFile(file, `${line}\n`, 'utf8');
}

export async function readLines(file) {
  const text = await readText(file);
  if (text === '') return [];
  return text.replace(/\r?\n$/, '').split(/\r?\n/);
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
