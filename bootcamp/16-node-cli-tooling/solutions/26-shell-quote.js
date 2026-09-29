// ─────────────────────────────────────────────────────────────────────────
//  26 · shell quoting — SOLUTION                           ★★☆ core
//  run: node 26-shell-quote.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: an allow-list, never a deny-list. Listing the characters
//  that are SAFE means a shell feature nobody remembered — brace
//  expansion, process substitution, a newline — is quoted by default;
//  listing the dangerous ones means every such feature is a hole. That
//  regex is the whole security posture of the function.
//  POSIX single quotes are absolute: nothing inside them is special, not
//  $, not `, not \. The price is that a single quote cannot appear inside
//  them at all, so you leave the quoted run, emit an escaped quote and
//  start a new one — the '\'' dance is four characters doing exactly
//  that, and it is why the output looks broken but is not.
//  Windows is a different world. There is no shell doing the splitting:
//  CommandLineToArgvW does it inside the child, and its rule is that a
//  backslash only escapes when it is followed by a quote. So a run of
//  backslashes is doubled ONLY before a quote or at the very end — where
//  the closing quote is about to follow it. Miss that last case and
//  C:\out\ becomes an unterminated string and the next argument joins it.
//  Both functions quote '' — an empty argument that disappears is how a
//  positional lands in the wrong slot.

import { test, eq } from '../../_lib/check.js';

const SAFE = /^[A-Za-z0-9_@%+=:,./-]+$/;

export function quotePosix(arg) {
  const text = String(arg);
  if (SAFE.test(text)) return text;
  return `'${text.replaceAll("'", "'\\''")}'`;
}

export function quoteWindows(arg) {
  const text = String(arg);
  if (text !== '' && !/[\s"]/.test(text)) return text;

  let out = '"';
  let slashes = 0;
  for (const ch of text) {
    if (ch === '\\') {
      slashes += 1;
    } else if (ch === '"') {
      out += `${'\\'.repeat(slashes * 2 + 1)}"`;
      slashes = 0;
    } else {
      out += `${'\\'.repeat(slashes)}${ch}`;
      slashes = 0;
    }
  }
  return `${out}${'\\'.repeat(slashes * 2)}"`;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('a plain word needs no quoting on either platform', () => {
  eq(quotePosix('build'), 'build');
  eq(quoteWindows('build'), 'build');
});

test('posix leaves the punctuation a path or a flag is made of', () => {
  eq(quotePosix('src/main.js'), 'src/main.js');
  eq(quotePosix('--out=dist'), '--out=dist');
  eq(quotePosix('a_b-c.d,e:f@g%h+i'), 'a_b-c.d,e:f@g%h+i');
});

test('posix quotes whitespace and every shell metacharacter', () => {
  eq(quotePosix('two words'), "'two words'");
  eq(quotePosix('$HOME'), "'$HOME'");
  eq(quotePosix('*.log'), "'*.log'");
  eq(quotePosix('; rm -rf /'), "'; rm -rf /'");
});

test('posix ends the quoted run to emit a quote, then starts a new one', () => {
  eq(quotePosix("it's"), String.raw`'it'\''s'`);
});

test('both platforms quote the empty argument so it survives', () => {
  eq(quotePosix(''), "''");
  eq(quoteWindows(''), '""');
});

test('windows only quotes for whitespace or a quote character', () => {
  eq(quoteWindows('C:\\src\\main.js'), 'C:\\src\\main.js');
  eq(quoteWindows('a;b&c'), 'a;b&c');
});

test('a backslash that is not next to a quote stays single', () => {
  eq(
    quoteWindows('C:\\Program Files\\node.exe'),
    String.raw`"C:\Program Files\node.exe"`
  );
});

test('backslashes double before a quote — and at the end of the string', () => {
  eq(quoteWindows('a"b'), String.raw`"a\"b"`);
  eq(quoteWindows('a\\"b'), String.raw`"a\\\"b"`);
  eq(quoteWindows('C:\\out dir\\'), String.raw`"C:\out dir\\"`);
});
