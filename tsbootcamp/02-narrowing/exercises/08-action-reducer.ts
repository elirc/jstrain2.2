// ─────────────────────────────────────────────────────────────────────────
//  08 · reducer                                           ★★★ stretch
//  concepts: action unions · switch on a tag · per-branch payloads
//  run: node ../run.js exercises/08-action-reducer.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  A Redux-style reducer is a discriminated union in its natural habitat.
//  Model four actions — each one carries exactly the payload it needs and
//  nothing more — then write a PURE reducer that switches on `type`.
//
//      { type: 'added', text: 'ship it' }   append a todo, bump nextId
//      { type: 'toggled', id: 1 }           flip that todo's done flag
//      { type: 'removed', id: 1 }           drop that todo
//      { type: 'clearedCompleted' }         keep only the unfinished ones
//
//  Pure means: return a NEW state, never touch the one you were given.
//  An id that matches nothing is not an error — return state unchanged.
//
//  hint: 'clearedCompleted' has no payload at all, and that is allowed —
//  a variant may be nothing but its tag.

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

function probe<T>(value: T): T {
  return value;
}

export interface Todo {
  id: number;
  text: string;
  done: boolean;
}

export interface State {
  todos: Todo[];
  nextId: number;
}

export type Action = TODO;

const seed: State = {
  todos: [
    { id: 1, text: 'write', done: false },
    { id: 2, text: 'ship', done: true },
  ],
  nextId: 3,
};

export function reducer(state: State, action: Action): State {
  throw new Error('TODO');
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('added appends a todo and bumps nextId', () => {
  const next = reducer(seed, { type: 'added', text: 'rest' });
  eq(next.todos.length, 3);
  eq(next.todos[2], { id: 3, text: 'rest', done: false });
  eq(next.nextId, 4);
});

test('added does not mutate the state it was given', () => {
  reducer(seed, { type: 'added', text: 'rest' });
  eq(seed.todos.length, 2);
  eq(seed.nextId, 3);
});

test('toggled flips exactly one todo', () => {
  const next = reducer(seed, { type: 'toggled', id: 1 });
  eq(next.todos[0].done, true);
  eq(next.todos[1].done, true);
  eq(seed.todos[0].done, false);
});

test('removed drops the matching todo', () => {
  const next = reducer(seed, { type: 'removed', id: 2 });
  eq(next.todos.map((t) => t.id), [1]);
});

test('an id that matches nothing changes nothing', () => {
  const next = reducer(seed, { type: 'toggled', id: 99 });
  eq(next.todos, seed.todos);
});

test('clearedCompleted keeps only the unfinished todos', () => {
  const next = reducer(seed, { type: 'clearedCompleted' });
  eq(next.todos.map((t) => t.id), [1]);
  eq(next.nextId, 3);
});

// ──────────────────────────── type tests ─────────────────────────────────

type _r1 = Expect<
  Equal<Action['type'], 'added' | 'toggled' | 'removed' | 'clearedCompleted'>
>;

function _typeTests() {
  const action = undefined as unknown as Action;

  switch (action.type) {
    case 'added': {
      const p = probe(action.text);
      type _text = Expect<Equal<typeof p, string>>;
      use(p);

      // @ts-expect-error — 'added' carries text, not an id
      action.id;
      break;
    }
    case 'toggled': {
      const p = probe(action.id);
      type _id = Expect<Equal<typeof p, number>>;
      use(p);
      break;
    }
    case 'clearedCompleted': {
      // @ts-expect-error — this action carries no payload at all
      action.id;
      break;
    }
  }

  // @ts-expect-error — 'added' is missing its text payload
  reducer(seed, { type: 'added' });

  // @ts-expect-error — 'renamed' is not an action type
  reducer(seed, { type: 'renamed', id: 1, text: 'x' });
}
use(_typeTests);
