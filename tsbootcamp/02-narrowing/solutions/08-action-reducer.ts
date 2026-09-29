// ─────────────────────────────────────────────────────────────────────────
//  08 · reducer — SOLUTION                                ★★★ stretch
//  run: node ../run.js solutions/08-action-reducer.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the union is the API contract. `{ type: 'toggled'; id }`
//  and `{ type: 'added'; text }` are different types, so inside
//  `case 'toggled'` the compiler hands you `id` and refuses `text`. No
//  optional members, no `payload?: any`, no runtime "did they send an
//  id?" check — the switch does the work.
//
//  Two habits worth copying:
//
//  1. Each `case` gets its own block with `return`. Returning (rather
//     than assigning and breaking) keeps every branch a separate flow,
//     which is what lets narrowing hold inside it.
//  2. `clearedCompleted` has NO payload. Resist the urge to give every
//     action the same shape — a union's whole value is that the variants
//     are allowed to differ.
//
//  The `default: return state` is a runtime safety net for actions that
//  arrive from outside the type system (a stale client, a devtools
//  replay). Exercise 09 shows the version that also fails the BUILD when
//  a new variant is added.

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

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

export type Action =
  | { type: 'added'; text: string }
  | { type: 'toggled'; id: number }
  | { type: 'removed'; id: number }
  | { type: 'clearedCompleted' };

const seed: State = {
  todos: [
    { id: 1, text: 'write', done: false },
    { id: 2, text: 'ship', done: true },
  ],
  nextId: 3,
};

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'added': {
      const todo: Todo = {
        id: state.nextId,
        text: action.text,
        done: false,
      };
      return { todos: [...state.todos, todo], nextId: state.nextId + 1 };
    }
    case 'toggled': {
      const todos = state.todos.map((todo) =>
        todo.id === action.id ? { ...todo, done: !todo.done } : todo
      );
      return { ...state, todos };
    }
    case 'removed': {
      const todos = state.todos.filter((todo) => todo.id !== action.id);
      return { ...state, todos };
    }
    case 'clearedCompleted': {
      const todos = state.todos.filter((todo) => !todo.done);
      return { ...state, todos };
    }
    default:
      return state;
  }
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
