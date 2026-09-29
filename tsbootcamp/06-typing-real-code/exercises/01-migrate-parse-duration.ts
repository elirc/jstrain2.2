// ─────────────────────────────────────────────────────────────────────────
//  01 · parseDuration — migrate it                         ★★☆ core
//  concepts: literal unions · Record keys · type predicates
//  run: node ../run.js exercises/01-migrate-parse-duration.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  A real migration. This util already shipped in JS and it works, so the
//  runtime tests are GREEN on your first run — the red tsc output is the
//  entire exercise. This is the one flavour of TS work you will do most
//  often at a job: the behaviour is settled, the contract is not.
//
//  The JS you were handed:
//
//      const UNIT_MS = { ms: 1, s: 1000, m: 60000, h: 3600000 };
//      const isUnit = (text) => text in UNIT_MS;
//      function parseDuration(input) { /* the body below, verbatim */ }
//
//      parseDuration('30s')      → 30000
//      parseDuration('2h30m')    → 9000000
//      parseDuration('1s500ms')  → 1500
//      parseDuration('soon')     → null
//
//  Type the three exports so a caller cannot pass a number, cannot forget
//  the result may be null, and cannot invent a unit.
//
//  hint: `isUnit` wants a type predicate — that is the only thing that
//  makes `UNIT_MS[unit]` compile without an `as` cast

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

export type Unit = TODO;

const UNIT_MS: TODO = { ms: 1, s: 1000, m: 60_000, h: 3_600_000 };

export function isUnit(text: TODO): TODO {
  return text in UNIT_MS;
}

export function parseDuration(input: TODO): TODO {
  const trimmed = input.trim();
  if (trimmed === '') return null;

  let total = 0;
  let consumed = 0;
  for (const match of trimmed.matchAll(/(\d+)(ms|[smh])/g)) {
    const unit = match[2];
    if (!isUnit(unit)) return null;
    total += Number(match[1]) * UNIT_MS[unit];
    consumed += match[0].length;
  }
  // every character has to belong to a unit, or it was not a duration
  return consumed === trimmed.length ? total : null;
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('parses a single unit', () => {
  eq(parseDuration('30s'), 30_000);
});

test('sums the parts of a compound duration', () => {
  eq(parseDuration('2h30m'), 9_000_000);
});

test('matches the longest unit first, so ms beats m', () => {
  eq(parseDuration('1s500ms'), 1_500);
});

test('returns null for input it cannot parse', () => {
  eq(parseDuration('soon'), null);
  eq(parseDuration(''), null);
});

test('a bare number carries no unit, so it is not a duration', () => {
  eq(parseDuration('90'), null);
});

test('isUnit recognises the four units and nothing else', () => {
  eq(isUnit('h'), true);
  eq(isUnit('y'), false);
});

// ──────────────────────────── type tests ─────────────────────────────────

type _u1 = Expect<Equal<Unit, 'ms' | 's' | 'm' | 'h'>>;
type _u2 = Expect<Equal<ReturnType<typeof parseDuration>, number | null>>;

function _typeTests() {
  const ms: number | null = parseDuration('1h');
  use(ms);

  // @ts-expect-error — the input is a duration string, not a number
  parseDuration(1000);

  // @ts-expect-error — the result may be null, so it is not a number
  const strict: number = parseDuration('1h');
  use(strict);

  const raw: string = 'h';
  if (isUnit(raw)) {
    const narrowed: Unit = raw; // the predicate did this
    use(narrowed);
  }
}
use(_typeTests);
