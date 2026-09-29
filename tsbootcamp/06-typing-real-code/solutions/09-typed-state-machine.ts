// ─────────────────────────────────────────────────────────────────────────
//  09 · a typed state machine — SOLUTION                   ★★★ stretch
//  run: node ../run.js solutions/09-typed-state-machine.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `as const` is the whole trick. Without it the object's
//  type is `{ idle: { FETCH: string }, ... }` and `NextState<'idle',
//  'FETCH'>` is `string` — technically correct, completely useless. With
//  it, every value stays a literal and the map becomes a lookup table the
//  type system can read.
//
//  From there it is three indexed accesses:
//    State          = keyof Transitions
//    EventFor<S>    = keyof Transitions[S]
//    NextState<S,E> = Transitions[S][E]
//
//  and `transition<S extends State, E extends EventFor<S>>` ties them
//  together: E's constraint DEPENDS on S, which is what makes
//  `transition('idle', 'RESOLVE')` illegal while `transition('loading',
//  'RESOLVE')` is fine. Two states sharing the event name `CLEAR` is no
//  problem — each lookup is scoped to its own state.
//
//  Note the two different jobs: `transition` is for events you already
//  know at compile time; `canTransition` takes a plain `string` because
//  real events arrive from a socket or a click handler. Same table, two
//  doors — one checked by the compiler, one checked at runtime.
//
//  `eventsFor` needs an assertion on `Object.keys`, which is typed
//  `string[]` by design (an object can always have more keys at runtime
//  than its type admits). Here the object is a frozen literal we own, so
//  the assertion is safe.

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export const transitions = {
  idle: { FETCH: 'loading' },
  loading: { RESOLVE: 'ready', REJECT: 'failed' },
  ready: { REFRESH: 'loading', CLEAR: 'idle' },
  failed: { RETRY: 'loading', CLEAR: 'idle' },
} as const;

export type Transitions = typeof transitions;
export type State = keyof Transitions;
export type EventFor<S extends State> = keyof Transitions[S];
export type NextState<S extends State, E extends EventFor<S>> = Transitions[S][E];

export function transition<S extends State, E extends EventFor<S>>(
  state: S,
  event: E
): NextState<S, E> {
  return transitions[state][event];
}

export function canTransition(state: State, event: string): boolean {
  return Object.hasOwn(transitions[state], event);
}

export function eventsFor<S extends State>(state: S): Array<EventFor<S> & string> {
  return Object.keys(transitions[state]) as Array<EventFor<S> & string>;
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('a single step follows the map', () => {
  eq(transition('idle', 'FETCH'), 'loading');
  eq(transition('loading', 'RESOLVE'), 'ready');
});

test('a whole session walks through the machine', () => {
  const loading = transition('idle', 'FETCH');
  const failed = transition(loading, 'REJECT');
  const retrying = transition(failed, 'RETRY');
  const ready = transition(retrying, 'RESOLVE');
  eq([loading, failed, retrying, ready], ['loading', 'failed', 'loading', 'ready']);
});

test('two states can share an event name and still differ', () => {
  eq(transition('ready', 'CLEAR'), 'idle');
  eq(transition('failed', 'CLEAR'), 'idle');
  eq(transition('ready', 'REFRESH'), 'loading');
});

test('canTransition answers for events that came in as plain strings', () => {
  eq(canTransition('idle', 'FETCH'), true);
  eq(canTransition('idle', 'RESOLVE'), false);
  eq(canTransition('loading', 'nonsense'), false);
});

test('eventsFor lists what a state accepts', () => {
  eq(eventsFor('loading'), ['RESOLVE', 'REJECT']);
  eq(eventsFor('idle'), ['FETCH']);
});

// ──────────────────────────── type tests ─────────────────────────────────

type _s1 = Expect<Equal<State, 'idle' | 'loading' | 'ready' | 'failed'>>;
type _s2 = Expect<Equal<EventFor<'ready'>, 'REFRESH' | 'CLEAR'>>;
type _s3 = Expect<Equal<NextState<'loading', 'RESOLVE'>, 'ready'>>;
type _s4 = Expect<Equal<NextState<'failed', 'RETRY'>, 'loading'>>;

function _typeTests() {
  const next: 'ready' = transition('loading', 'RESOLVE');
  use(next);

  // @ts-expect-error — RESOLVE is not an event of idle
  transition('idle', 'RESOLVE');

  // @ts-expect-error — 'done' is not a state
  transition('done', 'FETCH');

  // @ts-expect-error — the machine has no CANCEL event anywhere
  transition('loading', 'CANCEL');
}
use(_typeTests);
