// ─────────────────────────────────────────────────────────────────────────
//  27 · many bars at once                                  ★★☆ core
//  concepts: closures over state · ANSI cursor movement · injection
//  run: node 27-multi-progress.js
// ─────────────────────────────────────────────────────────────────────────
//
//  One download has one bar. Five parallel downloads have five, and they
//  all have to redraw in place without scrolling the terminal away.
//
//      const p = createMultiProgress(
//        [{ label: 'build', total: 5 }, { label: 'test', total: 10 }],
//        { renderBar }
//      );
//      p.update('build', 3);
//      p.frame()   → 'build  [███░░] 60% (3/5)\ntest   [░░░░░] 0% (0/10)'
//      p.draw(out) → writes that block, erasing each line as it goes
//      p.draw(out) → moves the cursor back up first, then rewrites it
//
//  Labels pad into a column, then two spaces, then the bar. Drawing one
//  bar is somebody else's job: `renderBar(current, total, width)` is
//  passed in, so this file never re-implements exercise 01.
//  Every task starts at 0. Updating a label that was never registered
//  throws `no such task: deploy`. draw() returns what it wrote.
//
//      '\x1b[NA' moves the cursor up N lines · '\x1b[2K' erases a line
//
//  hint: the FIRST draw must not move up — there is nothing above it yet

import { test, eq, throws, spy } from '../../_lib/check.js';

export function createMultiProgress(tasks, { width = 10, renderBar } = {}) {
  throw new Error('TODO');
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
