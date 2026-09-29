// ─────────────────────────────────────────────────────────────────────────
//  18 · the whole CLI — SOLUTION                           ★★★ stretch
//  run: node 18-task-cli.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the shape of every CLI worth maintaining — parse, switch,
//  return a code. Nothing in here knows what a terminal is: the store,
//  stdout and stderr all arrive as arguments, so the entire program is
//  testable as one function call and `main()` is three lines of wiring:
//    process.exitCode = await taskCli(process.argv.slice(2),
//      { store, out: process.stdout, err: process.stderr });
//  Note argv.slice(2) — argv[0] is the node binary and argv[1] is the
//  script, and neither is an argument to your program.
//  'all', 'help' and 'h' are declared as booleans so `list --all` cannot
//  swallow a following word as a value.
//  The routing rule is dull on purpose: success writes to `out` and
//  returns 0, a mistake by the user writes to `err` and returns 2, a
//  missing thing returns 4. Errors on stderr is what lets someone run
//  `task list > tasks.txt` and still see what went wrong.

import { test, eq } from '../../_lib/check.js';

// ── provided: pieces you built earlier in this module ────────────────────

function parseCommand(argv, { booleans = [] } = {}) {
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
      if (at !== -1) set(body.slice(0, at), body.slice(at + 1));
      else if (body.startsWith('no-')) set(body.slice(3), false);
      else if (booleans.includes(body)) set(body, true);
      else {
        const next = argv[i + 1];
        if (next !== undefined && !next.startsWith('-')) {
          set(body, next);
          i += 1;
        } else set(body, true);
      }
    } else if (token.startsWith('-') && token.length > 1) {
      for (const letter of token.slice(1)) set(letter, true);
    } else if (command === null) command = token;
    else positionals.push(token);
    i += 1;
  }
  return { command, flags, positionals, passthrough };
}

function renderTable(rows) {
  if (rows.length === 0) return '';
  const keys = Object.keys(rows[0]);
  const text = (v) => (v === null || v === undefined ? '' : String(v));
  const numeric = keys.map(
    (k) =>
      rows.some((r) => typeof r[k] === 'number') &&
      rows.every((r) => r[k] == null || typeof r[k] === 'number')
  );
  const widths = keys.map((k) =>
    Math.max(k.length, ...rows.map((r) => text(r[k]).length))
  );
  const line = (cells) =>
    cells
      .map((c, i) => (numeric[i] ? c.padStart(widths[i]) : c.padEnd(widths[i])))
      .join('  ')
      .trimEnd();
  return [
    line(keys),
    widths.map((w) => '-'.repeat(w)).join('  '),
    ...rows.map((r) => line(keys.map((k) => text(r[k])))),
  ].join('\n');
}

export const EXIT = { OK: 0, FAILURE: 1, USAGE: 2, NOT_FOUND: 4 };

export const USAGE = [
  'Usage: task <command> [options]',
  '',
  'Commands:',
  '  add <text>    add a task',
  '  list          show open tasks (--all for every task)',
  '  done <id>     mark a task done',
].join('\n');

// ── your code ────────────────────────────────────────────────────────────

export async function taskCli(argv, { store, out, err }) {
  const { command, flags, positionals } = parseCommand(argv, {
    booleans: ['all', 'help', 'h'],
  });

  if (flags.help || flags.h) {
    out.write(`${USAGE}\n`);
    return EXIT.OK;
  }

  if (command === null) {
    err.write(`${USAGE}\n`);
    return EXIT.USAGE;
  }

  if (command === 'add') {
    const title = positionals.join(' ').trim();
    if (title === '') {
      err.write('usage: task add <text>\n');
      return EXIT.USAGE;
    }
    const task = store.add(title);
    out.write(`added #${task.id}: ${task.title}\n`);
    return EXIT.OK;
  }

  if (command === 'list') {
    const tasks = store.all().filter((t) => flags.all || !t.done);
    if (tasks.length === 0) {
      out.write('no tasks\n');
      return EXIT.OK;
    }
    const rows = tasks.map((t) => ({
      id: t.id,
      status: t.done ? 'done' : 'open',
      title: t.title,
    }));
    out.write(`${renderTable(rows)}\n`);
    return EXIT.OK;
  }

  if (command === 'done') {
    const id = Number(positionals[0]);
    if (positionals.length === 0 || !Number.isInteger(id)) {
      err.write('usage: task done <id>\n');
      return EXIT.USAGE;
    }
    const task = store.complete(id);
    if (!task) {
      err.write(`error: no task #${id}\n`);
      return EXIT.NOT_FOUND;
    }
    out.write(`done #${task.id}: ${task.title}\n`);
    return EXIT.OK;
  }

  err.write(`error: unknown command: ${command}\n`);
  return EXIT.USAGE;
}

