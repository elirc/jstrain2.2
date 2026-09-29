// ─────────────────────────────────────────────────────────────────────────
//  05 · .env parser                                        ★★☆ core
//  concepts: line parsing · quoting · Windows line endings
//  run: node 05-parse-env.js
// ─────────────────────────────────────────────────────────────────────────
//
//  `dotenv` is 100 lines of string handling. Write those lines. Take the
//  TEXT of a .env file and return a plain object — every value a string,
//  because that is all an environment variable ever is.
//
//      HOST=localhost          → { HOST: 'localhost' }
//      export TOKEN=abc        → { TOKEN: 'abc' }
//      KEY=value # trailing    → { KEY: 'value' }
//      PASS=abc#123            → { PASS: 'abc#123' }   (no space, no
//                                                       comment)
//      GREETING="a\nb"         → { GREETING: 'a<newline>b' }
//      RAW='a\nb'              → { RAW: 'a\\nb' }      (single = literal)
//
//  Also: skip blank lines and lines starting with '#', trim keys and
//  values, split on the FIRST '=' only, keep an empty value as '', ignore
//  a line with no '=' at all, and survive a file saved with \r\n.
//
//  hint: indexOf('=') + slice, never split('='); check for quotes BEFORE
//  you strip comments

import { test, eq } from '../../_lib/check.js';

export function parseEnv(text) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('reads KEY=value pairs as strings', () => {
  eq(parseEnv('HOST=localhost\nPORT=8080'), {
    HOST: 'localhost',
    PORT: '8080',
  });
  eq(parseEnv('  SPACED   =   yes  '), { SPACED: 'yes' });
});

test('skips blank lines and comments, indented or not', () => {
  eq(parseEnv('\n# a comment\n   # indented too\nA=1\n\n'), { A: '1' });
});

test('strips an export prefix', () => {
  eq(parseEnv('export TOKEN=abc'), { TOKEN: 'abc' });
});

test('splits on the first = only', () => {
  eq(parseEnv('DSN=postgres://u:p@h/db?sslmode=require'), {
    DSN: 'postgres://u:p@h/db?sslmode=require',
  });
  eq(parseEnv('EMPTY='), { EMPTY: '' });
});

test('double quotes keep spacing and decode \\n', () => {
  eq(parseEnv('GREETING="hello  world\\nbye"'), {
    GREETING: 'hello  world\nbye',
  });
});

test('single quotes are literal', () => {
  eq(parseEnv("RAW='a\\nb'"), { RAW: 'a\\nb' });
});

test('a trailing comment goes, a # inside the value stays', () => {
  eq(parseEnv('KEY=value # trailing\nPASS=abc#123'), {
    KEY: 'value',
    PASS: 'abc#123',
  });
  eq(parseEnv('NOTE="a # b" # real comment'), { NOTE: 'a # b' });
});

test('survives CRLF and ignores a line with no =', () => {
  eq(parseEnv('A=1\r\nGARBAGE\r\nB=2\r\n'), { A: '1', B: '2' });
});
