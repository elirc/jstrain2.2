# 03 · Arrays and Objects

This is the module that decides whether you look fluent. Nearly all
application code is a list of things being reshaped, narrowed, grouped,
sorted and handed to something else — and nearly every interview asks you
to do that live, without autocomplete. Twenty-eight drills here: the seven
array methods you use hourly, `reduce` ramped from `sum` to reimplementing
`map`, comparators, the copy-vs-mutate distinction that causes the worst
bugs in a React codebase, and the object/JSON helpers you have been
importing from lodash without ever writing.

Run any file directly:

```
node exercises/01-map-basics.js     # all tests report "todo"
node solutions/01-map-basics.js     # all green
```

## The mental model

**1. Three shapes cover almost everything.** One-in-one-out is `map`,
keep-or-drop is `filter`, many-into-one is `reduce`. `find`, `some`,
`every`, `flatMap`, `groupBy`, `countBy` are all special cases of that
third one.

```js
[1, 2, 3].map((n) => n * 2);              // [2, 4, 6]
[1, 2, 3].filter((n) => n > 1);           // [2, 3]
[1, 2, 3].reduce((a, n) => a + n, 0);     // 6
```

**2. Most methods copy; a short list mutates.** `map`/`filter`/`slice`/
`concat` hand you a new array. `sort`/`reverse`/`splice`/`push`/`fill`
edit the array you gave them and are the ones that leak bugs into your
caller. Copy first — spread, `slice()`, or the `toSorted`/`toReversed`/
`toSpliced`/`with` family.

```js
const prices = [3, 1, 2];
const sorted = [...prices].sort((a, b) => a - b);  // prices untouched
```

**3. Objects are references, and every built-in copy is shallow.** A
spread copies the top layer only; the nested objects are shared with the
original.

```js
const a = { user: { name: 'Ada' } };
const b = { ...a };
b.user === a.user;    // true — change b.user.name and a sees it
```

**4. Objects have no array methods — round-trip through entries.**
`Object.entries` down, array methods in the middle, `Object.fromEntries`
back up.

```js
const doubled = Object.fromEntries(
  Object.entries({ a: 1, b: 2 }).map(([k, v]) => [k, v * 2])
); // { a: 2, b: 4 }
```

## The details that bite

1. **`sort` compares strings by default.** `[10, 9, 1].sort()` → `[1, 10, 9]`.
   Always pass `(a, b) => a - b` for numbers.
2. **A comparator must return a number, not a boolean.** `(a, b) => a > b`
   coerces `true`/`false` to `1`/`0` — "b comes first" can never be said.
3. **`sort` is stable** (guaranteed since ES2019), so ties keep their
   original order — which is what makes multi-key sorting work.
4. **`splice` returns the REMOVED items**, not the array:
   `[1, 2, 3].splice(0, 1)` → `[1]`, and the source is now `[2, 3]`.
5. **`reduce` with no initial value throws on an empty array**, and
   otherwise silently seeds the accumulator with element 0.
6. **`[].every(fn)` is `true`.** An empty cart passes every validation you
   write with `every`.
7. **`includes` finds `NaN`; `indexOf` does not.**
   `[NaN].includes(NaN)` → `true`, `[NaN].indexOf(NaN)` → `-1`.
8. **`new Array(3)` makes three holes, not three undefineds** — `map` and
   `forEach` skip holes entirely. `new Array(3).fill(0)` fixes it.
9. **`fill` with an object shares one reference.**
   `new Array(2).fill([])` → both slots are the SAME array.
10. **Spread and `Object.assign` are shallow**, and
    `Object.assign(target, src)` mutates `target` — always pass a fresh `{}`.
11. **JSON drops things.** `undefined`, functions and symbols vanish from
    objects but become `null` inside arrays; `Date` becomes a string;
    a circular reference throws.
12. **`Object.keys` sorts integer-like keys first**, in ascending numeric
    order: `Object.keys({ b: 1, 2: 1, a: 1, 1: 1 })` → `['1','2','b','a']`.
13. **`Object.groupBy` returns a null-prototype object**, so it is not
    deep-equal to a plain `{}` and has no `toString`.
14. **`structuredClone` is the real deep copy** — it keeps Dates, Maps and
    cycles, but throws on functions and loses class prototypes.

## Cheat table

