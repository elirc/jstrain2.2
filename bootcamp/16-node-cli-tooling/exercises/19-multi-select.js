// ─────────────────────────────────────────────────────────────────────────
//  19 · checkbox prompt                                    ★★☆ core
//  concepts: readline/promises · Set · re-prompt loops
//  run: node 19-multi-select.js
// ─────────────────────────────────────────────────────────────────────────
//
//  The other half of exercise 15: a menu you can pick SEVERAL things from.
//  Typing a number toggles that line, an empty answer finishes.
//
//      await askMultiSelect(rl, 'Pick toppings:', ['cheese', 'basil'])
//
//      Pick toppings:
//        1) [ ] cheese
//        2) [ ] basil
//      >
//
//  '2' toggles basil on and asks again with '[x] basil' showing.
//  '1 2' or '1,2' toggles both in one answer. Enter on its own returns
//  the picks — in OPTION order, not the order they were typed. An answer
//  holding any number that is not on the menu toggles nothing at all and
//  asks again. `selected` seeds the boxes that start ticked.
//
//  The whole menu is part of the question, exactly as in exercise 15 —
//  one rl.question call per round, so one write per round.
//
//  hint: a Set of the chosen options, then `options.filter(o => set.has(o))`
//  at the end gives you the ordering for free

import { test, eq } from '../../_lib/check.js';
import { PassThrough, Writable } from 'node:stream';
import { createInterface } from 'node:readline/promises';

export async function askMultiSelect(rl, question, options, { selected = [] } = {}) {
  throw new Error('TODO');
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
