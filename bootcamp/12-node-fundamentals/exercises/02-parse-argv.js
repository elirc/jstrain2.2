// ─────────────────────────────────────────────────────────────────────────
//  02 · parse argv                                          ★★★ stretch
//  concepts: process.argv · CLI parsing · index loops
//  run: node 02-parse-argv.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Every CLI starts with a parser like this. Node hands you process.argv
//  as [execPath, scriptPath, ...userArgs]; you get the user args only and
//  turn them into { flags, positionals }.
//
//  Rules, checked in this order:
//      --                stop parsing; the rest are positionals, verbatim
//      --key=value       flags.key = 'value'
//      --no-key          flags.key = false
//      --key value       flags.key = 'value'  (only if value has no '-')
//      --key             flags.key = true     (end of input, or next is -x)
//      -abc              flags.a = flags.b = flags.c = true
//      anything else     pushed onto positionals
//
//      parseArgs(['build', '--out=dist', '-vf', 'src'])
//        → { flags: { out: 'dist', v: true, f: true },
//            positionals: ['build', 'src'] }
//
//  hint: a plain index loop beats for...of here — you sometimes need to
//  look at the NEXT token and then skip past it.

import { test, eq } from '../../_lib/check.js';

export function parseArgs(argv) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('collects bare words as positionals', () => {
  eq(parseArgs(['build', 'src']), {
    flags: {},
    positionals: ['build', 'src'],
  });
});

test('reads --key=value', () => {
  eq(parseArgs(['--out=dist']).flags, { out: 'dist' });
});

test('reads --key value and consumes the value', () => {
  eq(parseArgs(['--out', 'dist']), { flags: { out: 'dist' }, positionals: [] });
});

test('a --key with nothing to consume becomes true', () => {
  eq(parseArgs(['--watch']).flags, { watch: true });
  eq(parseArgs(['--watch', '--quiet']).flags, { watch: true, quiet: true });
});

test('--no-key becomes false', () => {
  eq(parseArgs(['--no-cache']).flags, { cache: false });
});

test('expands a short cluster like -vfz', () => {
  eq(parseArgs(['-vfz']).flags, { v: true, f: true, z: true });
});

test('-- stops flag parsing', () => {
  eq(parseArgs(['run', '--', '--not-a-flag', '-x']), {
    flags: {},
    positionals: ['run', '--not-a-flag', '-x'],
  });
});

test('parses a realistic command line', () => {
  eq(parseArgs(['deploy', '--env=prod', '--dry-run', '-v', 'web', '--tag', 'v2']), {
    flags: { env: 'prod', 'dry-run': true, v: true, tag: 'v2' },
    positionals: ['deploy', 'web'],
  });
});
