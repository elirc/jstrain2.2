// ─────────────────────────────────────────────────────────────────────────
//  20 · deterministic spinner — SOLUTION                   ★☆☆ warm-up
//  run: node 20-spinner.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the only state is an index, and `i % frames.length` keeps
//  it in range for ever without ever resetting a counter. The object
//  returned closes over `out`, `label` and `i` — that is the whole object
//  system you need here, no class required.
//  The timer is deliberately missing. Production wires one up
//  (`setInterval(() => s.tick(), 80).unref()`); the test calls tick() five
//  times in a row and the assertions are exact strings instead of "roughly
//  four frames after 300ms". Any spinner that owns its own interval can
//  only be tested by sleeping, and sleeping tests are slow and flaky.
//  '\x1b[2K' erases the whole line and is what makes a shrinking line
//  safe: '\r' alone repositions the cursor but leaves every character the
//  longer previous frame wrote sitting there under the new one.
//  stop() resets the index so a reused spinner starts at frame one.

import { test, eq } from '../../_lib/check.js';
import { Writable } from 'node:stream';

export function createSpinner(out, label, frames = ['|', '/', '-', '\\']) {
  const CLEAR = '\r\x1b[2K';
  let i = 0;

  return {
    tick() {
      const line = `${CLEAR}${frames[i % frames.length]} ${label}`;
      i += 1;
      out.write(line);
      return line;
    },
    stop(text) {
      i = 0;
      const line = text === undefined ? CLEAR : `${CLEAR}${text}\n`;
      out.write(line);
      return line;
    },
  };
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
