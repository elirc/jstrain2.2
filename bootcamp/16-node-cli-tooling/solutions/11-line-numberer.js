// ─────────────────────────────────────────────────────────────────────────
//  11 · stdin filter: nl — SOLUTION                        ★★☆ core
//  run: node 11-line-numberer.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the streams are PARAMETERS. In production you call
//  lineNumberer(process.stdin, process.stdout); in a test you hand it a
//  Readable.from([...]) and a Writable that keeps what it is given. Reach
//  for process.stdin inside the function and the function is untestable.
//  readline does the hard part: it buffers partial chunks and strips the
//  line ending, including the '\r' of a Windows file, so a chunk boundary
//  landing mid-line is invisible here. crlfDelay: Infinity makes it treat
//  '\r\n' as one break even when the two bytes arrive separately.
//  Iterating with `for await (const line of rl)` ends when the source
//  ends — and the function does NOT end the output: the caller owns
//  stdout, and closing someone else's stream is how you lose the last
//  line of a report.

import { test, eq } from '../../_lib/check.js';
import { Readable, Writable } from 'node:stream';
import { createInterface } from 'node:readline';

export async function lineNumberer(input, output) {
  const rl = createInterface({ input, crlfDelay: Infinity });
  let count = 0;
  for await (const line of rl) {
    count += 1;
    output.write(`${String(count).padStart(6)}\t${line}\n`);
  }
  return count;
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
