// ─────────────────────────────────────────────────────────────────────────
//  35 · gzip a file, streaming — SOLUTION                       ★★☆ core
//  run: node 35-zlib-file.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: three stages and one await. createReadStream produces
//  64 KB chunks, createGzip compresses each one, createWriteStream lands
//  them on disk — peak memory is a couple of buffers no matter how big
//  the file is. The in-memory version (readFile → gzip → writeFile) is
//  fine for a config file and fatal for a log.
//  pipeline is doing three jobs here: it wires the chain, it resolves
//  only after the final 'finish', and it destroys every stage if any one
//  of them errors. That last one is why gunzipFile's rejection on a
//  non-gzip file does not leave a dangling write handle behind.
//  The sizes come from fs.stat AFTER the pipeline resolves. Reading them
//  earlier is the classic race: the write stream still has bytes queued
//  and you report a file that is half its final size.

import { test, eq, ok, rejects } from '../../_lib/check.js';
import { randomUUID } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { createGunzip, createGzip } from 'node:zlib';

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

async function sizesOf(sourcePath, destPath) {
  return {
    bytesIn: (await fs.stat(sourcePath)).size,
    bytesOut: (await fs.stat(destPath)).size,
  };
}

export async function gzipFile(sourcePath, destPath) {
  await pipeline(
    createReadStream(sourcePath),
    createGzip(),
    createWriteStream(destPath)
  );
  return sizesOf(sourcePath, destPath);
}

export async function gunzipFile(sourcePath, destPath) {
  await pipeline(
    createReadStream(sourcePath),
    createGunzip(),
    createWriteStream(destPath)
  );
  return sizesOf(sourcePath, destPath);
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
