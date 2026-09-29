// ─────────────────────────────────────────────────────────────────────────
//  19 · a line-splitting transform                          ★★★ stretch
//  concepts: Transform · objectMode · buffering · flush
//  run: node 19-line-splitter.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Reading a log file gives you chunks of arbitrary size — 64 KB that
//  starts and ends mid-line. Turning that back into lines is the most
//  common Transform there is, and every naive version loses data.
//
//      lineStream()   // in:  'alpha\nbe'  then  'ta\ngamma'
//                     // out: 'alpha', 'beta', 'gamma'
//
//  Requirements:
//    · one line per output chunk, no trailing '\n' on any of them
//    · '\r\n' counts as one line ending — even when '\r' ends one chunk
//      and '\n' starts the next
//    · a final line with no newline after it is still emitted
//    · a trailing newline does NOT produce a phantom empty line, but an
//      empty line in the MIDDLE is real and must be kept
//
//  hint: keep a leftover string between calls. split() on the buffer,
//  pop() the last piece back into the leftover (it may be incomplete),
//  push the rest — then handle whatever is left in flush(callback).
//  Reach for readableObjectMode: true, or pushing '' will end your stream.

import { test, eq, ok } from '../../_lib/check.js';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';

// Provided: feed these chunks through YOUR lineStream() and collect the
// lines it emits.
async function linesFrom(chunks) {
  const lines = [];
  await pipeline(Readable.from(chunks), lineStream(), async function collect(out) {
    for await (const line of out) lines.push(line);
  });
  return lines;
}

export function lineStream() {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('lineStream is a Transform', () => {
  ok(lineStream() instanceof Transform);
});

test('splits a single chunk into lines', async () => {
  eq(await linesFrom(['alpha\nbeta\ngamma\n']), ['alpha', 'beta', 'gamma']);
});

test('does not care where the chunk boundaries fall', async () => {
  eq(await linesFrom(['alp', 'ha\nbe', 'ta\ngamma\n']), ['alpha', 'beta', 'gamma']);
});

test('emits the last line even without a trailing newline', async () => {
  eq(await linesFrom(['alpha\nbeta']), ['alpha', 'beta']);
});

test('a trailing newline does not add an empty line', async () => {
  eq(await linesFrom(['only\n']), ['only']);
  eq(await linesFrom([]), []);
});

test('keeps empty lines in the middle', async () => {
  eq(await linesFrom(['a\n\nb\n']), ['a', '', 'b']);
});

test('handles Windows line endings', async () => {
  eq(await linesFrom(['a\r\nb\r\n']), ['a', 'b']);
});

test('survives a chunk boundary between \\r and \\n', async () => {
  eq(await linesFrom(['a\r', '\nb']), ['a', 'b']);
});
