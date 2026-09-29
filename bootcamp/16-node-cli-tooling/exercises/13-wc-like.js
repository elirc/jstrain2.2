// ─────────────────────────────────────────────────────────────────────────
//  13 · stdin filter: wc                                   ★★★ stretch
//  concepts: streaming state · StringDecoder · bytes vs characters
//  run: node 13-wc-like.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Count without buffering the file. Two functions:
//
//      countStream(source('hello world\nbye\n'))
//        → { lines: 2, words: 3, chars: 16 }
//
//      wcLike(source(text), out, 'notes.txt')
//        → the same object, and out gets
//          '      2      5     29 notes.txt\n'
//
//  `lines` counts NEWLINE characters, exactly like wc — 'a\nb' is 1 line.
//  `words` are runs of non-whitespace. `chars` are characters, not bytes.
//  The report is each count in a 7-wide right-aligned column, no
//  separator between them, then a space and the name if one was given.
//
//  Two traps, both about chunk boundaries: a word split across chunks is
//  still one word, and a chunk can end halfway through a multi-byte
//  character.
//
//  hint: keep an `inWord` boolean outside the chunk loop, and decode with
//  `new StringDecoder('utf8')` — .write(chunk) per chunk, .end() after

import { test, eq } from '../../_lib/check.js';
import { Readable, Writable } from 'node:stream';
import { StringDecoder } from 'node:string_decoder';

export async function countStream(input) {
  throw new Error('TODO');
}

export async function wcLike(input, output, name) {
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
