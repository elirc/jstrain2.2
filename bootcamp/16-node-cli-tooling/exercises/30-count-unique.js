// ─────────────────────────────────────────────────────────────────────────
//  30 · sort | uniq -c                                     ★★☆ core
//  concepts: streaming filters · Map ordering · stable sorts
//  run: node 30-count-unique.js
// ─────────────────────────────────────────────────────────────────────────
//
//  The most-used pipeline in the world is `sort | uniq -c | sort -rn` —
//  which IPs, which errors, which endpoints. Write it as one filter over
//  injected streams, the same (input, output) shape as exercises 11–13.
//
//      countUnique(input, output)              → { lines: 7, unique: 3 }
//
//         2 b        first-seen order by default: b appeared first
//         2 a
//         3 c
//
//      countUnique(input, output, { sort: 'count' })   most frequent first
//      countUnique(input, output, { sort: 'key' })     alphabetical
//
//  The count is right-aligned in four columns, then one space, then the
//  line. Equal counts are broken alphabetically so two runs of the same
//  input can never disagree. `lines` is how many were read, `unique` how
//  many were distinct. Read a line at a time: a trailing newline is not
//  an extra empty line, and a CRLF file must not leave `\r` on the key.
//  Do not end the output stream — you do not own it.
//
//  hint: a Map keeps its keys in insertion order, which is exactly
//  "first seen" — and `[...map]` gives you pairs to sort

import { test, eq } from '../../_lib/check.js';
import { Readable, Writable } from 'node:stream';
import { createInterface } from 'node:readline';

export async function countUnique(input, output, { sort } = {}) {
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

// b and a appear twice, c three times — every ordering below differs.
const LOG = 'b\na\nb\nc\na\nc\nc\n';

test('counts each distinct line, in the order they first appeared', async () => {
  const out = collector();
  await countUnique(source(LOG), out);
  eq(out.text(), '   2 b\n   2 a\n   3 c\n');
});

test('resolves with the totals: lines read and lines that were distinct', async () => {
  eq(await countUnique(source(LOG), collector()), { lines: 7, unique: 3 });
});

test('sort by count: most frequent first, ties broken alphabetically', async () => {
  const out = collector();
  await countUnique(source(LOG), out, { sort: 'count' });
  eq(out.text(), '   3 c\n   2 a\n   2 b\n');
});

test('sort by key is plain alphabetical', async () => {
  const out = collector();
  await countUnique(source(LOG), out, { sort: 'key' });
  eq(out.text(), '   2 a\n   2 b\n   3 c\n');
});

test('the count column stays right-aligned as the numbers grow', async () => {
  const out = collector();
  await countUnique(source(`${'x\n'.repeat(10)}y\n`), out);
  eq(out.text(), '  10 x\n   1 y\n');
});

test('CRLF input and a missing last newline add no phantom lines', async () => {
  const out = collector();
  eq(await countUnique(source('a\r\nb\r\na'), out), { lines: 3, unique: 2 });
  eq(out.text(), '   2 a\n   1 b\n');
});

test('empty input writes nothing and counts nothing', async () => {
  const out = collector();
  eq(await countUnique(source(), out), { lines: 0, unique: 0 });
  eq(out.text(), '');
});

test('it does not end the output stream', async () => {
  const out = collector();
  await countUnique(source('a\n'), out);
  eq(out.writableEnded, false);
});
