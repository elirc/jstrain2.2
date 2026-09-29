// ─────────────────────────────────────────────────────────────────────────
//  23 · --help from a spec                                 ★★☆ core
//  concepts: single source of truth · padding · derived labels
//  run: node 23-help-from-spec.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Hand-written help text goes stale the first week. Write the flags down
//  ONCE, as data the parser can also read, and generate the screen:
//
//      { name: 'deploy', summary: 'push the current build to a server',
//        flags: { target: { short: 't', type: 'string',
//                           describe: '...', required: true } } }
//
//      deploy — push the current build to a server
//
//      Usage: deploy [options]
//
//      Options:
//        -t, --target <string>   server to deploy to (required)
//        -f, --force             skip the safety checks
//            --retries <number>  attempts before giving up (default: 3)
//
//  A label is `-s, ` (or four spaces when there is no short form) then
//  `--name` then ` <type>` — except for a boolean, which takes no value.
//  Two spaces after the widest label, then the description, then
//  ` (required)` or ` (default: x)`. No flags at all: stop after Usage.
//
//  hint: build the label for every flag before you measure anything —
//  the width is the longest label, and the padding is padEnd

import { test, eq } from '../../_lib/check.js';

export function renderHelp(spec) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

// Provided: the spec the parser and the help screen both read.
const DEPLOY = {
  name: 'deploy',
  summary: 'push the current build to a server',
  flags: {
    target: {
      short: 't',
      type: 'string',
      describe: 'server to deploy to',
      required: true,
    },
    force: { short: 'f', type: 'boolean', describe: 'skip the safety checks' },
    retries: {
      type: 'number',
      describe: 'attempts before giving up',
      default: 3,
    },
  },
};

test('the title says what the tool is, then how to run it', () => {
  const lines = renderHelp(DEPLOY).split('\n');
  eq(lines[0], 'deploy — push the current build to a server');
  eq(lines[1], '');
  eq(lines[2], 'Usage: deploy [options]');
});

test('a value-taking flag shows its type as the placeholder', () => {
  const lines = renderHelp(DEPLOY).split('\n');
  eq(lines[5].startsWith('  -t, --target <string>'), true);
});

test('a boolean flag has no placeholder — there is nothing to pass', () => {
  const lines = renderHelp(DEPLOY).split('\n');
  eq(lines[6].startsWith('  -f, --force '), true);
});

test('a flag with no short form still lines up with the ones that have', () => {
  const lines = renderHelp(DEPLOY).split('\n');
  eq(lines[7].startsWith('      --retries'), true);
  eq(lines[5].indexOf('--target'), lines[7].indexOf('--retries'));
});

test('required says so, and a default shows the value', () => {
  const lines = renderHelp(DEPLOY).split('\n');
  eq(lines[5].endsWith('server to deploy to (required)'), true);
  eq(lines[7].endsWith('attempts before giving up (default: 3)'), true);
});

test('renders the whole help screen', () => {
  eq(
    renderHelp(DEPLOY),
    [
      'deploy — push the current build to a server',
      '',
      'Usage: deploy [options]',
      '',
      'Options:',
      '  -t, --target <string>   server to deploy to (required)',
      '  -f, --force             skip the safety checks',
      '      --retries <number>  attempts before giving up (default: 3)',
    ].join('\n')
  );
});

test('a flag nobody described leaves no trailing spaces behind', () => {
  const out = renderHelp({
    name: 'x',
    summary: 'y',
    flags: { quiet: { short: 'q', type: 'boolean' } },
  });
  eq(out.split('\n').pop(), '  -q, --quiet');
});

test('a spec with no flags stops after the usage line', () => {
  eq(renderHelp({ name: 'x', summary: 'y' }), 'x — y\n\nUsage: x [options]');
  eq(renderHelp({ name: 'x', summary: 'y', flags: {} }).includes('Options'), false);
});