| method | mutates? | returns | reach for it when |
| --- | --- | --- | --- |
| `map` | no | new array, same length | reshaping every item |
| `filter` | no | new array, ≤ length | dropping items |
| `find` / `findLast` | no | item or `undefined` | you want one item |
| `findIndex` | no | index or `-1` | you want a position |
| `some` / `every` | no | boolean | asking a yes/no question |
| `includes` | no | boolean | membership (finds `NaN`) |
| `indexOf` | no | index or `-1` | position of a value (misses `NaN`) |
| `reduce` | no | anything you seed | folding a list into one value |
| `flat` / `flatMap` | no | new array | nesting, or one-to-many mapping |
| `slice` | no | new array | copying a window |
| `concat` / `[...a, ...b]` | no | new array | joining lists |
| `join` | no | string | collapsing to text |
| `at` | no | item or `undefined` | negative indexing (`at(-1)`) |
| `sort` | **yes** | the same array | ordering — copy first |
| `reverse` | **yes** | the same array | flipping — copy first |
| `splice` | **yes** | the removed items | in-place edits — prefer slices |
| `push` / `pop` / `shift` | **yes** | length / the item | stacks and queues |
| `fill` | **yes** | the same array | seeding a fresh array |
| `toSorted` / `toReversed` / `toSpliced` / `with` | no | new array | the copying versions (Node 20+) |
| `Object.keys/values/entries` | no | array | iterating an object |
| `Object.fromEntries` | no | new object | pairs back into an object |
| `Object.assign(t, …)` | **mutates `t`** | `t` | merging — pass `{}` as `t` |
| `structuredClone` | no | deep copy | cloning nested data for real |

## Exercises

| # | file | ★ | what you build |
| --- | --- | --- | --- |
| 01 | `01-map-basics.js` | ★☆☆ | `names`, `priceTags`, `numbered` — projecting with `map` |
| 02 | `02-filter-basics.js` | ★☆☆ | `inStock`, `atMost`, `inCategory` — predicates |
| 03 | `03-find-and-findindex.js` | ★☆☆ | `findById`, `indexOfCategory`, `lastUnder` |
| 04 | `04-some-every-includes.js` | ★☆☆ | `hasOutOfStock`, `allUnder`, `carries` |
| 05 | `05-chained-pipelines.js` | ★★☆ | filter → map → join chains that end in a string or a boolean |
| 06 | `06-reduce-sum-max.js` | ★☆☆ | `sum`, `average`, `priciest` — the initial value |
| 07 | `07-count-by.js` | ★★☆ | `countBy` — tallying into an object |
| 08 | `08-group-by.js` | ★★☆ | `groupBy` — buckets of items |
| 09 | `09-key-by.js` | ★★☆ | `keyBy`, `keyByFirst` — lookups and key collisions |
| 10 | `10-reduce-to-summary.js` | ★★☆ | `summarize`, `totalsByCategory` — one-pass aggregation |
| 11 | `11-map-filter-via-reduce.js` | ★★★ | `mapWith`, `filterWith`, `someWith` built from `reduce` |
| 12 | `12-sort-numbers.js` | ★☆☆ | `ascending`, `descending` — and the `'10' < '9'` trap |
| 13 | `13-sort-by-field.js` | ★★☆ | sorting objects by number and by `localeCompare` |
| 14 | `14-sort-without-mutating.js` | ★★☆ | `sortedCopy`, `topN`, `reversedCopy` on frozen inputs |
| 15 | `15-sort-by-specs.js` | ★★★ | `sortBy(items, ['category', '-price'])` comparator factory |
| 16 | `16-flat-and-flatmap.js` | ★★☆ | `flattenOnce`, `flattenDeep`, `wordsOf`, `compactMap` |
| 17 | `17-slice-vs-splice.js` | ★★☆ | `removeAt`, `insertAt`, `replaceAt` without mutating |
| 18 | `18-unique-and-set-ops.js` | ★★☆ | `unique`, `uniqueBy`, `intersection`, `difference` |
| 19 | `19-chunk-range-rotate.js` | ★★☆ | `range`, `chunk`, `rotate` |
| 20 | `20-zip-and-partition.js` | ★★☆ | `zip`, `zipObject`, `partition` |
| 21 | `21-array-from-tricks.js` | ★☆☆ | `zeros`, `squares`, `chars`, `toArray` |
| 22 | `22-mapvalues-and-invert.js` | ★★☆ | `mapValues`, `filterObject`, `invert` |
| 23 | `23-pick-omit-merge.js` | ★★☆ | `pick`, `omit`, shallow `merge` |
| 24 | `24-deep-clone.js` | ★★★ | `structuredClone` plus a hand-rolled recursive clone |
| 25 | `25-set-in.js` | ★★★ | `getIn`, `setIn` — nested immutable updates |
| 26 | `26-json-round-trip.js` | ★★☆ | `pretty`, `roundTrip`, `parseWithDates` |
| 27 | `27-safe-stringify.js` | ★★★ | `safeStringify` — surviving circular references |
| 28 | `28-deep-equal.js` | ★★★ | `deepEqual` for primitives, arrays and objects |

Do the warm-ups and core in order. Stretch if time allows — but do 11,
24, 25 and 28 even if you skip the rest of the stretch tier: those four
are the ones that get asked out loud.

