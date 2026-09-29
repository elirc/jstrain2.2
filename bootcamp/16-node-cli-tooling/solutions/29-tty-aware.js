// ─────────────────────────────────────────────────────────────────────────
//  29 · knowing where you are — SOLUTION                   ★☆☆ warm-up
//  run: node 29-tty-aware.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: ask ONCE, at the edge, and pass the answer down. Every
//  function that checks `process.stdout.isTTY` for itself is a function
//  that cannot be tested and cannot be overridden by a --no-color flag;
//  describeOutput is that check, done in one place, from arguments.
//  The two capabilities are separate on purpose. NO_COLOR is a promise
//  about COLOUR, so a user who sets it still gets a spinner; TERM=dumb
//  says the terminal cannot do escapes at all, so it takes both. Treating
//  them as one switch is how NO_COLOR users end up with no progress
//  either — or, worse, with escape codes in their log file.
//  writeStatus shows why the distinction has teeth: on a terminal a
//  status line is REWRITTEN, and '\r' with no newline is what keeps it on
//  one row. Send that down a pipe and the file gets one enormous line
//  with control characters in it, so the piped branch writes plain lines
//  instead — same information, a shape the next program can read.
//  `columns` is undefined on a pipe, and 80 is the traditional guess.

import { test, eq } from '../../_lib/check.js';

export function describeOutput(stream, env = {}) {
  const terminal = Boolean(stream.isTTY) && env.TERM !== 'dumb';
  return {
    color: terminal && env.NO_COLOR === undefined,
    animate: terminal,
    width: stream.columns ?? 80,
  };
}

export function writeStatus(stream, text, env = {}) {
  const { color, animate } = describeOutput(stream, env);
  const body = color ? `\x1b[36m${text}\x1b[39m` : text;
  const line = animate ? `\r\x1b[2K${body}` : `${body}\n`;
  stream.write(line);
  return line;
}

// ──────────────────────────── tests ──────────────────────────────────────

// Provided: a stream you can lie to about being a terminal.
function fakeStream({ isTTY = false, columns } = {}) {
  const chunks = [];
  return {
    isTTY,
    columns,
    write: (s) => chunks.push(s),
    text: () => chunks.join(''),
  };
}

test('a terminal can do both colour and animation', () => {
  eq(describeOutput(fakeStream({ isTTY: true, columns: 120 })), {
    color: true,
    animate: true,
    width: 120,
  });
});

test('a pipe can do neither, and is assumed to be 80 wide', () => {
  eq(describeOutput(fakeStream()), {
    color: false,
    animate: false,
    width: 80,
  });
});

test('NO_COLOR takes the colour and leaves the animation', () => {
  const seen = describeOutput(fakeStream({ isTTY: true }), { NO_COLOR: '1' });
  eq(seen.color, false);
  eq(seen.animate, true);
});

test('TERM=dumb takes both — the terminal cannot do escapes at all', () => {
  const seen = describeOutput(fakeStream({ isTTY: true }), { TERM: 'dumb' });
  eq(seen.color, false);
  eq(seen.animate, false);
});

test('the width is the real one when there is one', () => {
  eq(describeOutput(fakeStream({ isTTY: true, columns: 40 })).width, 40);
  eq(describeOutput(fakeStream({ columns: 200 })).width, 200);
});

test('on a terminal the status is rewritten in place, in cyan', () => {
  const stream = fakeStream({ isTTY: true });
  writeStatus(stream, 'building…');
  eq(stream.text(), '\r\x1b[2K\x1b[36mbuilding…\x1b[39m');
});

test('piped, the status is a plain line that ends', () => {
  const stream = fakeStream();
  writeStatus(stream, 'building…');
  eq(stream.text(), 'building…\n');
});

test('NO_COLOR still redraws in place, just without the colour', () => {
  const stream = fakeStream({ isTTY: true });
  eq(writeStatus(stream, 'building…', { NO_COLOR: '1' }), '\r\x1b[2Kbuilding…');
});
