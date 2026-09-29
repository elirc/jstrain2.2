// ─────────────────────────────────────────────────────────────────────────
//  11 · stdin filter: nl                                   ★★☆ core
//  concepts: readline · injected streams · line endings
//  run: node 11-line-numberer.js
// ─────────────────────────────────────────────────────────────────────────
//
//  The Unix filter shape: read lines from an input stream, write to an
//  output stream, resolve when the input ends. Both streams are
//  PARAMETERS — in production you pass process.stdin and process.stdout,
//  in these tests you pass fakes. Never touch the globals inside.
//
//      lineNumberer(source('alpha\nbeta\n'), out)   → resolves 2
//      out                                          → '     1\talpha\n'
//                                                     '     2\tbeta\n'
//
//  The number is right-aligned in six columns, then a TAB, then the line,
//  then '\n'. Count from 1. Windows line endings must not leave a '\r'
//  glued to the end of the text, a final line with no newline still
//  counts, and the output stream must NOT be ended — you do not own it.
//
//  hint: `const rl = createInterface({ input, crlfDelay: Infinity })`,
//  then `for await (const line of rl)` — readline handles the buffering

import { test, eq } from '../../_lib/check.js';
import { Readable, Writable } from 'node:stream';
import { createInterface } from 'node:readline';

export async function lineNumberer(input, output) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

// Provided: fake stdin (from chunks) and fake stdout (that remembers).
const source = (...chunks) => Readable.from(chunks);

function collector() {
  const chunks = [];
  const stream = new Writable({
    write(chunk, encoding, callback) {
      chunks.push(chunk.toString('utf8'));
      callback();
    },
  });
  stream.text = () => chunks.join('');
  return stream;
}

test('numbers every line in a six-wide gutter', async () => {
  const out = collector();
  await lineNumberer(source('alpha\nbeta\n'), out);
  eq(out.text(), '     1\talpha\n     2\tbeta\n');
});

test('resolves with the number of lines it wrote', async () => {
  eq(await lineNumberer(source('a\nb\nc\n'), collector()), 3);
});

test('the gutter widens past nine without shifting', async () => {
  const out = collector();
  await lineNumberer(source('x\n'.repeat(10)), out);
  const lines = out.text().split('\n');
  eq(lines[0], '     1\tx');
  eq(lines[9], '    10\tx');
});

test('CRLF input leaves no stray carriage return behind', async () => {
  const out = collector();
  await lineNumberer(source('a\r\nb\r\n'), out);
  eq(out.text(), '     1\ta\n     2\tb\n');
});

test('a last line without a newline is still numbered', async () => {
  const out = collector();
  eq(await lineNumberer(source('only'), out), 1);
  eq(out.text(), '     1\tonly\n');
});

test('empty input writes nothing and counts nothing', async () => {
  const out = collector();
  eq(await lineNumberer(source(), out), 0);
  eq(out.text(), '');
});

test('chunk boundaries inside a line change nothing', async () => {
  const out = collector();
  await lineNumberer(source('al', 'pha\nbe', 'ta\n'), out);
  eq(out.text(), '     1\talpha\n     2\tbeta\n');
});

test('it does not end the output stream', async () => {
  const out = collector();
  await lineNumberer(source('a\n'), out);
  eq(out.writableEnded, false);
});
