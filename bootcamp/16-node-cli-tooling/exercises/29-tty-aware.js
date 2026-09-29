// ─────────────────────────────────────────────────────────────────────────
//  29 · knowing where you are                              ★☆☆ warm-up
//  concepts: isTTY · NO_COLOR · capability detection
//  run: node 29-tty-aware.js
// ─────────────────────────────────────────────────────────────────────────
//
//  The same program is talking to a human at a terminal and to `> log.txt`
//  in a cron job, and it cannot tell which without asking. Ask once, in
//  one function, from arguments you can fake:
//
//      describeOutput(stream, env)
//        → { color: true, animate: true, width: 120 }   a terminal
//        → { color: false, animate: false, width: 80 }  a pipe
//
//  A terminal is `stream.isTTY`. NO_COLOR (set to anything) takes the
//  colour away but NOT the animation — it is a promise about colour.
//  TERM=dumb takes both. `width` is `stream.columns`, or 80 when the
//  stream has none, which is what a pipe looks like.
//
//      writeStatus(stream, 'building…')
//        terminal → '\r\x1b[2K\x1b[36mbuilding…\x1b[39m'   redrawn in place
//        pipe     → 'building…\n'                          a plain line
//
//  Cyan is '\x1b[36m' … '\x1b[39m'. On a terminal the status line is
//  rewritten, so it carries no newline; down a pipe a '\r' would produce
//  one enormous line full of control characters, so it gets a real one.
//  writeStatus returns what it wrote.
//
//  hint: writeStatus should call describeOutput, not re-check isTTY

import { test, eq } from '../../_lib/check.js';

export function describeOutput(stream, env = {}) {
  throw new Error('TODO');
}

export function writeStatus(stream, text, env = {}) {
  throw new Error('TODO');
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
