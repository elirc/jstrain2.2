// ─────────────────────────────────────────────────────────────────────────
//  19 · checkbox prompt — SOLUTION                         ★★☆ core
//  run: node 19-multi-select.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the state is a Set of chosen options and the menu is
//  rebuilt from it every round, so the boxes cannot drift out of step with
//  the answer — there is only one source of truth and it is read at draw
//  time. The menu is part of the QUESTION string for the same reason as in
//  exercise 15: one write per round is one thing to assert.
//  Validation is all-or-nothing on purpose. Parsing every token BEFORE
//  toggling anything means '1 9' leaves the selection alone instead of
//  ticking cheese and then complaining — a half-applied answer is the bug
//  people actually hit here, and it is invisible until a user types it.
//  The return is `options.filter(...)`, not `[...chosen]`: a Set iterates
//  in insertion order, so spreading it would hand back '3, 1' as
//  ['olives', 'cheese'] and the caller's output would reorder itself
//  depending on what the human clicked first.

import { test, eq } from '../../_lib/check.js';
import { PassThrough, Writable } from 'node:stream';
import { createInterface } from 'node:readline/promises';

export async function askMultiSelect(rl, question, options, { selected = [] } = {}) {
  const chosen = new Set(selected);

  for (;;) {
    const menu = options
      .map((option, i) => `  ${i + 1}) [${chosen.has(option) ? 'x' : ' '}] ${option}\n`)
      .join('');
    const answer = (await rl.question(`${question}\n${menu}> `)).trim();

    if (answer === '') return options.filter((option) => chosen.has(option));

    const numbers = answer.split(/[\s,]+/).map(Number);
    const allValid = numbers.every(
      (n) => Number.isInteger(n) && n >= 1 && n <= options.length
    );
    if (!allValid) continue;

    for (const n of numbers) {
      const option = options[n - 1];
      if (chosen.has(option)) chosen.delete(option);
      else chosen.add(option);
    }
  }
}

// ──────────────────────────── tests ──────────────────────────────────────

// Provided: the same fake terminal as exercises 14 and 15 — a real
// readline interface whose "human" types the next scripted answer each
// time a prompt is written.
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

const TOPPINGS = ['cheese', 'basil', 'olives'];
const EMPTY =
  'Pick toppings:\n  1) [ ] cheese\n  2) [ ] basil\n  3) [ ] olives\n> ';
const BASIL =
  'Pick toppings:\n  1) [ ] cheese\n  2) [x] basil\n  3) [ ] olives\n> ';

test('Enter with nothing ticked returns an empty list', async () => {
  await withTerminal([''], async (rl) => {
    eq(await askMultiSelect(rl, 'Pick toppings:', TOPPINGS), []);
  });
});

test('the menu shows an empty box beside every option', async () => {
  await withTerminal([''], async (rl, shown) => {
    await askMultiSelect(rl, 'Pick toppings:', TOPPINGS);
    eq(shown(), EMPTY);
  });
});

test('a number ticks its box and the menu is drawn again', async () => {
  await withTerminal(['2', ''], async (rl, shown) => {
    eq(await askMultiSelect(rl, 'Pick toppings:', TOPPINGS), ['basil']);
    eq(shown(), EMPTY + BASIL);
  });
});

test('picking the same number twice unticks it', async () => {
  await withTerminal(['2', '2', ''], async (rl) => {
    eq(await askMultiSelect(rl, 'Pick toppings:', TOPPINGS), []);
  });
});

test('several numbers in one answer toggle each of them', async () => {
  await withTerminal(['3,1', ''], async (rl) => {
    eq(await askMultiSelect(rl, 'Pick toppings:', TOPPINGS), [
      'cheese',
      'olives',
    ]);
  });
});

test('the result is in option order, not the order they were picked', async () => {
  await withTerminal(['3', '1', ''], async (rl) => {
    eq(await askMultiSelect(rl, 'Pick toppings:', TOPPINGS), [
      'cheese',
      'olives',
    ]);
  });
});

test('an answer with a number off the menu changes nothing', async () => {
  await withTerminal(['9', 'nope', '2', ''], async (rl) => {
    eq(await askMultiSelect(rl, 'Pick toppings:', TOPPINGS), ['basil']);
  });
});

test('selected seeds the ticked boxes and Enter keeps them', async () => {
  await withTerminal([''], async (rl, shown) => {
    const picked = await askMultiSelect(rl, 'Pick toppings:', TOPPINGS, {
      selected: ['basil'],
    });
    eq(picked, ['basil']);
    eq(shown(), BASIL);
  });
});
