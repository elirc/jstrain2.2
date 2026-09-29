// ─────────────────────────────────────────────────────────────────────────
//  23 · --help from a spec — SOLUTION                      ★★☆ core
//  run: node 23-help-from-spec.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the spec is the single source of truth. The parser will
//  read `type` to coerce values and `default` to fill the gaps, and this
//  renderer reads the same two keys to describe them — so a flag can never
//  be documented as a boolean while the parser treats it as a string. The
//  moment help text lives in a separate string constant it starts lying.
//  Labels are BUILT, not stored: short + long + `<type>` placeholder. That
//  is why a boolean has no placeholder (there is nothing to pass) and why
//  a flag with no short form gets four spaces instead — the long flags
//  then line up in one column whether or not a short one exists beside
//  them, which is the detail that makes generated help look hand-written.
//  Width is measured across every label, once, before drawing anything;
//  and `.trimEnd()` catches the flag nobody described yet, because a line
//  of trailing spaces is invisible until it shows up in a diff.

import { test, eq } from '../../_lib/check.js';

export function renderHelp(spec) {
  const title = spec.summary ? `${spec.name} — ${spec.summary}` : spec.name;
  const blocks = [title, `Usage: ${spec.name} [options]`];
  const names = Object.keys(spec.flags ?? {});

  if (names.length > 0) {
    const label = (name) => {
      const flag = spec.flags[name];
      const short = flag.short ? `-${flag.short}, ` : '    ';
      const value = flag.type === 'boolean' ? '' : ` <${flag.type}>`;
      return `${short}--${name}${value}`;
    };
    const width = Math.max(...names.map((name) => label(name).length));

    const lines = names.map((name) => {
      const flag = spec.flags[name];
      const note = flag.required
        ? ' (required)'
        : flag.default !== undefined
          ? ` (default: ${flag.default})`
          : '';
      return `  ${label(name).padEnd(width)}  ${flag.describe ?? ''}${note}`.trimEnd();
    });

    blocks.push(['Options:', ...lines].join('\n'));
  }

  return blocks.join('\n\n');
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
