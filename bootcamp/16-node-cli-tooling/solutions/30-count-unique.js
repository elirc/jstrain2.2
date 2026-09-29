// ─────────────────────────────────────────────────────────────────────────
//  30 · sort | uniq -c — SOLUTION                          ★★☆ core
//  run: node 30-count-unique.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: three Unix tools in one pass. `wc` counts, a Map does
//  what `sort` was only ever there for — putting equal lines together —
//  and `uniq -c` prints the tally. The shell needs the sort because its
//  tools see one line at a time and cannot remember; a Map can, so this
//  reads the input once instead of three times.
//  A Map, not an object: it keeps insertion order for string keys, which
//  is what "first seen" means here, and it cannot collide with
//  '__proto__' or 'constructor' the way `counts[line] += 1` can. A log
//  file containing the line `__proto__` is not a hypothetical.
//  Ties are broken alphabetically instead of left to chance. Sorting only
//  by count leaves equal counts in whatever order they arrived, so the
//  output of two identical runs can differ — and a report nobody can diff
//  is a report nobody trusts. The comparison is < and >, not
//  localeCompare: byte order is the same everywhere, and a machine
//  changing locale must not change your output.
//  The output stream is written to and never ended — the caller owns it.

import { test, eq } from '../../_lib/check.js';
import { Readable, Writable } from 'node:stream';
import { createInterface } from 'node:readline';

export async function countUnique(input, output, { sort } = {}) {
  const rl = createInterface({ input, crlfDelay: Infinity });
  const counts = new Map();
  let lines = 0;

  for await (const line of rl) {
    lines += 1;
    counts.set(line, (counts.get(line) ?? 0) + 1);
  }

  const byKey = (a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0);
  const entries = [...counts];
  if (sort === 'key') entries.sort(byKey);
  else if (sort === 'count') entries.sort((a, b) => b[1] - a[1] || byKey(a, b));

  for (const [line, count] of entries) {
    output.write(`${String(count).padStart(4)} ${line}\n`);
  }

  return { lines, unique: counts.size };
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
