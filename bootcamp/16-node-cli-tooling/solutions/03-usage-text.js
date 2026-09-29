// ─────────────────────────────────────────────────────────────────────────
//  03 · usage text — SOLUTION                              ★☆☆ warm-up
//  run: node 03-usage-text.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: one `section()` helper does both blocks, because
//  "commands" and "options" differ only in which key holds the label.
//  The width is measured per section — computing one width across both
//  lists would push short command names miles to the right just because
//  '-h, --help' exists somewhere below.
//  Building the line then calling trimEnd() is the cheap way to avoid
//  trailing spaces on an entry with no description; trailing whitespace
//  is invisible in your editor and very visible in a diff.
//  Sections are collected into an array and filtered, so an absent list
//  contributes nothing at all — not an empty heading with a blank line.

import { test, eq } from '../../_lib/check.js';

const GAP = 4;

function section(title, entries, labelOf) {
  if (!entries || entries.length === 0) return null;
  const width = Math.max(...entries.map((e) => labelOf(e).length));
  const lines = entries.map((e) =>
    `  ${labelOf(e).padEnd(width)}${' '.repeat(GAP)}${e.describe ?? ''}`.trimEnd()
  );
  return [`${title}:`, ...lines].join('\n');
}

export function renderUsage(spec) {
  const blocks = [
    `Usage: ${spec.usage}`,
    section('Commands', spec.commands, (c) => c.name),
    section('Options', spec.options, (o) => o.flags),
  ];
  return blocks.filter(Boolean).join('\n\n');
}

// ──────────────────────────── tests ──────────────────────────────────────

// Provided: the help screen of the CLI you build in exercise 18.
const TASK_SPEC = {
  usage: 'task <command> [options]',
  commands: [
    { name: 'add', describe: 'add a task' },
    { name: 'list', describe: 'show open tasks' },
    { name: 'done', describe: 'mark a task done' },
  ],
  options: [
    { flags: '--all', describe: 'include finished tasks' },
    { flags: '-h, --help', describe: 'show this help' },
  ],
};

test('the usage line comes first', () => {
  eq(renderUsage({ usage: 'task <command>' }), 'Usage: task <command>');
});

test('command names are padded into a column', () => {
  const lines = renderUsage(TASK_SPEC).split('\n');
  eq(lines[3], '  add     add a task');
  eq(lines[4], '  list    show open tasks');
});

test('options are measured on their own, not with the commands', () => {
  const lines = renderUsage(TASK_SPEC).split('\n');
  eq(lines[8], '  --all         include finished tasks');
  eq(lines[9], '  -h, --help    show this help');
});

test('an empty or missing list leaves no heading behind', () => {
  eq(renderUsage({ usage: 'x', commands: [], options: [] }), 'Usage: x');
  eq(
    renderUsage({ usage: 'x', options: [{ flags: '-v', describe: 'loud' }] }),
    'Usage: x\n\nOptions:\n  -v    loud'
  );
});

test('an entry without a description has no trailing spaces', () => {
  eq(
    renderUsage({ usage: 'x', commands: [{ name: 'up' }, { name: 'status' }] }),
    'Usage: x\n\nCommands:\n  up\n  status'
  );
});

test('renders the whole help screen', () => {
  eq(
    renderUsage(TASK_SPEC),
    [
      'Usage: task <command> [options]',
      '',
      'Commands:',
      '  add     add a task',
      '  list    show open tasks',
      '  done    mark a task done',
      '',
      'Options:',
      '  --all         include finished tasks',
      '  -h, --help    show this help',
    ].join('\n')
  );
});
