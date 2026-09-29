// ─────────────────────────────────────────────────────────────────────────
//  24 · commander-lite — SOLUTION                          ★★★ stretch
//  run: node 24-command-router.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the router is a gate, and everything it rejects it
//  rejects BEFORE `run` is called. That ordering is the whole design —
//  a command body that starts with six lines of "did they pass a number?"
//  is six lines you write again in the next command. Here `run` is handed
//  values it can trust, so it is about three lines long.
//  Order matters inside the gate too: --help is answered before unknown
//  options, or `add --help` would be rejected for using a flag that add
//  does not declare. Help is a success (exit 0, stdout); a mistake is
//  exit 2 on stderr. Both are printed by the caller's streams, never by
//  console.log, so a test can read them.
//  Flags are resolved through the SPEC, not the argv: iterating the spec
//  is what fills defaults in, gives the flags object a stable key order,
//  and makes an undeclared flag detectable at all. Short forms are looked
//  up the same way, so `-d` and `--dry` land on one key.
//  The try/catch around run is the last line of defence: an exception is
//  a runtime failure (exit 1), which is a different thing from the user
//  typing the command wrong (exit 2) — `make` and CI can tell them apart.
//  Note what the provided tokenizer cannot do: `--force prod` swallows
//  `prod` as the value of a flag it does not know is a boolean. Real
//  parsers read the spec first. That is README gotcha #2, alive.

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
  const { positionals, flags } = tokenize(argv);
  const wantsHelp = flags.help === true || flags.h === true;
  const [commandName, ...given] = positionals;

  if (commandName === undefined) {
    const text = `${renderUsage(name, commands)}\n`;
    if (wantsHelp) {
      out.write(text);
      return EXIT.OK;
    }
    err.write(text);
    return EXIT.USAGE;
  }

  const command = commands[commandName];
  if (!command) {
    err.write(`error: unknown command: ${commandName}\n`);
    return EXIT.USAGE;
  }

  if (wantsHelp) {
    out.write(`${renderCommandUsage(commandName, command)}\n`);
    return EXIT.OK;
  }

  const expected = command.args ?? [];
  if (given.length < expected.length) {
    err.write(`error: ${commandName} needs <${expected[given.length]}>\n`);
    return EXIT.USAGE;
  }
  const args = Object.fromEntries(expected.map((key, i) => [key, given[i]]));

  const spec = command.flags ?? {};
  const canonical = (key) =>
    Object.hasOwn(spec, key)
      ? key
      : Object.keys(spec).find((n) => spec[n].short === key);

  const raw = {};
  for (const key of Object.keys(flags)) {
    const flagName = canonical(key);
    if (!flagName) {
      err.write(`error: unknown option: ${key.length === 1 ? '-' : '--'}${key}\n`);
      return EXIT.USAGE;
    }
    raw[flagName] = flags[key];
  }

  const values = {};
  for (const [flagName, flagSpec] of Object.entries(spec)) {
    const value = raw[flagName];
    if (value === undefined) {
      if (flagSpec.default !== undefined) values[flagName] = flagSpec.default;
      continue;
    }
    if (flagSpec.type === 'boolean') {
      values[flagName] = true;
    } else if (value === true) {
      err.write(`error: --${flagName} needs a value\n`);
      return EXIT.USAGE;
    } else if (flagSpec.type === 'number') {
      const n = Number(value);
      if (!Number.isFinite(n) || String(value).trim() === '') {
        err.write(`error: --${flagName} expects a number\n`);
        return EXIT.USAGE;
      }
      values[flagName] = n;
    } else {
      values[flagName] = String(value);
    }
  }

  try {
    const code = await command.run({
      args,
      rest: given.slice(expected.length),
      flags: values,
      out,
      err,
    });
    return code ?? EXIT.OK;
  } catch (e) {
    err.write(`error: ${e.message}\n`);
    return EXIT.FAILURE;
  }
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
