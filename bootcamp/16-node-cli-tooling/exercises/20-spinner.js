// ─────────────────────────────────────────────────────────────────────────
//  20 · deterministic spinner                              ★☆☆ warm-up
//  concepts: closures · ANSI cursor control · injected clocks
//  run: node 20-spinner.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A spinner is two things: a list of frames and something that advances
//  it. Put setInterval inside and the only way to test it is to wait; take
//  the tick as a METHOD and the caller decides — a timer in production, a
//  for-loop in a test.
//
//      const s = createSpinner(out, 'building');
//      s.tick();   → writes '\r\x1b[2K| building'
//      s.tick();   → writes '\r\x1b[2K/ building'
//      s.stop('✔ built');  → writes '\r\x1b[2K✔ built\n'
//
//  '\r' puts the cursor back at column 0 and '\x1b[2K' erases the line —
//  without the erase, a shorter frame leaves the tail of the longer one
//  behind. tick() returns the string it wrote. Frames cycle forever.
//
//  hint: keep the index in a closure variable and wrap it with %

import { test, eq } from '../../_lib/check.js';
import { Writable } from 'node:stream';

export function createSpinner(out, label, frames = ['|', '/', '-', '\\']) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

// Provided: a stream that remembers instead of drawing.
function collector() {
  const chunks = [];
  const stream = new Writable({
    write(chunk, encoding, callback) {
      chunks.push(chunk.toString('utf8'));
      callback();
    },
  });
  stream.text = () => chunks.join('');
  stream.frames = () => chunks;
  return stream;
}

const CLEAR = '\r\x1b[2K';

test('nothing is drawn until the first tick', () => {
  const out = collector();
  createSpinner(out, 'building');
  eq(out.text(), '');
});

test('the first tick draws frame one beside the label', () => {
  const out = collector();
  const spinner = createSpinner(out, 'building');
  eq(spinner.tick(), `${CLEAR}| building`);
  eq(out.text(), `${CLEAR}| building`);
});

test('every tick rewinds to column 0 and erases the old frame', () => {
  const out = collector();
  const spinner = createSpinner(out, 'building');
  spinner.tick();
  spinner.tick();
  eq(out.frames(), [`${CLEAR}| building`, `${CLEAR}/ building`]);
});

test('the frames wrap around after the last one', () => {
  const out = collector();
  const spinner = createSpinner(out, 'x');
  for (let i = 0; i < 5; i += 1) spinner.tick();
  eq(out.frames().map((f) => f.replace(CLEAR, '')), [
    '| x',
    '/ x',
    '- x',
    '\\ x',
    '| x',
  ]);
});

test('a custom frame list is used exactly as given', () => {
  const out = collector();
  const spinner = createSpinner(out, 'sync', ['⠋', '⠙']);
  spinner.tick();
  spinner.tick();
  spinner.tick();
  eq(out.text(), `${CLEAR}⠋ sync${CLEAR}⠙ sync${CLEAR}⠋ sync`);
});

test('stop erases the spinner and prints a final line', () => {
  const out = collector();
  const spinner = createSpinner(out, 'building');
  spinner.tick();
  spinner.stop('✔ built in 2s');
  eq(out.frames()[1], `${CLEAR}✔ built in 2s\n`);
});

test('stop with no text clears the line and adds nothing', () => {
  const out = collector();
  const spinner = createSpinner(out, 'building');
  spinner.tick();
  spinner.stop();
  eq(out.frames()[1], CLEAR);
});

test('ticking after stop starts the cycle over', () => {
  const out = collector();
  const spinner = createSpinner(out, 'x');
  spinner.tick();
  spinner.tick();
  spinner.stop();
  eq(spinner.tick(), `${CLEAR}| x`);
});
