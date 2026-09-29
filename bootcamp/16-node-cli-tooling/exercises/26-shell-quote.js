// ─────────────────────────────────────────────────────────────────────────
//  26 · shell quoting                                      ★★☆ core
//  concepts: escaping · allow-lists · platform rules
//  run: node 26-shell-quote.js
// ─────────────────────────────────────────────────────────────────────────
//
//  The moment your tool prints a command for someone to copy — or builds
//  one to run — a filename with a space in it is a bug and a filename
//  with a semicolon in it is a vulnerability. Two pure functions, one per
//  platform, both taking ONE argument and returning it safe to paste.
//
//      quotePosix('src/main.js')  → src/main.js      (already safe)
//      quotePosix('two words')    → 'two words'
//      quotePosix('$HOME')        → '$HOME'          (nothing expands)
//      quotePosix("it's")         → 'it'\''s'
//      quotePosix('')             → ''
//
//  Inside POSIX single quotes NOTHING is special — but a single quote
//  cannot appear there at all, so you close the run, escape one quote and
//  open a new run. Quote anything that is not plain: allow the safe
//  characters (letters, digits and _ @ % + = : , . / -) and quote the rest.
//
//      quoteWindows('C:\src\main.js')        → C:\src\main.js
//      quoteWindows('C:\Program Files\n.exe') → "C:\Program Files\n.exe"
//      quoteWindows('a"b')                    → "a\"b"
//      quoteWindows('C:\out dir\')            → "C:\out dir\\"
//
//  Windows has no shell doing the splitting — the child does it, and a
//  backslash only escapes when a quote comes next. So double a run of
//  backslashes when it is followed by a quote, or when it ends the string
//  (the closing quote is about to follow it). Quote only for whitespace
//  or a quote character; leave everything else alone.
//
//  hint: for Windows, count the backslashes as you go instead of emitting
//  them — you only know how many to write when you see what comes next

import { test, eq } from '../../_lib/check.js';

export function quotePosix(arg) {
  throw new Error('TODO');
}

export function quoteWindows(arg) {
  throw new Error('TODO');
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
