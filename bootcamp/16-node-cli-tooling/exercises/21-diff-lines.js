// ─────────────────────────────────────────────────────────────────────────
//  21 · line diff                                          ★★★ stretch
//  concepts: string splitting · positional alignment · rendering
//  run: node 21-diff-lines.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Every tool that rewrites a file for you — a formatter, a codemod, a
//  scaffolder — owes the user a preview. This is the cheap version: no
//  LCS, no fuzzy matching, just line N against line N.
//
//      diffLines('a\nb', 'a\nB')
//        → [{ type: 'same', text: 'a' },
//           { type: 'changed', before: 'b', after: 'B' }]
//
//  Four record types: 'same' and 'added'/'removed' carry `text`, and
//  'changed' carries `before` and `after` — a line that exists in both
//  but differs is ONE change, not an unrelated delete plus insert. Past
//  the end of the shorter side everything is added or removed.
//
//      renderDiff('a\nb', 'a\nB')  → '  a\n- b\n+ B'
//
//  same → two spaces, removed → '- ', added → '+ ', changed → both lines,
//  removed first. Lines split on \n OR \r\n, a single trailing newline is
//  not a line of its own, and '' is zero lines.
//
//  hint: write the splitter first and test it in your head on '', 'a\n'
//  and 'a\nb' — '' .split('\n') is [''], which is one line too many

import { test, eq } from '../../_lib/check.js';

export function diffLines(before, after) {
  throw new Error('TODO');
}

export function renderDiff(before, after) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

// Provided: a config file before and after an edit.
const OLD = 'port: 80\nhost: dev.local\ndebug: true';
const NEW = 'port: 443\nhost: dev.local\ndebug: true';

test('identical text is nothing but context', () => {
  eq(diffLines('a\nb', 'a\nb'), [
    { type: 'same', text: 'a' },
    { type: 'same', text: 'b' },
  ]);
});

test('a replaced line is one change, not a remove and an add', () => {
  eq(diffLines(OLD, NEW)[0], {
    type: 'changed',
    before: 'port: 80',
    after: 'port: 443',
  });
  eq(diffLines(OLD, NEW).length, 3);
});

test('lines past the end of the other side are added or removed', () => {
  eq(diffLines('a', 'a\nb'), [
    { type: 'same', text: 'a' },
    { type: 'added', text: 'b' },
  ]);
  eq(diffLines('a\nb', 'a'), [
    { type: 'same', text: 'a' },
    { type: 'removed', text: 'b' },
  ]);
});

test('an empty string is zero lines, not one blank one', () => {
  eq(diffLines('', ''), []);
  eq(diffLines('', 'x'), [{ type: 'added', text: 'x' }]);
});

test('a trailing newline does not invent an extra line', () => {
  eq(diffLines('a\n', 'a'), [{ type: 'same', text: 'a' }]);
  eq(diffLines('a\nb\n', 'a\nb\n').length, 2);
});

test('CRLF and LF versions of the same text are the same text', () => {
  eq(diffLines('a\r\nb\r\n', 'a\nb\n'), [
    { type: 'same', text: 'a' },
    { type: 'same', text: 'b' },
  ]);
});

test('renderDiff marks each line with its sign', () => {
  eq(
    renderDiff(OLD, NEW),
    '- port: 80\n+ port: 443\n  host: dev.local\n  debug: true'
  );
});

test('renderDiff of an empty side is all one sign, and of nothing is empty', () => {
  eq(renderDiff('', 'a\nb'), '+ a\n+ b');
  eq(renderDiff('a\nb', ''), '- a\n- b');
  eq(renderDiff('', ''), '');
});
