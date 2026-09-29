// ─────────────────────────────────────────────────────────────────────────
//  12 · stdin filter: grep                                 ★★☆ core
//  concepts: factory functions · regex state · literal matching
//  run: node 12-grep-like.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Same filter shape as exercise 11, but the options come first:
//  grepLike returns the (input, output) function.
//
//      const filter = grepLike('INFO');
//      await filter(source(log), out)      → 2, out gets the two lines
//
//      grepLike('a.c')                     literal — does NOT match 'abc'
//      grepLike(/^info/, { ignoreCase: true })
//      grepLike('INFO', { invert: true })   the lines that do NOT match
//      grepLike('m', { lineNumbers: true }) → '3:gamma\n'
//
//  `pattern` is a string (matched literally — never build a RegExp out of
//  user input) or a RegExp. lineNumbers prints the line's position in the
//  FILE, not the number of the match. Resolve with the match count.
//
//  hint: compile the matcher once, before you return the filter — and
//  watch out for a RegExp that arrives with the 'g' flag, because .test()
//  on it remembers where it stopped

import { test, eq } from '../../_lib/check.js';
import { Readable, Writable } from 'node:stream';
import { createInterface } from 'node:readline';

export function grepLike(pattern, options = {}) {
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

const LOG = 'INFO start\nWARN disk low\nINFO ready\nerror: boom\n';

test('writes the matching lines and counts them', async () => {
  const out = collector();
  eq(await grepLike('INFO')(source(LOG), out), 2);
  eq(out.text(), 'INFO start\nINFO ready\n');
});

test('a string pattern is literal, not a regex', async () => {
  const out = collector();
  eq(await grepLike('a.c')(source('abc\na.c\n'), out), 1);
  eq(out.text(), 'a.c\n');
});

test('ignoreCase matches either way', async () => {
  const out = collector();
  eq(await grepLike('info', { ignoreCase: true })(source(LOG), out), 2);
  eq(out.text(), 'INFO start\nINFO ready\n');
});

test('invert keeps the lines that do not match', async () => {
  const out = collector();
  eq(await grepLike('INFO', { invert: true })(source(LOG), out), 2);
  eq(out.text(), 'WARN disk low\nerror: boom\n');
});

test('lineNumbers reports the position in the file', async () => {
  const out = collector();
  await grepLike('m', { lineNumbers: true })(source('alpha\nbeta\ngamma\n'), out);
  eq(out.text(), '3:gamma\n');
});

test('a global regex still matches every line', async () => {
  const out = collector();
  eq(await grepLike(/o/g)(source('foo\nboo\nzoo\n'), out), 3);
  eq(out.text(), 'foo\nboo\nzoo\n');
});

test('a regex pattern works with anchors and ignoreCase', async () => {
  const out = collector();
  eq(await grepLike(/^info/, { ignoreCase: true })(source(LOG), out), 2);
  eq(out.text(), 'INFO start\nINFO ready\n');
});

test('no matches means no output and a count of 0', async () => {
  const out = collector();
  eq(await grepLike('nothing')(source(LOG), out), 0);
  eq(out.text(), '');
});
