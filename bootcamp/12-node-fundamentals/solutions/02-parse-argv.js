// ─────────────────────────────────────────────────────────────────────────
//  02 · parse argv — SOLUTION                                ★★★ stretch
//  run: node 02-parse-argv.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: a `while` loop over an index, because "--key value" needs
//  to peek at argv[i + 1] and then skip it — something for...of cannot do.
//  The order of the branches IS the specification: '--' first (so nothing
//  after it is reinterpreted), then '=' (so --no-x=1 is a value, not a
//  negation), then 'no-', then the peek, then the bare-flag default.
//  The peek must refuse any token starting with '-', otherwise
//  `--out --verbose` quietly sets out to the string '--verbose'.
//  Short clusters are just characters: iterate token.slice(1).

import { test, eq } from '../../_lib/check.js';

export function parseArgs(argv) {
  const flags = {};
  const positionals = [];
  let i = 0;

  while (i < argv.length) {
    const token = argv[i];

    if (token === '--') {
      positionals.push(...argv.slice(i + 1));
      break;
    }

    if (token.startsWith('--')) {
      const body = token.slice(2);
      const eqAt = body.indexOf('=');
      if (eqAt !== -1) {
        flags[body.slice(0, eqAt)] = body.slice(eqAt + 1);
      } else if (body.startsWith('no-')) {
        flags[body.slice(3)] = false;
      } else {
        const next = argv[i + 1];
        if (next !== undefined && !next.startsWith('-')) {
          flags[body] = next;
          i += 1;
        } else {
          flags[body] = true;
        }
      }
    } else if (token.startsWith('-') && token.length > 1) {
      for (const letter of token.slice(1)) flags[letter] = true;
    } else {
      positionals.push(token);
    }

    i += 1;
  }

  return { flags, positionals };
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
