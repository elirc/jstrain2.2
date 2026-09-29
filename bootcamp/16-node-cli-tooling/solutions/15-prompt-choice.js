// ─────────────────────────────────────────────────────────────────────────
//  15 · menus and validation — SOLUTION                    ★★★ stretch
//  run: node 15-prompt-choice.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the menu is part of the QUESTION, not a separate write.
//  Building one query string — heading, numbered list, '> ' — means one
//  call to rl.question and one thing to assert, and it keeps the prompt
//  and its options from being separated by output from somewhere else.
//  The numbers shown are 1-based and the array is 0-based, so the lookup
//  is choices[n - 1]; Number.isInteger plus a range check rejects '', '0',
//  '2.5' and 'abc' in one go, because Number('') is 0 and Number('abc')
//  is NaN and both would otherwise index into the array.
//  askUntilValid is the general form: a parse function that THROWS on bad
//  input is the whole contract, so validation lives with the thing being
//  validated instead of inside the prompt. The error message becomes the
//  next prompt's first line, and after maxAttempts it is rethrown — a
//  prompt that never gives up hangs a script running without a human.

import { test, eq, rejects } from '../../_lib/check.js';
import { PassThrough, Writable } from 'node:stream';
import { createInterface } from 'node:readline/promises';

export async function askChoice(rl, question, choices) {
  const menu = choices.map((choice, i) => `  ${i + 1}) ${choice}\n`).join('');
  const query = `${question}\n${menu}> `;

  for (;;) {
    const answer = (await rl.question(query)).trim();
    const n = Number(answer);
    if (Number.isInteger(n) && n >= 1 && n <= choices.length) {
      return choices[n - 1];
    }
    const byName = choices.find(
      (choice) => choice.toLowerCase() === answer.toLowerCase()
    );
    if (byName !== undefined) return byName;
  }
}

export async function askUntilValid(rl, question, parse, maxAttempts = 3) {
  let prefix = '';
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const answer = (await rl.question(prefix + question)).trim();
    try {
      return parse(answer);
    } catch (err) {
      if (attempt === maxAttempts) throw err;
      prefix = `${err.message}\n`;
    }
  }
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
