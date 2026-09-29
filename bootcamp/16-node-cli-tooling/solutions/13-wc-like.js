// ─────────────────────────────────────────────────────────────────────────
//  13 · stdin filter: wc — SOLUTION                        ★★★ stretch
//  run: node 13-wc-like.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: three counters and one boolean. `inWord` lives OUTSIDE
//  the chunk loop, which is the whole exercise: 'hel' + 'lo wor' + 'ld\n'
//  is two words, and any solution that counts words per chunk says four.
//  Same story for the decoder — a chunk boundary can fall between the two
//  bytes of 'é', and chunk.toString() would turn that into two replacement
//  characters. StringDecoder holds the incomplete tail back until the
//  rest arrives, and decoder.end() releases whatever is left.
//  `lines` counts NEWLINE CHARACTERS, exactly like wc: 'a\nb' is 1, not 2.
//  That surprises people, and it is right — it is what makes `wc -l` agree
//  with the number of records in a well-formed file.
//  Streaming means memory stays flat: this counts a 40 GB log in 64 KB.

import { test, eq } from '../../_lib/check.js';
import { Readable, Writable } from 'node:stream';
import { StringDecoder } from 'node:string_decoder';

export async function countStream(input) {
  const decoder = new StringDecoder('utf8');
  const counts = { lines: 0, words: 0, chars: 0 };
  let inWord = false;

  const feed = (text) => {
    counts.chars += text.length;
    for (const ch of text) {
      if (ch === '\n') counts.lines += 1;
      if (/\s/.test(ch)) {
        inWord = false;
      } else if (!inWord) {
        inWord = true;
        counts.words += 1;
      }
    }
  };

  for await (const chunk of input) {
    feed(typeof chunk === 'string' ? chunk : decoder.write(chunk));
  }
  feed(decoder.end());

  return counts;
}

export async function wcLike(input, output, name) {
  const counts = await countStream(input);
  const columns = [counts.lines, counts.words, counts.chars]
    .map((n) => String(n).padStart(7))
    .join('');
  output.write(`${columns}${name ? ` ${name}` : ''}\n`);
  return counts;
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

test('counts lines, words and characters', async () => {
  eq(await countStream(source('hello world\nsecond line here\n')), {
    lines: 2,
    words: 5,
    chars: 29,
  });
});

test('lines counts newlines, so a missing last one shows', async () => {
  eq(await countStream(source('a\nb')), { lines: 1, words: 2, chars: 3 });
});

test('runs of whitespace do not inflate the word count', async () => {
  eq(await countStream(source('  a \t\n  b  \n')), {
    lines: 2,
    words: 2,
    chars: 12,
  });
});

test('empty input is all zeros', async () => {
  eq(await countStream(source()), { lines: 0, words: 0, chars: 0 });
});

test('a word split across two chunks counts once', async () => {
  eq(await countStream(source('hel', 'lo wor', 'ld\n')), {
    lines: 1,
    words: 2,
    chars: 12,
  });
});

test('counts characters, not bytes, across a split character', async () => {
  const bytes = Buffer.from('héllo\n', 'utf8');
  eq(bytes.length, 7);
  eq(await countStream(source(bytes.subarray(0, 2), bytes.subarray(2))), {
    lines: 1,
    words: 1,
    chars: 6,
  });
});

test('wcLike prints padded columns and the name', async () => {
  const out = collector();
  await wcLike(source('hello world\nsecond line here\n'), out, 'notes.txt');
  eq(out.text(), '      2      5     29 notes.txt\n');
});

test('wcLike resolves with what it printed, and needs no name', async () => {
  const out = collector();
  eq(await wcLike(source('a\n'), out), { lines: 1, words: 1, chars: 2 });
  eq(out.text(), '      1      1      2\n');
});
