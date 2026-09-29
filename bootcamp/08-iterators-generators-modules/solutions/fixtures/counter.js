// fixture for exercise 16 — a complete, working module.
// Do not edit; just import from it.
//
// `count` is a module-level `let`, so it can change after other
// modules have imported it. That is the whole point of exercise 16.

export let count = 0;

export function increment(by = 1) {
  count += by;
  return count;
}

export function reset() {
  count = 0;
  return count;
}