### Extra reps

Twenty-six more drills on the same muscles, for a second lap or the week
before an interview. Fresh domains — gym sessions, library loans, weather
readings, playlists, invoices — and the shapes that real product code is
actually made of: joins, pivots, entity stores, diffs, admin tables.

| # | file | ★ | what you build |
| --- | --- | --- | --- |
| 29 | `29-running-balance.js` | ★★☆ | `runningBalance`, `withBalances`, `lowestPoint` — a fold whose accumulator is the output list |
| 30 | `30-min-max-by-field.js` | ★☆☆ | `maxBy`, `minBy`, `extentBy` — returning the item, not the number |
| 31 | `31-nested-grouping.js` | ★★☆ | `groupByTwo`, `countByTwo` — a branch → genre tree |
| 32 | `32-reduce-into-a-map.js` | ★★☆ | `groupToMap`, `sumToMap`, `mapToObject` — keys that stay numbers |
| 33 | `33-pivot-table.js` | ★★★ | `pivot` — a dense rows × cols grid with both margins |
| 34 | `34-weighted-average.js` | ★★☆ | `plainAverage`, `weightedAverage` — two totals and the 0/0 guard |
| 35 | `35-top-n-by.js` | ★★☆ | `topBy`, `bottomBy`, `topByWithin` — top N, and top N per group |
| 36 | `36-findlast-and-at.js` | ★☆☆ | `latestOk`, `lastStaleIndex`, `edges` — searching from the back |
| 37 | `37-tospliced-and-with.js` | ★★☆ | queue edits with `with`, `toSpliced`, `toReversed` |
| 38 | `38-sparse-arrays-and-holes.js` | ★☆☆ | `recordedDays`, `visitedDays`, `denseCopy`, `blankWeek` |
| 39 | `39-inner-join.js` | ★★☆ | `innerJoin` — a hash join over two arrays of objects |
| 40 | `40-left-join.js` | ★★★ | `leftJoin`, `antiJoin` — nulls, row multiplication, orphans |
| 41 | `41-normalize-entities.js` | ★★☆ | `normalize`, `upsert`, `removeById` — the `{ byId, allIds }` store |
| 42 | `42-denormalize-entities.js` | ★★☆ | `hydrate`, `denormalize`, `renormalize` — back to a tree and out again |
| 43 | `43-deep-merge-strategies.js` | ★★★ | `deepMerge` with replace / concat / union array rules |
| 44 | `44-object-diff.js` | ★★★ | `diff` → `{ added, removed, changed }`, plus `hasChanges` |
| 45 | `45-flatten-unflatten-paths.js` | ★★★ | `flattenPaths`, `unflattenPaths` — dotted keys, both directions |
| 46 | `46-rename-and-prefix-keys.js` | ★☆☆ | `renameKeys`, `prefixKeys`, `mapKeys` — and the collision rule |
| 47 | `47-filter-builder.js` | ★★☆ | `buildFilter`, `search` — one predicate from a query object |
| 48 | `48-table-pipeline.js` | ★★★ | `tableView` — filter → sort → paginate, with honest totals |
| 49 | `49-stable-sort-reliance.js` | ★★☆ | `sortByKey`, `multiPass`, `compound` — what stability buys you |
| 50 | `50-binary-search-insert.js` | ★★☆ | `lowerBound`, `insertSorted` — O(log n) placement |
| 51 | `51-histogram-buckets.js` | ★★☆ | `bucketOf`, `histogram` — dense buckets, negatives included |
| 52 | `52-percentile-lite.js` | ★★☆ | `median`, `percentile` — nearest rank, and why they disagree |
| 53 | `53-dedupe-first-vs-last.js` | ★☆☆ | `dedupeFirst`, `dedupeLast`, `duplicates` — which copy wins |
| 54 | `54-chunked-processing.js` | ★★☆ | `chunkWithIndex`, `globalIndex`, `processInBatches` |

Short on time? Do 29, 31, 33, 39, 40, 44 and 48 — running totals, nested
grouping, pivots, joins, diffs and the admin-table kata cover most of what
a data-shaping interview or a Tuesday ticket will ask for. The join pair
(39, 40) is the same thinking `bootcamp/22-sql-joins` does in SQL; doing
both is how the two stop feeling like different subjects.

---

**Stuck?** `cheatsheets/array-methods.md` (mutating↔copying pairs, the recipes) · `cheatsheets/object-map-set.md` (object-vs-Map, cloning) · **Deep dive:** `guides/03-values-references-and-memory.md` · **Self-check:** `quizzes/03-arrays-objects.md` · **Next:** `bootcamp/04-strings-regex-collections`

FLIGHTPLAN.md jumps from here straight to `bootcamp/07-async-mastery` and picks 04 up later — either order works.
