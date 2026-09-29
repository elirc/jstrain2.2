// ─────────────────────────────────────────────────────────────────────────
//  27 · many bars at once — SOLUTION                       ★★☆ core
//  run: node 27-multi-progress.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: state, then string, then stream — three layers that never
//  reach past each other. `update` only touches numbers, `frame` only
//  builds text, `draw` is the only thing that knows an output exists. You
//  can assert the middle layer without a terminal, which is the entire
//  reason the tests below are one-liners.
//  Drawing a single bar is INJECTED. The renderer from exercise 01 is
//  already written and already tested; taking it as a parameter means
//  this file never re-tests percentage rounding, and the tests here can
//  pass a fake renderer whose output is trivial to assert.
//  Redrawing N lines in place is one escape: '\x1b[NA' moves the cursor
//  up N rows, and then each line is erased ('\x1b[2K') before it is
//  rewritten. Skip the erase and a bar that shrinks — (9/10) becoming
//  (10/10) is one character shorter — leaves a ')' stranded at the end of
//  the line. The FIRST draw must not move up: there is nothing above it
//  yet, and doing it anyway eats whatever the tool printed before.

import { test, eq, throws, spy } from '../../_lib/check.js';

export function createMultiProgress(tasks, { width = 10, renderBar } = {}) {
  const rows = tasks.map((task) => ({ ...task, current: 0 }));
  const labelWidth = Math.max(...rows.map((row) => row.label.length));
  let drawn = false;

  const frame = () =>
    rows
      .map(
        (row) =>
          `${row.label.padEnd(labelWidth)}  ${renderBar(row.current, row.total, width)}`
      )
      .join('\n');

  return {
    frame,
    update(label, current) {
      const row = rows.find((r) => r.label === label);
      if (!row) throw new Error(`no such task: ${label}`);
      row.current = current;
    },
    draw(out) {
      const body = frame()
        .split('\n')
        .map((line) => `\x1b[2K${line}\n`)
        .join('');
      const text = `${drawn ? `\x1b[${rows.length}A` : ''}${body}`;
      drawn = true;
      out.write(text);
      return text;
    },
  };
}

// ──────────────────────────── tests ──────────────────────────────────────

// Provided: two jobs, a stream that remembers, and a fake bar renderer
// whose output says exactly what it was called with.
const TASKS = [
  { label: 'build', total: 5 },
  { label: 'test', total: 10 },
];

function fakeStream() {
  const chunks = [];
  return { write: (s) => chunks.push(s), text: () => chunks.join('') };
}

const fakeBar = () => spy((current, total, width) => `${current}/${total}@${width}`);

test('a frame is a padded label and a bar for every task', () => {
  const progress = createMultiProgress(TASKS, { renderBar: fakeBar() });
  eq(progress.frame(), 'build  0/5@10\ntest   0/10@10');
});

test('the injected renderer draws every bar, and is told the width', () => {
  const bar = fakeBar();
  const progress = createMultiProgress(TASKS, { renderBar: bar, width: 4 });
  progress.frame();
  eq(bar.calls, [
    [0, 5, 4],
    [0, 10, 4],
  ]);
});

test('update moves one bar and leaves the other alone', () => {
  const progress = createMultiProgress(TASKS, { renderBar: fakeBar() });
  progress.update('build', 3);
  eq(progress.frame(), 'build  3/5@10\ntest   0/10@10');
});

test('frame draws nothing — it only returns the string', () => {
  const out = fakeStream();
  const progress = createMultiProgress(TASKS, { renderBar: fakeBar() });
  progress.frame();
  eq(out.text(), '');
});

test('the first draw erases each line as it writes it', () => {
  const out = fakeStream();
  const progress = createMultiProgress(TASKS, { renderBar: fakeBar() });
  progress.draw(out);
  eq(out.text(), '\x1b[2Kbuild  0/5@10\n\x1b[2Ktest   0/10@10\n');
});

test('the next draw rewinds over the whole block first', () => {
  const out = fakeStream();
  const progress = createMultiProgress(TASKS, { renderBar: fakeBar() });
  progress.draw(out);
  progress.update('test', 10);
  progress.draw(out);
  eq(
    out.text(),
    '\x1b[2Kbuild  0/5@10\n\x1b[2Ktest   0/10@10\n' +
      '\x1b[2A\x1b[2Kbuild  0/5@10\n\x1b[2Ktest   10/10@10\n'
  );
});

test('the rewind is one line per task, whatever the count', () => {
  const out = fakeStream();
  const progress = createMultiProgress([{ label: 'only', total: 1 }], {
    renderBar: fakeBar(),
  });
  progress.draw(out);
  eq(progress.draw(out).startsWith('\x1b[1A'), true);
});

test('updating a task nobody registered throws', () => {
  const progress = createMultiProgress(TASKS, { renderBar: fakeBar() });
  throws(() => progress.update('deploy', 1), 'no such task: deploy');
});
