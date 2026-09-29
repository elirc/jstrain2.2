// ─────────────────────────────────────────────────────────────────────────
//  09 · a typed state machine                              ★★★ stretch
//  concepts: as const · keyof lookups · nested indexed access
//  run: node ../run.js exercises/09-typed-state-machine.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  One object describes the machine. The types read that object, so the
//  legal events per state and the resulting state are checked at compile
//  time — no enum, no switch, no drift between docs and code.
//
//      transition('idle', 'FETCH')      → 'loading'   (typed as 'loading')
//      transition('loading', 'RESOLVE') → 'ready'
//      transition('idle', 'RESOLVE')    → compile error: idle has no RESOLVE
//      canTransition('idle', 'RESOLVE') → false
//      eventsFor('loading')             → ['RESOLVE', 'REJECT']
//
//  Everything hangs off the shape of `transitions`. A plain object literal
//  widens its values to `string`, which throws away exactly the
//  information you need — fix that first, then derive:
//
//      State         the keys of the map
//      EventFor<S>   the keys of one state's entry
//      NextState<S,E> what that entry holds at E
//
//  hint: `Transitions[S][E]` is a nested indexed access, and it only
//  behaves once the map's values stay literal types

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

export const transitions = {
  idle: { FETCH: 'loading' },
  loading: { RESOLVE: 'ready', REJECT: 'failed' },
  ready: { REFRESH: 'loading', CLEAR: 'idle' },
  failed: { RETRY: 'loading', CLEAR: 'idle' },
};
// TODO ↑ this map needs one two-word assertion, or every type below is
// just `string`

export type Transitions = TODO;
export type State = TODO;
export type EventFor<S extends State> = TODO;
export type NextState<S extends State, E extends EventFor<S>> = TODO;

export function transition(state: TODO, event: TODO): TODO {
  throw new Error('TODO');
}

export function canTransition(state: TODO, event: TODO): TODO {
  throw new Error('TODO');
}

export function eventsFor(state: TODO): TODO {
  throw new Error('TODO');
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
