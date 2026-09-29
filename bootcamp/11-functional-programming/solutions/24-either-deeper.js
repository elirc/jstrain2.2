// ─────────────────────────────────────────────────────────────────────────
//  24 · Either, deeper — SOLUTION                            ★★★ stretch
//  run: node 24-either-deeper.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `map`/`chain` work on the Ok side; `mapError`/`orElse` are
//  their mirror images on the Err side. Note the asymmetry in what they
//  return — mapError REWRAPS (`Err(fn(error))`) because fn hands back a
//  plain error, while orElse trusts fn to return a whole Either. That is
//  exactly the map-versus-chain distinction, moved to the other channel.
//  Both return the original box untouched on the side they do not handle,
//  which is why the tests can assert `===` rather than deep equality.
//  `sequence` and `traverse` are the same fold: walk, bail on the first
//  failure, otherwise collect. `sequence(list)` is just
//  `traverse(list, (x) => x)` — worth writing once you see it.
//  Classic wrong turn: `traverse = (items, fn) => sequence(items.map(fn))`.
//  It returns the right answer and does the wrong work — `map` runs fn on
//  every item first, so a validation that should have stopped at row 2
//  parses all ten thousand rows before reporting it.

import { test, eq, ok, spy } from '../../_lib/check.js';

// ── given: the Either itself ─────────────────────────────────────────────

export function Ok(value) {
  const self = {
    isOk: true,
    value,
    map: (fn) => Ok(fn(value)),
    chain: (fn) => fn(value),
    fold: (onErr, onOk) => onOk(value),
  };
  return self;
}

export function Err(error) {
  const self = {
    isOk: false,
    error,
    map: () => self,
    chain: () => self,
    fold: (onErr) => onErr(error),
  };
  return self;
}

const parseInteger = (text) => {
  const n = Number(text);
  return Number.isInteger(n) ? Ok(n) : Err(`${text} is not a whole number`);
};

export function mapError(either, fn) {
  return either.isOk ? either : Err(fn(either.error));
}

export function orElse(either, fn) {
  return either.isOk ? either : fn(either.error);
}

export function sequence(eithers) {
  return traverse(eithers, (either) => either);
}

export function traverse(items, fn) {
  const values = [];
  for (const item of items) {
    const either = fn(item);
    if (!either.isOk) return either;
    values.push(either.value);
  }
  return Ok(values);
}

// ──────────────────────────── tests ──────────────────────────────────────

test('mapError rewrites the error inside a failure', () => {
  const wrapped = mapError(Err('ENOENT'), (e) => `config: ${e}`);
  eq(wrapped.isOk, false);
  eq(wrapped.error, 'config: ENOENT');
});

test('mapError hands a success straight back, untouched', () => {
  const rewrite = spy((e) => `nope: ${e}`);
  const success = Ok(42);
  ok(mapError(success, rewrite) === success, 'the very same box');
  eq(rewrite.callCount, 0);
});

test('orElse recovers a failure with another Either', () => {
  eq(orElse(Err('no cache'), () => Ok('default')).value, 'default');
  eq(orElse(Err('no cache'), (e) => Err(`${e}, and no disk`)).error,
    'no cache, and no disk');
});

test('orElse never runs on a success', () => {
  const recover = spy(() => Ok('fallback'));
  const success = Ok('fresh');
  ok(orElse(success, recover) === success, 'the very same box');
  eq(recover.callCount, 0);
});

test('sequence turns a list of Oks into an Ok of a list', () => {
  eq(sequence([Ok(1), Ok(2), Ok(3)]).value, [1, 2, 3]);
  eq(sequence([]).value, [], 'nothing to fail');
});

test('sequence returns the FIRST failure, as it stands', () => {
  const first = Err('bad row 2');
  const result = sequence([Ok(1), first, Err('bad row 3')]);
  ok(result === first, 'not a new Err, not the last one');
});

test('traverse maps every item and collects the values', () => {
  eq(traverse(['1', '2', '3'], parseInteger).value, [1, 2, 3]);
  eq(traverse(['1', 'x'], parseInteger).error, 'x is not a whole number');
});

test('traverse stops calling fn after the first failure', () => {
  const parse = spy(parseInteger);
  const result = traverse(['1', 'oops', '3', '4'], parse);
  eq(result.isOk, false);
  eq(parse.callCount, 2, 'it never reached "3"');
});
