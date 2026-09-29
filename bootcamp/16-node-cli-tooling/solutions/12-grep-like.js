// ─────────────────────────────────────────────────────────────────────────
//  12 · stdin filter: grep — SOLUTION                      ★★☆ core
//  run: node 12-grep-like.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: grepLike is a factory. It compiles the matcher ONCE and
//  returns the (input, output) filter, so the per-line work is a single
//  function call and the options are read exactly once.
//  A string pattern is compared with includes(), never turned into a
//  RegExp: a user typing 'a.c' or '1+1' means those characters, and
//  building a regex out of unescaped user input is how a search box
//  becomes a crash.
//  A RegExp pattern gets copied without the 'g' flag. That is not a
//  style choice — /o/g.test() advances lastIndex and the NEXT call starts
//  from there, so the third line of a three-line file quietly stops
//  matching. Stateful regexes plus loops is a classic silent bug.
//  Two counters, because they answer different questions: lineNo is where
//  we are in the file (what -n prints), hits is how many matched.

import { test, eq } from '../../_lib/check.js';
import { Readable, Writable } from 'node:stream';
import { createInterface } from 'node:readline';

export function grepLike(pattern, options = {}) {
  const { ignoreCase = false, invert = false, lineNumbers = false } = options;

  let matches;
  if (typeof pattern === 'string') {
    const needle = ignoreCase ? pattern.toLowerCase() : pattern;
    matches = (line) => (ignoreCase ? line.toLowerCase() : line).includes(needle);
  } else {
    const extra = ignoreCase && !pattern.flags.includes('i') ? 'i' : '';
    const re = new RegExp(pattern.source, pattern.flags.replace('g', '') + extra);
    matches = (line) => re.test(line);
  }

  return async (input, output) => {
    const rl = createInterface({ input, crlfDelay: Infinity });
    let lineNo = 0;
    let hits = 0;
    for await (const line of rl) {
      lineNo += 1;
      if (matches(line) === invert) continue;
      hits += 1;
      output.write(lineNumbers ? `${lineNo}:${line}\n` : `${line}\n`);
    }
    return hits;
  };
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
