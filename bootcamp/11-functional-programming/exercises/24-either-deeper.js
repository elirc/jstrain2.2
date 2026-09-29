// ─────────────────────────────────────────────────────────────────────────
//  24 · Either, deeper                                       ★★★ stretch
//  concepts: Either · error channels · short-circuiting
//  run: node 24-either-deeper.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A Maybe loses the reason. An Either keeps it: Ok(value) or Err(error),
//  and `map`/`chain` work on the Ok side only. That leaves four moves the
//  happy path never needs — and they are the ones real code lives on.
//
//      mapError(either, fn)   rewrite the error, leave an Ok untouched
//          mapError(Err('ENOENT'), (e) => `config: ${e}`)
//
//      orElse(either, fn)     recover: fn(error) returns another Either
//          orElse(Err('no cache'), () => Ok(defaultConfig))   → Ok(...)
//
//      sequence(eithers)      [Ok(1), Ok(2)]        → Ok([1, 2])
//                             [Ok(1), Err('x')]     → that same Err
//
//      traverse(items, fn)    map each item to an Either, then sequence
//          traverse(['1', '2'], parse)              → Ok([1, 2])
//
//  Both sequence and traverse SHORT-CIRCUIT: the first failure wins and is
//  handed back as-is. traverse must not call fn on anything after it.
//
//  hint: traverse is not `sequence(items.map(fn))` — that runs fn on every
//  item before it looks at any of them. Fold instead, and bail.

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
  throw new Error('TODO');
}

export function orElse(either, fn) {
  throw new Error('TODO');
}

export function sequence(eithers) {
  throw new Error('TODO');
}

export function traverse(items, fn) {
  throw new Error('TODO');
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
