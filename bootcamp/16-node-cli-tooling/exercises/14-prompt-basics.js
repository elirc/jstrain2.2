// ─────────────────────────────────────────────────────────────────────────
//  14 · testable prompts                                   ★★★ stretch
//  concepts: readline/promises · dependency injection · retry loops
//  run: node 14-prompt-basics.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Interactive code is usually untestable because it reaches for
//  process.stdin. Take the readline interface as an argument instead and
//  the whole thing becomes an ordinary async function.
//
//      await ask(rl, 'name? ')          → 'Ada'      (answer, trimmed)
//
//      await askYesNo(rl, 'continue?')  prints 'continue? [Y/n] '
//        ''      → true    (Enter takes the default)
//        'YES'   → true      'y', 'yes', any case
//        'No '   → false     'n', 'no', any case
//        'maybe' → asks the same question again, and keeps asking
//
//      askYesNo(rl, 'delete it?', false) prints 'delete it? [y/N] '
//
//  The default is shown in capitals. Nothing else is added to the
//  question text — the suffix above is the whole decoration.
//
//  hint: `const answer = await rl.question(text)` — and test for the
//  empty answer BEFORE you test for y/n

import { test, eq } from '../../_lib/check.js';
import { PassThrough, Writable } from 'node:stream';
import { createInterface } from 'node:readline/promises';

export async function ask(rl, question) {
  throw new Error('TODO');
}

export async function askYesNo(rl, question, defaultValue = true) {
  throw new Error('TODO');
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