// ──────────────────────────── tests ──────────────────────────────────────

// Provided: an in-memory store and two collecting streams.
function createStore(initial = []) {
  const tasks = initial.map((t) => ({ ...t }));
  let nextId = tasks.reduce((max, t) => Math.max(max, t.id), 0) + 1;
  const find = (id) => tasks.find((t) => t.id === id);
  return {
    all: () => tasks.map((t) => ({ ...t })),
    add(title) {
      const task = { id: nextId, title, done: false };
      nextId += 1;
      tasks.push(task);
      return { ...task };
    },
    get: (id) => (find(id) ? { ...find(id) } : null),
    complete(id) {
      const task = find(id);
      if (!task) return null;
      task.done = true;
      return { ...task };
    },
  };
}

function fakeStream() {
  const chunks = [];
  return { write: (s) => chunks.push(s), text: () => chunks.join('') };
}

const seed = () =>
  createStore([
    { id: 1, title: 'write the readme', done: false },
    { id: 2, title: 'ship it', done: true },
  ]);

const io = () => ({ out: fakeStream(), err: fakeStream() });

test('add appends to the store and reports the new id', async () => {
  const store = seed();
  const { out, err } = io();
  eq(await taskCli(['add', 'buy', 'milk'], { store, out, err }), 0);
  eq(out.text(), 'added #3: buy milk\n');
  eq(err.text(), '');
  eq(store.get(3), { id: 3, title: 'buy milk', done: false });
});

test('add with no text is a usage error and changes nothing', async () => {
  const store = seed();
  const { out, err } = io();
  eq(await taskCli(['add'], { store, out, err }), 2);
  eq(err.text(), 'usage: task add <text>\n');
  eq(out.text(), '');
  eq(store.all().length, 2);
});

test('list renders the open tasks as a table', async () => {
  const { out, err } = io();
  eq(await taskCli(['list'], { store: seed(), out, err }), 0);
  eq(
    out.text(),
    ['id  status  title', '--  ------  ----------------', ' 1  open    write the readme'].join('\n') + '\n'
  );
});

test('list on an empty store says so instead of printing headers', async () => {
  const { out, err } = io();
  eq(await taskCli(['list'], { store: createStore([]), out, err }), 0);
  eq(out.text(), 'no tasks\n');
});

test('list --all includes the finished tasks', async () => {
  const { out, err } = io();
  eq(await taskCli(['list', '--all'], { store: seed(), out, err }), 0);
  eq(
    out.text(),
    [
      'id  status  title',
      '--  ------  ----------------',
      ' 1  open    write the readme',
      ' 2  done    ship it',
    ].join('\n') + '\n'
  );
});

test('done marks the task and confirms it', async () => {
  const store = seed();
  const { out, err } = io();
  eq(await taskCli(['done', '1'], { store, out, err }), 0);
  eq(out.text(), 'done #1: write the readme\n');
  eq(store.get(1).done, true);
});

test('done needs a real id: unknown is 4, nonsense is 2', async () => {
  const first = io();
  eq(await taskCli(['done', '9'], { store: seed(), ...first }), 4);
  eq(first.err.text(), 'error: no task #9\n');

  const second = io();
  eq(await taskCli(['done', 'later'], { store: seed(), ...second }), 2);
  eq(second.err.text(), 'usage: task done <id>\n');
});

test('--help goes to stdout and 0, an unknown command to stderr and 2', async () => {
  const first = io();
  eq(await taskCli(['--help'], { store: seed(), ...first }), 0);
  eq(first.out.text(), `${USAGE}\n`);
  eq(first.err.text(), '');

  const second = io();
  eq(await taskCli(['frobnicate'], { store: seed(), ...second }), 2);
  eq(second.err.text(), 'error: unknown command: frobnicate\n');
  eq(second.out.text(), '');
});
