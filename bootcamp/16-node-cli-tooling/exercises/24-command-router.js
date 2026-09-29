// ─────────────────────────────────────────────────────────────────────────
//  24 · commander-lite                                     ★★★ stretch
//  concepts: routing · spec-driven validation · exit codes
//  run: node 24-command-router.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Exercise 18 routed three commands with three if-blocks. This is the
//  version that scales: the commands are DATA, and the router validates
//  against their spec before any of them runs.
//
//      { add: { describe: 'add a task', args: ['title'],
//               flags: { priority: { short: 'p', type: 'number',
//                                    default: 2 } },
//               run: ({ args, rest, flags, out }) => { ... } } }
//
//      runCli(['add', 'buy milk'], { commands, out, err })  → 0
//
//  In order, and every step before `run` is reached:
//    · no command       → usage on stderr, exit 2 (but --help → stdout, 0)
//    · unknown command  → 'error: unknown command: frob', exit 2
//    · --help / -h      → that command's usage on stdout, exit 0
//    · missing arg      → 'error: add needs <title>', exit 2
//    · undeclared flag  → 'error: unknown option: --nope', exit 2
//    · bad value        → 'error: --count expects a number', exit 2
//                         'error: --format needs a value', exit 2
//  Then run gets `{ args, rest, flags, out, err }`: `args` maps each
//  declared arg name to its positional, `rest` is the positionals left
//  over, `flags` is coerced to its declared type with defaults filled
//  in, and a short form lands on the long name's key:
//
//      runCli(['echo', 'a', 'b', '-d'], cli)  → run sees
//          args {first:'a'} · rest ['b'] · flags {count:1, dry:true}
//
//  run's return value is the exit code (undefined means 0). If it
//  THROWS: 'error: <message>', exit 1.
//
//  hint: walk the flag SPEC, not the parsed flags — that is what fills in
//  defaults and gives every command the same key order

import { test, eq } from '../../_lib/check.js';

// ── provided: a dumb tokenizer and two renderers ──────────────────────────

function tokenize(argv) {
  const positionals = [];
  const flags = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token.startsWith('--')) {
      const body = token.slice(2);
      const at = body.indexOf('=');
      if (at !== -1) flags[body.slice(0, at)] = body.slice(at + 1);
      else if (argv[i + 1] !== undefined && !argv[i + 1].startsWith('-')) {
        flags[body] = argv[i + 1];
        i += 1;
      } else flags[body] = true;
    } else if (token.startsWith('-') && token.length > 1) {
      flags[token.slice(1)] = true;
    } else positionals.push(token);
  }
  return { positionals, flags };
}

function renderUsage(name, commands) {
  const names = Object.keys(commands);
  const width = Math.max(...names.map((n) => n.length));
  const lines = names.map(
    (n) => `  ${n.padEnd(width)}    ${commands[n].describe ?? ''}`.trimEnd()
  );
  return [`Usage: ${name} <command> [options]`, '', 'Commands:', ...lines].join('\n');
}

function renderCommandUsage(name, command) {
  const args = (command.args ?? []).map((a) => `<${a}>`).join(' ');
  const usage = ['Usage:', name, args, '[options]'].filter(Boolean).join(' ');
  return `${usage}\n\n${command.describe ?? ''}`.trimEnd();
}

export const EXIT = { OK: 0, FAILURE: 1, USAGE: 2 };

// ── your code ────────────────────────────────────────────────────────────

export async function runCli(argv, { commands, out, err, name = 'cli' }) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

// Provided: a command table and two collecting streams.
const COMMANDS = {
  add: {
    describe: 'add a task',
    args: ['title'],
    flags: { priority: { short: 'p', type: 'number', default: 2 } },
    run: ({ args, flags, out }) => {
      out.write(`added ${args.title} (p${flags.priority})\n`);
    },
  },
  echo: {
    describe: 'dump what the router parsed',
    args: ['first'],
    flags: {
      count: { type: 'number', default: 1 },
      dry: { short: 'd', type: 'boolean' },
    },
    run: ({ args, rest, flags, out }) => {
      out.write(JSON.stringify({ args, rest, flags }));
    },
  },
  list: {
    describe: 'show tasks',
    flags: { format: { type: 'string', default: 'table' } },
    run: ({ flags, out }) => {
      out.write(`list as ${flags.format}\n`);
      return EXIT.OK;
    },
  },
  boom: {
    describe: 'always fails',
    run: () => {
      throw new Error('disk on fire');
    },
  },
};

const USAGE = [
  'Usage: cli <command> [options]',
  '',
  'Commands:',
  '  add     add a task',
  '  echo    dump what the router parsed',
  '  list    show tasks',
  '  boom    always fails',
].join('\n');

function fakeStream() {
  const chunks = [];
  return { write: (s) => chunks.push(s), text: () => chunks.join('') };
}

const io = () => ({ commands: COMMANDS, out: fakeStream(), err: fakeStream() });

test('routes to the command, fills flag defaults, returns its code', async () => {
  const cli = io();
  eq(await runCli(['list'], cli), 0);
  eq(cli.out.text(), 'list as table\n');
  eq(cli.err.text(), '');
});

test('args, rest and short flags reach run, coerced to their type', async () => {
  const cli = io();
  eq(await runCli(['echo', 'a', 'b', '--count', '3', '-d'], cli), 0);
  eq(
    cli.out.text(),
    '{"args":{"first":"a"},"rest":["b"],"flags":{"count":3,"dry":true}}'
  );
});

test('no command, and an unknown command, are usage errors on stderr', async () => {
  const first = io();
  eq(await runCli([], first), 2);
  eq(first.err.text(), `${USAGE}\n`);
  eq(first.out.text(), '');

  const second = io();
  eq(await runCli(['frobnicate'], second), 2);
  eq(second.err.text(), 'error: unknown command: frobnicate\n');
});

test('--help is a success: stdout and exit 0', async () => {
  const cli = io();
  eq(await runCli(['--help'], cli), 0);
  eq(cli.out.text(), `${USAGE}\n`);
  eq(cli.err.text(), '');
});

test('a command answers --help with its own arguments', async () => {
  const cli = io();
  eq(await runCli(['add', '--help'], cli), 0);
  eq(cli.out.text(), 'Usage: add <title> [options]\n\nadd a task\n');
});

test('a missing positional stops the command from ever running', async () => {
  const cli = io();
  eq(await runCli(['add'], cli), 2);
  eq(cli.err.text(), 'error: add needs <title>\n');
  eq(cli.out.text(), '');
});

test('unknown option, bad number, and a valueless flag are all exit 2', async () => {
  const first = io();
  eq(await runCli(['list', '--nope'], first), 2);
  eq(first.err.text(), 'error: unknown option: --nope\n');
  eq(first.out.text(), '');

  const second = io();
  eq(await runCli(['echo', 'a', '--count', 'lots'], second), 2);
  eq(second.err.text(), 'error: --count expects a number\n');

  const third = io();
  eq(await runCli(['list', '--format'], third), 2);
  eq(third.err.text(), 'error: --format needs a value\n');
});

test('a command that throws is exit 1, not exit 2', async () => {
  const cli = io();
  eq(await runCli(['boom'], cli), 1);
  eq(cli.err.text(), 'error: disk on fire\n');
});
