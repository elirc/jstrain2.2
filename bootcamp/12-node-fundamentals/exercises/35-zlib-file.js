// ─────────────────────────────────────────────────────────────────────────
//  35 · gzip a file, streaming                                  ★★☆ core
//  concepts: createReadStream · createGzip · pipeline · fs.stat
//  run: node 35-zlib-file.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Exercise 20 gzipped a string in memory. A 4 GB log file does not fit
//  in memory, so the real version never holds the file at all: read
//  stream → gzip stream → write stream, three stages and a pipeline.
//
//      await gzipFile('app.log', 'app.log.gz')
//        → { bytesIn: 40960, bytesOut: 812 }
//      await gunzipFile('app.log.gz', 'restored.log')
//        → { bytesIn: 812, bytesOut: 40960 }
//
//  Both return the size of the source file and the size of the file they
//  wrote, taken from fs.stat after the copy finishes. gunzipFile on
//  something that is not gzip must reject — the gzip header check does
//  that for you, as long as you let the rejection out.
//
//  hint: `await pipeline(a, b, c)` from node:stream/promises wires the
//  three stages, waits for the last byte and destroys the whole chain if
//  any stage fails. `a.pipe(b).pipe(c)` leaks file handles on error.

import { test, eq, ok, rejects } from '../../_lib/check.js';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

// Provided: temp dir per test. Build the paths you need inside it.
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

export async function gzipFile(sourcePath, destPath) {
  throw new Error('TODO');
}

export async function gunzipFile(sourcePath, destPath) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('the compressed file starts with the gzip magic bytes', async () => {
  await withTempDir(async (dir) => {
    const src = path.join(dir, 'app.log');
    const gz = path.join(dir, 'app.log.gz');
    await fs.writeFile(src, 'hello from the log', 'utf8');
    await gzipFile(src, gz);
    const head = await fs.readFile(gz);
    eq([head[0], head[1]], [0x1f, 0x8b]);
  });
});

test('a file survives the round trip', async () => {
  await withTempDir(async (dir) => {
    const src = path.join(dir, 'app.log');
    const gz = path.join(dir, 'app.log.gz');
    const back = path.join(dir, 'restored.log');
    const text = 'line one\nline two\nline three\n';
    await fs.writeFile(src, text, 'utf8');
    await gzipFile(src, gz);
    await gunzipFile(gz, back);
    eq(await fs.readFile(back, 'utf8'), text);
  });
});

test('repetitive content actually gets smaller', async () => {
  await withTempDir(async (dir) => {
    const src = path.join(dir, 'big.log');
    const gz = path.join(dir, 'big.log.gz');
    await fs.writeFile(src, 'compress me '.repeat(500), 'utf8');
    const { bytesIn, bytesOut } = await gzipFile(src, gz);
    ok(bytesOut < bytesIn / 10, `expected real compression, got ${bytesOut}`);
  });
});

test('the byte counts describe both files', async () => {
  await withTempDir(async (dir) => {
    const src = path.join(dir, 'a.txt');
    const gz = path.join(dir, 'a.txt.gz');
    await fs.writeFile(src, 'x'.repeat(1000), 'utf8');
    const packed = await gzipFile(src, gz);
    eq(packed.bytesIn, 1000);
    eq(packed.bytesOut, (await fs.stat(gz)).size);
    const unpacked = await gunzipFile(gz, path.join(dir, 'back.txt'));
    eq(unpacked.bytesIn, packed.bytesOut);
    eq(unpacked.bytesOut, 1000);
  });
});

test('UTF-8 comes back byte for byte', async () => {
  await withTempDir(async (dir) => {
    const src = path.join(dir, 'hi.txt');
    const gz = path.join(dir, 'hi.txt.gz');
    const back = path.join(dir, 'back.txt');
    await fs.writeFile(src, 'café 👋 naïve — αβγ', 'utf8');
    await gzipFile(src, gz);
    await gunzipFile(gz, back);
    eq(await fs.readFile(back, 'utf8'), 'café 👋 naïve — αβγ');
  });
});

test('an empty file round trips too', async () => {
  await withTempDir(async (dir) => {
    const src = path.join(dir, 'empty.txt');
    const gz = path.join(dir, 'empty.txt.gz');
    const back = path.join(dir, 'back.txt');
    await fs.writeFile(src, '', 'utf8');
    const { bytesIn } = await gzipFile(src, gz);
    eq(bytesIn, 0);
    await gunzipFile(gz, back);
    eq(await fs.readFile(back, 'utf8'), '');
  });
});

test('gunzipping something that is not gzip rejects', async () => {
  await withTempDir(async (dir) => {
    const notGz = path.join(dir, 'plain.txt');
    await fs.writeFile(notGz, 'definitely not compressed', 'utf8');
    await rejects(() => gunzipFile(notGz, path.join(dir, 'out.txt')));
  });
});
