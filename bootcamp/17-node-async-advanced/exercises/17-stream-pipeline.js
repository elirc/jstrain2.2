// ─────────────────────────────────────────────────────────────────────────
//  17 · an async-generator transform                           ★★☆ core
//  concepts: Readable.from · async generators · pipeline
//  run: node 17-stream-pipeline.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Before async generators, a stream stage meant subclassing Transform
//  and remembering to call a callback. Now a stage is a function that
//  takes an async iterable and yields another one — and `pipeline`
//  accepts it directly.
//
//      async function* shout(source) {
//        for await (const chunk of source) yield …;
//      }
//
//      await run(['ab', 'cd'])   → 'ABCD'
//      await run([])             → ''
//
//  Build two things: `shout`, which uppercases each chunk after a small
//  await (so you can see that a slow stage still preserves order), and
//  `run`, which pipes an array through it and collects the result as one
//  string.
//
//  hint: pipeline(source, ...stages, collector) — the last stage may be
//  an async function taking the stream, and pipeline resolves with what
//  that function returns

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
  throw new Error('TODO');
}

export async function run(items) {
  throw new Error('TODO');
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
