// ─────────────────────────────────────────────────────────────────────────
//  04 · subcommand parser                                  ★★☆ core
//  concepts: argv · index loops · lookahead
//  run: node 04-parse-command.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Module 12 built a flat parser: flags in, positionals out. Real tools
//  are git-shaped — `git commit -am "fix" -- src/` — so the parser also
//  has to name the subcommand and protect what comes after `--`.
//
//      parseCommand(['add', 'buy', 'milk'])
//        → { command: 'add', flags: {}, positionals: ['buy', 'milk'],
//            passthrough: [] }
//
//  The rules, in the order you must apply them:
//    1. '--'          everything after it goes to passthrough, untouched
//    2. '--key=value' → flags.key = 'value'   (split on the FIRST '=')
//    3. '--no-key'    → flags.key = false
//    4. '--key'       → true if the name is in options.booleans, else the
//                       next token if it does not start with '-', else true
//    5. '-abc'        → a, b and c all true
//    6. a bare word   → the first one is `command`, later ones positional
//    7. a repeated flag collects its values into an array, in order:
//       ['--tag', 'a', '--tag=b'] → { tag: ['a', 'b'] }
//
//  hint: one `while (i < argv.length)` loop with an explicit `i`, because
//  branch 4 has to skip a token; write a small set(key, value) helper so
//  rule 7 lives in exactly one place

import { test, eq } from '../../_lib/check.js';

export function parseCommand(argv, { booleans = [] } = {}) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('an empty command line parses to empty everything', () => {
  eq(parseCommand([]), {
    command: null,
    flags: {},
    positionals: [],
    passthrough: [],
  });
});

test('the first bare word is the command, the rest are positionals', () => {
  eq(parseCommand(['add', 'buy', 'milk']), {
    command: 'add',
    flags: {},
    positionals: ['buy', 'milk'],
    passthrough: [],
  });
});

test('reads --key=value and --key value, consuming the value', () => {
  eq(parseCommand(['run', '--out=dist', '--mode', 'fast']), {
    command: 'run',
    flags: { out: 'dist', mode: 'fast' },
    positionals: [],
    passthrough: [],
  });
});

test('a flag with nothing to consume is true', () => {
  eq(parseCommand(['build', '--watch']).flags, { watch: true });
  eq(parseCommand(['build', '--watch', '--quiet']).flags, {
    watch: true,
    quiet: true,
  });
});

test('--no-key is false and a short cluster expands', () => {
  eq(parseCommand(['--no-color']).flags, { color: false });
  eq(parseCommand(['commit', '-am', 'fix']), {
    command: 'commit',
    flags: { a: true, m: true },
    positionals: ['fix'],
    passthrough: [],
  });
});

test('-- hands everything after it over verbatim', () => {
  eq(parseCommand(['run', 'test', '--', '--watch', '-x', '--', 'y']), {
    command: 'run',
    flags: {},
    positionals: ['test'],
    passthrough: ['--watch', '-x', '--', 'y'],
  });
});

test('a repeated flag collects its values into an array', () => {
  eq(parseCommand(['build', '--tag', 'a', '--tag=b', '--tag', 'c']).flags, {
    tag: ['a', 'b', 'c'],
  });
});

test('a declared boolean does not eat the next word', () => {
  eq(parseCommand(['--verbose', 'deploy', 'web']).flags, { verbose: 'deploy' });
  eq(parseCommand(['--verbose', 'deploy', 'web'], { booleans: ['verbose'] }), {
    command: 'deploy',
    flags: { verbose: true },
    positionals: ['web'],
    passthrough: [],
  });
});
