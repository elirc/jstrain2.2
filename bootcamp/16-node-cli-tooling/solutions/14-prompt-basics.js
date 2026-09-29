// ─────────────────────────────────────────────────────────────────────────
//  14 · testable prompts — SOLUTION                        ★★★ stretch
//  run: node 14-prompt-basics.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the readline interface is a PARAMETER. That one decision
//  is what turns "interactive code you can only test by hand" into a pure
//  function of (interface, question) — the fake terminal below is a real
//  readline/promises interface, just wired to streams under test control.
//  ask() trims, because a human always leaves a trailing space somewhere
//  and 'yes ' should not be an unrecognised answer.
//  askYesNo loops forever on purpose: a prompt that gives up after one
//  bad answer either crashes or, worse, silently takes the default the
//  user did not choose. The loop re-prints the same question, which is
//  exactly what the shell does.
//  The default is shown by CAPITALISING it — [Y/n] — and an empty answer
//  (a bare Enter) is what selects it. Check for '' BEFORE y/n so Enter
//  cannot fall through to the retry.

import { test, eq } from '../../_lib/check.js';
import { PassThrough, Writable } from 'node:stream';
import { createInterface } from 'node:readline/promises';

export async function ask(rl, question) {
  const answer = await rl.question(question);
  return answer.trim();
}

export async function askYesNo(rl, question, defaultValue = true) {
  const suffix = defaultValue ? ' [Y/n] ' : ' [y/N] ';
  for (;;) {
    const answer = (await rl.question(question + suffix)).trim().toLowerCase();
    if (answer === '') return defaultValue;
    if (answer === 'y' || answer === 'yes') return true;
    if (answer === 'n' || answer === 'no') return false;
  }
}

// ──────────────────────────── tests ──────────────────────────────────────

// Provided: a fake terminal. It is a real readline/promises interface —
// only the streams are fake. Every time the code under test prints a
// prompt, the next scripted answer is "typed" in reply, which is what a
// human does and what a pre-loaded Readable.from([...]) could not do:
// readline would deliver all of those lines before the second question
// was ever asked, and drop the ones nobody was waiting for.
function fakeTerminal(answers) {
  const shown = [];
  const pending = [...answers];
  const input = new PassThrough();
  const output = new Writable({
    write(chunk, encoding, callback) {
      shown.push(chunk.toString('utf8'));
      if (pending.length) {
        setImmediate(() => input.write(`${pending.shift()}\n`));
      }
      callback();
    },
  });
  const rl = createInterface({ input, output, terminal: false });
  return { rl, shown: () => shown.join('') };
}

async function withTerminal(answers, run) {
  const terminal = fakeTerminal(answers);
  try {
    return await run(terminal.rl, terminal.shown);
  } finally {
    terminal.rl.close();
  }
}

test('ask resolves with what was typed', async () => {
  await withTerminal(['Ada'], async (rl) => {
    eq(await ask(rl, 'name? '), 'Ada');
  });
});

test('ask trims the whitespace around the answer', async () => {
  await withTerminal(['   Ada  '], async (rl) => {
    eq(await ask(rl, 'name? '), 'Ada');
  });
});

test('ask prints the question exactly as given', async () => {
  await withTerminal(['x'], async (rl, shown) => {
    await ask(rl, 'name? ');
    eq(shown(), 'name? ');
  });
});

test('askYesNo shows the default in capitals and Enter takes it', async () => {
  await withTerminal([''], async (rl, shown) => {
    eq(await askYesNo(rl, 'continue?'), true);
    eq(shown(), 'continue? [Y/n] ');
  });
});

test('a default of false flips the hint and the Enter answer', async () => {
  await withTerminal([''], async (rl, shown) => {
    eq(await askYesNo(rl, 'delete it?', false), false);
    eq(shown(), 'delete it? [y/N] ');
  });
});

test('yes and no are read in any case and either length', async () => {
  await withTerminal(['YES'], async (rl) => {
    eq(await askYesNo(rl, 'ok?'), true);
  });
  await withTerminal(['n'], async (rl) => {
    eq(await askYesNo(rl, 'ok?'), false);
  });
  await withTerminal(['No '], async (rl) => {
    eq(await askYesNo(rl, 'ok?', true), false);
  });
});

test('an answer it does not understand asks again', async () => {
  await withTerminal(['maybe', 'y'], async (rl, shown) => {
    eq(await askYesNo(rl, 'continue?'), true);
    eq(shown(), 'continue? [Y/n] continue? [Y/n] ');
  });
});
