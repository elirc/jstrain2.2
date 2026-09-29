// ─────────────────────────────────────────────────────────────────────────
//  18 · a Transform stream                                   ★★★ stretch
//  concepts: Transform · pipeline() · error propagation
//  run: node 18-transform-upper.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A Transform is a stream with an in-tray and an out-tray: chunks arrive,
//  you hand back changed chunks. It is how gzip, encryption and every
//  "process a 4 GB log file" script are built.
//
//      const t = upperCaseStream();
//      // 'ab' in → 'AB' out, chunk by chunk, nothing buffered whole
//
//      await runPipeline(Readable.from(['ab', 'cd']), upperCaseStream())
//        → 'ABCD'
//
//  runPipeline wires source → transform → collector with pipeline() from
//  'node:stream/promises' and resolves with the collected text. pipeline
//  is not optional politeness: it destroys every stream in the chain when
//  one of them fails, so a source error must come out as a rejection.
//
//  hint: new Transform({ transform(chunk, encoding, callback) { … } }) —
//  call callback(null, outputChunk) when the chunk is done, or
//  callback(err) to fail the stream. pipeline() accepts an async function
//  as its last stage and resolves with whatever that function returns.

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
  throw new Error('TODO');
}

export async function runPipeline(source, transform) {
  throw new Error('TODO');
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
