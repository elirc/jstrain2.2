// ─────────────────────────────────────────────────────────────────────────
//  17 · an async-generator transform — SOLUTION                ★★☆ core
//  run: node 17-stream-pipeline.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: a stream stage is just "async iterable in, async
//  iterable out", and an async generator is the least ceremonious way to
//  write one — no Transform subclass, no callback to forget. The await
//  inside the loop is real back-pressure: while this stage is busy, the
//  source is not pulled, so a slow stage cannot be flooded by a fast one.
//  Order is preserved for free because a generator yields sequentially.
//  `chunk.toString('utf8')` covers both shapes: Readable.from over
//  strings still delivers Buffers once the data has been through a
//  stream, and a Buffer that is already a Buffer decodes the same way.
//  Use pipeline(), never a.pipe(b).pipe(c). pipe leaks: if one stream
//  errors, the others stay open holding file handles and sockets.
//  pipeline destroys the whole chain and gives you one rejected promise
//  — which is exactly what the broken-source test proves.
//  Wrong turn: collecting into an array "just to be safe". That reads
//  the entire stream into memory and throws away the only reason to use
//  a stream in the first place.

import { test, eq, ok, rejects, sleep } from '../../_lib/check.js';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

// Provided: a source that fails as soon as anyone reads from it.
function brokenSource() {
  return new Readable({
    read() {
      this.destroy(new Error('disk went away'));
    },
  });
}

export async function* shout(source) {
  for await (const chunk of source) {
    await sleep(2); // a slow stage; order still holds
    yield chunk.toString('utf8').toUpperCase();
  }
}

export async function run(items) {
  return pipeline(Readable.from(items), shout, async function collect(stream) {
    let text = '';
    for await (const chunk of stream) text += chunk;
    return text;
  });
}

// ──────────────────────────── tests ──────────────────────────────────────

test('uppercases a single chunk', async () => {
  eq(await run(['hello']), 'HELLO');
});

test('joins many chunks, in order, despite the delay', async () => {
  eq(await run(['ab', 'cd', 'ef']), 'ABCDEF');
});

test('an empty source produces an empty string', async () => {
  eq(await run([]), '');
});

test('digits and punctuation come through untouched', async () => {
  eq(await run(['a1-', 'b2!']), 'A1-B2!');
});

test('Buffer chunks are handled too', async () => {
  eq(await run([Buffer.from('ab'), Buffer.from('cd')]), 'ABCD');
});

test('shout is an async generator you can drive by hand', async () => {
  const out = [];
  for await (const chunk of shout(Readable.from(['a', 'b']))) out.push(chunk);
  eq(out, ['A', 'B']);
});

test('an error in the source tears the whole pipeline down', async () => {
  eq(await run(['fine']), 'FINE');
  const collect = async (stream) => {
    let text = '';
    for await (const chunk of stream) text += chunk;
    return text;
  };
  await rejects(
    () => pipeline(brokenSource(), shout, collect),
    'disk went away'
  );
  ok(true, 'pipeline rejects instead of leaking the open streams');
});
