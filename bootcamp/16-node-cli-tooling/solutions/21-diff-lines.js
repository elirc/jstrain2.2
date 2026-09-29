// ─────────────────────────────────────────────────────────────────────────
//  21 · line diff — SOLUTION                               ★★★ stretch
//  run: node 21-diff-lines.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: two functions, and the split between them is the point.
//  diffLines answers "what happened" as data; renderDiff answers "how does
//  it look". Keep them together and you cannot count the changes without
//  parsing your own output, or colour the result without a second copy of
//  the comparison.
//  toLines is where the bugs live. ''.split('\n') is [''] — one line
//  containing nothing — so an empty file would diff as a blank line
//  against your content. A trailing '\n' produces the same phantom at the
//  end, which is why the last empty entry is popped. Splitting on /\r?\n/
//  means a file saved on Windows does not report every single line as
//  changed, which is the classic "the whole file is red" diff.
//  'changed' exists because line N against line N is a MODIFICATION.
//  Emitting a removed plus an added for it renders identically but loses
//  the pairing, and every consumer — a summary, a --stat, a colouriser
//  that highlights the differing word — needs that pairing back.

import { test, eq } from '../../_lib/check.js';

function toLines(text) {
  if (text === '') return [];
  const lines = text.split(/\r?\n/);
  if (lines[lines.length - 1] === '') lines.pop();
  return lines;
}

export function diffLines(before, after) {
  const a = toLines(before);
  const b = toLines(after);
  const out = [];

  for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
    if (i >= a.length) out.push({ type: 'added', text: b[i] });
    else if (i >= b.length) out.push({ type: 'removed', text: a[i] });
    else if (a[i] === b[i]) out.push({ type: 'same', text: a[i] });
    else out.push({ type: 'changed', before: a[i], after: b[i] });
  }

  return out;
}

export function renderDiff(before, after) {
  return diffLines(before, after)
    .map((change) => {
      if (change.type === 'same') return `  ${change.text}`;
      if (change.type === 'added') return `+ ${change.text}`;
      if (change.type === 'removed') return `- ${change.text}`;
      return `- ${change.before}\n+ ${change.after}`;
    })
    .join('\n');
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
