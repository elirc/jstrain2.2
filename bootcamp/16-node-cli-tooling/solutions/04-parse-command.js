// ─────────────────────────────────────────────────────────────────────────
//  04 · subcommand parser — SOLUTION                       ★★☆ core
//  run: node 04-parse-command.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: a while loop over an index, because '--key value' has to
//  peek at argv[i + 1] and then skip it. The ORDER of the branches is the
//  specification: '--' first (nothing after it is reinterpreted), then
//  '=', then 'no-', then the boolean list, then the peek.
//  `set()` centralises the repeat rule so every branch collects the same
//  way — first value plain, second turns it into an array, third pushes.
//  `command === null` is the test for "have I taken the subcommand yet",
//  not `positionals.length === 0`, which would be wrong for `-v build`.
//  The `booleans` list exists because `--verbose deploy` is genuinely
//  ambiguous: without a schema the parser cannot know that 'deploy' is a
//  subcommand and not the value of --verbose. Every real parser has one.

import { test, eq } from '../../_lib/check.js';

export function parseCommand(argv, { booleans = [] } = {}) {
  const flags = {};
  const positionals = [];
  const passthrough = [];
  let command = null;
  let i = 0;

  const set = (key, value) => {
    if (!(key in flags)) flags[key] = value;
    else if (Array.isArray(flags[key])) flags[key].push(value);
    else flags[key] = [flags[key], value];
  };

  while (i < argv.length) {
    const token = argv[i];

    if (token === '--') {
      passthrough.push(...argv.slice(i + 1));
      break;
    }

    if (token.startsWith('--')) {
      const body = token.slice(2);
      const at = body.indexOf('=');
      if (at !== -1) {
        set(body.slice(0, at), body.slice(at + 1));
      } else if (body.startsWith('no-')) {
        set(body.slice(3), false);
      } else if (booleans.includes(body)) {
        set(body, true);
      } else {
        const next = argv[i + 1];
        if (next !== undefined && !next.startsWith('-')) {
          set(body, next);
          i += 1;
        } else {
          set(body, true);
        }
      }
    } else if (token.startsWith('-') && token.length > 1) {
      for (const letter of token.slice(1)) set(letter, true);
    } else if (command === null) {
      command = token;
    } else {
      positionals.push(token);
    }

    i += 1;
  }

  return { command, flags, positionals, passthrough };
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
