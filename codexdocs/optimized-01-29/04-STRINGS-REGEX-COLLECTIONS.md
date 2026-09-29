# 04 — Strings, regex, collections, and dates

## Outcome

Parse and format text deliberately, use regular expressions within safe
limits, and choose Map, Set, and UTC date operations correctly.

## The 80/20 model

Strings are Unicode sequences, not necessarily user-perceived characters.
Normalize only when the product needs it. Parsing should define accepted
grammar, reject trailing junk, and return useful failure positions when that
helps users or operators.

Regex is good for local lexical structure. It is poor for deeply nested
formats and dangerous when ambiguous repetition meets attacker-sized input.
Anchor validators, bound input, and prefer simple passes when correctness is
clearer.

Use Map for key/value identity and Set for membership/uniqueness. Represent
timestamps as instants and format at edges. Use UTC arithmetic for system
schedules unless local-calendar behavior is explicitly required.

## Common traps

- Global regex reused with surprising `lastIndex`.
- Unanchored validation accepting a valid substring.
- Catastrophic backtracking on unbounded input.
- Code-unit slicing splitting emoji.
- Local-time date arithmetic around daylight-saving changes.

## Optimized exercises

1. **Parser:** parse `key=value` filters with escaping, duplicates, invalid
   pairs, and useful diagnostics; compare regex and manual scan designs.
2. **Collections:** build a case-normalized tag index with Map/Set and state
   the Unicode/collision policy.
3. **Application:** implement and test RelayDesk activity-date grouping in UTC,
   including midnight boundaries and invalid timestamps.

## Exit gate

State when regex, a parser, Map, Set, UTC instant, and local calendar are the
right model—and one failure caused by choosing each incorrectly.

More reps: `../../bootcamp/04-strings-regex-collections/`.

