// ─────────────────────────────────────────────────────────────────────────
//  05 · .env parser — SOLUTION                             ★★☆ core
//  run: node 05-parse-env.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: split on /\r?\n/ and trim every line, so a file written on
//  Windows does not hand you values ending in '\r' — an invisible
//  character that turns PORT into '8080\r' and breaks Number().
//  indexOf('=') plus slice, never split('='): a connection string is full
//  of '=' and only the first one is the separator.
//  Quotes are checked before comments, because '#' inside quotes is data.
//  Looking for the CLOSING quote with indexOf(q, 1) both unwraps the value
//  and marks where the comment may start, in one step.
//  Only double quotes decode '\n' — that asymmetry is copied from the
//  shell, and it is why single quotes are the safe default for passwords.

import { test, eq } from '../../_lib/check.js';

export function parseEnv(text) {
  const env = {};

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line === '' || line.startsWith('#')) continue;

    const body = line.startsWith('export ') ? line.slice(7).trimStart() : line;
    const at = body.indexOf('=');
    if (at === -1) continue;

    const key = body.slice(0, at).trim();
    if (key === '') continue;

    let value = body.slice(at + 1).trim();
    const quote = value[0];
    if (quote === '"' || quote === "'") {
      const close = value.indexOf(quote, 1);
      if (close !== -1) {
        value = value.slice(1, close);
        if (quote === '"') value = value.replace(/\\n/g, '\n');
      }
    } else {
      value = value.replace(/\s+#.*$/, '');
    }

    env[key] = value;
  }

  return env;
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
