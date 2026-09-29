// ─────────────────────────────────────────────────────────────────────────
//  15 · menus and validation                               ★★★ stretch
//  concepts: prompt loops · 1-based menus · parse-don't-validate
//  run: node 15-prompt-choice.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Two prompts that every scaffolding tool has. The menu is part of the
//  question string — ONE call to rl.question, so the list can never be
//  separated from the prompt it belongs to.
//
//      await askChoice(rl, 'Pick a template:',
//                      ['blank', 'node-cli', 'library'])
//        prints  'Pick a template:\n  1) blank\n  2) node-cli\n'
//              + '  3) library\n> '
//        '2'        → 'node-cli'
//        'Node-CLI' → 'node-cli'   (the exact name, any case)
//        '', '9', 'abc' → print the whole menu again
//
//      await askUntilValid(rl, 'port? ', asPort)
//        '8080' → 8080
//        'nope' → next prompt is 'not a port: nope\nport? '
//        after maxAttempts (default 3) failures → rethrow the last error
//
//  `parse` returns the value or THROWS — its message is what the user
//  sees above the next prompt.
//
//  hint: menu numbers are 1-based, arrays are 0-based; Number('') is 0
//  and Number('abc') is NaN, so check Number.isInteger AND the range

import { test, eq, rejects } from '../../_lib/check.js';
import { PassThrough, Writable } from 'node:stream';
import { createInterface } from 'node:readline/promises';

export async function askChoice(rl, question, choices) {
  throw new Error('TODO');
}

export async function askUntilValid(rl, question, parse, maxAttempts = 3) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

// Provided: the same fake terminal as exercise 14, and a parser that
// throws — which is all askUntilValid asks of its `parse` argument.
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

const TEMPLATES = ['blank', 'node-cli', 'library'];
const MENU = 'Pick a template:\n  1) blank\n  2) node-cli\n  3) library\n> ';

const asPort = (text) => {
  const n = Number(text);
  if (!Number.isInteger(n) || n < 1 || n > 65535) {
    throw new Error(`not a port: ${text}`);
  }
  return n;
};

test('askChoice prints a numbered menu', async () => {
  await withTerminal(['1'], async (rl, shown) => {
    await askChoice(rl, 'Pick a template:', TEMPLATES);
    eq(shown(), MENU);
  });
});

test('the number picks the choice, counting from 1', async () => {
  await withTerminal(['2'], async (rl) => {
    eq(await askChoice(rl, 'Pick a template:', TEMPLATES), 'node-cli');
  });
});

test('a number outside the menu asks again', async () => {
  await withTerminal(['9', '1'], async (rl, shown) => {
    eq(await askChoice(rl, 'Pick a template:', TEMPLATES), 'blank');
    eq(shown(), MENU + MENU);
  });
});

test('an empty or non-numeric answer asks again', async () => {
  await withTerminal(['', 'abc', '3'], async (rl) => {
    eq(await askChoice(rl, 'Pick a template:', TEMPLATES), 'library');
  });
});

test('typing the name works too, in any case', async () => {
  await withTerminal(['Node-CLI'], async (rl) => {
    eq(await askChoice(rl, 'Pick a template:', TEMPLATES), 'node-cli');
  });
});

test('askUntilValid returns whatever parse returns', async () => {
  await withTerminal(['8080'], async (rl) => {
    eq(await askUntilValid(rl, 'port? ', asPort), 8080);
  });
});

test('a rejected answer puts the reason above the next prompt', async () => {
  await withTerminal(['nope', '443'], async (rl, shown) => {
    eq(await askUntilValid(rl, 'port? ', asPort), 443);
    eq(shown(), 'port? not a port: nope\nport? ');
  });
});

test('it gives up after maxAttempts and rethrows the last error', async () => {
  await withTerminal(['a', 'b', 'c'], async (rl) => {
    await rejects(() => askUntilValid(rl, 'port? ', asPort), 'not a port: c');
  });
});
