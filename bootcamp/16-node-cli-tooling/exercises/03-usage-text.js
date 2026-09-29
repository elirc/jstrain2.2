// ─────────────────────────────────────────────────────────────────────────
//  03 · usage text                                         ★☆☆ warm-up
//  concepts: padEnd · array mapping · optional sections
//  run: node 03-usage-text.js
// ─────────────────────────────────────────────────────────────────────────
//
//  `--help` is the most-used feature of any CLI. Render it from a spec
//  object so it can never drift from the flags you actually support.
//
//      renderUsage({ usage: 'task <command>' })
//        → 'Usage: task <command>'
//
//  With lists, each block gets a heading, two spaces of indent, labels
//  padded to the longest label IN THAT BLOCK, then four spaces:
//
//      Usage: task <command> [options]
//      ⏎
//      Commands:
//        add     add a task
//        list    show open tasks
//      ⏎
//      Options:
//        --all         include finished tasks
//        -h, --help    show this help
//
//  Blocks are separated by one blank line. An empty or missing list
//  prints nothing at all — no heading. An entry with no `describe` must
//  not leave trailing spaces on its line.
//
//  hint: Math.max(...entries.map(...)) for the width, .trimEnd() for the
//  line

import { test, eq } from '../../_lib/check.js';

const GAP = 4;

export function renderUsage(spec) {
  throw new Error('TODO');
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
