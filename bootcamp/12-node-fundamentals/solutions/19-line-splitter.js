// ─────────────────────────────────────────────────────────────────────────
//  19 · a line-splitting transform — SOLUTION                ★★★ stretch
//  run: node 19-line-splitter.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `leftover` is the whole trick. Append the chunk, split on
//  /\r?\n/, and pop the LAST piece back into leftover — it is either ''
//  (the chunk ended exactly on a newline) or the start of a line that has
//  not finished arriving. Everything before it is a complete line.
//  Because the '\r' stays in leftover until more bytes arrive, a chunk
//  boundary between '\r' and '\n' is handled for free; the naive version
//  that splits each chunk independently emits a phantom 'a\r' there.
//  flush() runs after the source ends and is the only place the final
//  unterminated line can be emitted — skip it and you silently drop the
//  last record of every file that lacks a trailing newline.
//  readableObjectMode is what lets an empty middle line through: in byte
//  mode push('') means "nothing to add" and an empty line disappears.

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
  let leftover = '';

  return new Transform({
    readableObjectMode: true,

    transform(chunk, encoding, callback) {
      leftover += chunk.toString('utf8');
      const pieces = leftover.split(/\r?\n/);
      leftover = pieces.pop();
      for (const line of pieces) this.push(line);
      callback();
    },

    flush(callback) {
      if (leftover !== '') this.push(leftover);
      callback();
    },
  });
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
