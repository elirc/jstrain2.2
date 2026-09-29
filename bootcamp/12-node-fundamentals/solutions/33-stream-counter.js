// ─────────────────────────────────────────────────────────────────────────
//  33 · a counting Transform — SOLUTION                         ★★☆ core
//  run: node 33-stream-counter.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the counters live in a closure and are hung on the stream
//  as `.counts`, so the caller can read them after the pipeline resolves
//  without the stream having to emit anything extra.
//  `callback(null, chunk)` is the pass-through idiom: count, then forward
//  the exact same Buffer. Nothing is decoded, which is what keeps a
//  multi-byte character split across two chunks intact — decoding a chunk
//  to count characters is the classic wrong turn here, and it corrupts
//  the emoji AND gets the byte count wrong.
//  Newlines are counted as the BYTE 0x0a, which is safe: no byte of a
//  multi-byte UTF-8 character can ever be 0x0a.
//  `endedMidLine` remembers the last non-empty chunk's final byte, and
//  flush() — the one hook that runs after the source is exhausted — turns
//  it into the +1 for a file with no trailing newline.

import { test, eq, ok } from '../../_lib/check.js';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';

// Provided: push these chunks through YOUR stream and hand back
// everything that came out the other side, as one Buffer.
async function runThrough(chunks, stream) {
  const out = [];
  await pipeline(Readable.from(chunks), stream, async function collect(source) {
    for await (const chunk of source) out.push(Buffer.from(chunk));
  });
  return Buffer.concat(out);
}

export function countingStream() {
  const counts = { bytes: 0, lines: 0 };
  let endedMidLine = false;

  const meter = new Transform({
    transform(chunk, encoding, callback) {
      counts.bytes += chunk.length;
      for (const byte of chunk) {
        if (byte === 0x0a) counts.lines += 1;
      }
      if (chunk.length > 0) {
        endedMidLine = chunk[chunk.length - 1] !== 0x0a;
      }
      callback(null, chunk);
    },

    flush(callback) {
      if (endedMidLine) counts.lines += 1;
      callback();
    },
  });

  meter.counts = counts;
  return meter;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('it is a Transform that changes nothing', async () => {
  const meter = countingStream();
  ok(meter instanceof Transform);
  const out = await runThrough(['alpha\n', 'beta\n'], meter);
  eq(out.toString('utf8'), 'alpha\nbeta\n');
});

test('counts bytes, not characters', async () => {
  const meter = countingStream();
  await runThrough(['👋'], meter); // 2 characters, 4 bytes
  eq(meter.counts.bytes, 4);
});

test('counts newline-terminated lines', async () => {
  const meter = countingStream();
  await runThrough(['a\nb\nc\n'], meter);
  eq(meter.counts, { bytes: 6, lines: 3 });
});

test('counts a final line with no trailing newline', async () => {
  const meter = countingStream();
  await runThrough(['a\nb'], meter);
  eq(meter.counts, { bytes: 3, lines: 2 });
});

test('an empty stream counts zero of everything', async () => {
  const meter = countingStream();
  eq((await runThrough([], meter)).length, 0);
  eq(meter.counts, { bytes: 0, lines: 0 });
});

test('chunk boundaries do not change the answer', async () => {
  const meter = countingStream();
  const out = await runThrough(['al', 'pha\n', '\n', 'beta'], meter);
  eq(out.toString('utf8'), 'alpha\n\nbeta');
  eq(meter.counts, { bytes: 11, lines: 3 });
});

test('a character split across two chunks stays intact', async () => {
  const meter = countingStream();
  const bytes = Buffer.from('héllo 👋\n', 'utf8');
  const out = await runThrough([bytes.subarray(0, 9), bytes.subarray(9)], meter);
  eq(out.toString('utf8'), 'héllo 👋\n');
  eq(meter.counts, { bytes: Buffer.byteLength('héllo 👋\n'), lines: 1 });
});
