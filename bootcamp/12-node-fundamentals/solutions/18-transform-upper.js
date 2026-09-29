// ─────────────────────────────────────────────────────────────────────────
//  18 · a Transform stream — SOLUTION                        ★★★ stretch
//  run: node 18-transform-upper.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the transform callback is the contract — nothing moves
//  until you call it. callback(null, value) pushes a chunk downstream;
//  forget the call and the pipeline hangs until the test times out.
//  chunk.toString('utf8') covers both incoming shapes: a Buffer decodes,
//  and Readable.from over strings still arrives as a Buffer because the
//  writable side of a byte-mode Transform converts strings for you.
//  pipeline() takes an async function as its final stage and resolves
//  with that function's return value, which is why the collector reads as
//  a plain for-await loop. Use pipeline rather than a.pipe(b).pipe(c):
//  pipe leaks — if one stream errors the others stay open, holding file
//  handles and sockets. pipeline tears the whole chain down and rejects.

import { test, eq, ok, rejects } from '../../_lib/check.js';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';

// Provided: a source that fails as soon as anyone reads from it.
function brokenSource() {
  return new Readable({
    read() {
      this.destroy(new Error('boom'));
    },
  });
}

export function upperCaseStream() {
  return new Transform({
    transform(chunk, encoding, callback) {
      callback(null, chunk.toString('utf8').toUpperCase());
    },
  });
}

export async function runPipeline(source, transform) {
  return pipeline(source, transform, async function collect(output) {
    const chunks = [];
    for await (const chunk of output) chunks.push(Buffer.from(chunk));
    return Buffer.concat(chunks).toString('utf8');
  });
}

// ──────────────────────────── tests ──────────────────────────────────────

test('upperCaseStream is a Transform', () => {
  ok(upperCaseStream() instanceof Transform);
});

test('uppercases a single chunk', async () => {
  eq(await runPipeline(Readable.from(['hello']), upperCaseStream()), 'HELLO');
});

test('uppercases across many chunks', async () => {
  eq(await runPipeline(Readable.from(['ab', 'cd', 'ef']), upperCaseStream()), 'ABCDEF');
});

test('leaves digits and punctuation alone', async () => {
  eq(
    await runPipeline(Readable.from(['a1-b2!']), upperCaseStream()),
    'A1-B2!'
  );
});

test('handles Buffer chunks', async () => {
  const source = Readable.from([Buffer.from('ab'), Buffer.from('cd')]);
  eq(await runPipeline(source, upperCaseStream()), 'ABCD');
});

test('an empty source produces an empty string', async () => {
  eq(await runPipeline(Readable.from([]), upperCaseStream()), '');
});

test('a fresh transform can be reused for a second run', async () => {
  eq(await runPipeline(Readable.from(['one']), upperCaseStream()), 'ONE');
  eq(await runPipeline(Readable.from(['two']), upperCaseStream()), 'TWO');
});

test('an error in the source rejects the pipeline', async () => {
  eq(await runPipeline(Readable.from(['x']), upperCaseStream()), 'X');
  await rejects(() => runPipeline(brokenSource(), upperCaseStream()), 'boom');
});
