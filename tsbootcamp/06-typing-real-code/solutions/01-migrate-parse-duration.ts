// ─────────────────────────────────────────────────────────────────────────
//  01 · parseDuration — migrate it — SOLUTION              ★★☆ core
//  run: node ../run.js solutions/01-migrate-parse-duration.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: three annotations carry the whole file.
//
//  `Unit` as a literal union is the source of truth; `Record<Unit, number>`
//  on UNIT_MS then makes the table and the union impossible to drift apart
//  — add 'd' to Unit and tsc demands a `d:` entry.
//
//  `isUnit(text): text is Unit` is the load-bearing one. Inside the loop
//  `match[2]` is just `string`, and tsc has no idea the regex only ever
//  produces the four units. A boolean-returning isUnit would leave you
//  writing `UNIT_MS[unit as Unit]`; the predicate narrows `unit` for real,
//  so the index is checked instead of asserted. Predicates are how you
//  hand the compiler knowledge that lives in a regex, a schema or a wire
//  format.
//
//  `number | null` in the return position is the contract: callers are
//  forced to handle the failure they would otherwise forget.

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export type Unit = 'ms' | 's' | 'm' | 'h';

const UNIT_MS: Record<Unit, number> = { ms: 1, s: 1000, m: 60_000, h: 3_600_000 };

export function isUnit(text: string): text is Unit {
  return text in UNIT_MS;
}

export function parseDuration(input: string): number | null {
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
