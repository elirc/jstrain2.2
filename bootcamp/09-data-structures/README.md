# 09 · Data Structures

Every data structure is a bet. You make one operation cheap by making
another expensive, and the whole skill is knowing which operation your
code actually does in a loop. An array is a fantastic default until you
`shift()` a million times; an object is a fine lookup table until you need
the keys in order. This module builds ten structures from scratch — stack,
queue, ring buffer, linked list, hash map, BST, tree, heap, LRU cache,
graph — small enough to hold in your head, tested method by method, each
one landing on a realistic mini-problem so it never stays academic.

## The mental model

**1. Choose by the operation you repeat, not by the data you hold.**
Write down what your hot loop does — "insert at the front", "find the
minimum", "check membership", "read in sorted order" — and pick the
structure that makes that O(1) or O(log n). Everything else is detail.

```js
const seen = new Set(ids);           // membership: O(1) per check
ids.includes(x);                     // membership on an array: O(n)
```

**2. Stacks and queues are not containers, they are access rules.**
Both are an array underneath. LIFO means you only touch one end; FIFO
means you add at one end and take from the other. The rule is the whole
value: it makes the code obviously correct and the cost obviously O(1).

```js
stack.push(x); stack.pop();          // both ends the same → O(1)
queue.push(x); queue.shift();        // shift reindexes everything → O(n)
```

**3. Contiguous vs linked is the trade behind half of these.**
An array knows where element 5 is by arithmetic, but inserting in the
middle slides everything after it. A linked structure (list, tree, graph)
reaches its elements by following references: no random access, but
splicing is two pointer writes once you are standing at the right spot.

```js
arr.splice(2, 0, 'x');               // O(1) to find, O(n) to insert
node.next = other;                   // O(n) to find, O(1) to insert
```

**4. Hashing turns a key into an array index.**
That is the entire trick behind `Map`, `Set`, and objects: run the key
through a function that spits out a number, use it as a bucket index, then
scan the two or three entries that happened to land there.

```js
const i = hash('sky') % buckets.length;   // O(1) to reach the bucket
buckets[i].push(['sky', 'blue']);         // collisions live together
```

## The details that bite

1. **`shift()` and `unshift()` are O(n).** Every remaining element gets a
   new index. Draining a queue of n items with `shift()` costs O(n²) —
   keep a `head` index instead and never move anything.
   ```js
   const v = items[head]; head += 1;      // O(1) dequeue
   ```
2. **`Map` iterates in insertion order — exploit it.** That is what makes
   an LRU cache 20 lines instead of a hash map plus a doubly linked list.
   ```js
   [...new Map([['b',1],['a',2]]).keys()]   // → ['b', 'a'], not sorted
   ```
3. **Re-setting an existing Map key does NOT move it to the end.** Delete
   first if you mean "this is the freshest one now".
   ```js
   m.delete(k); m.set(k, v);   // now k is last; m.set(k, v) alone is not
   ```
4. **`sort()` with no comparator sorts as strings.** Silent, and wrong for
   every numeric ranking you will ever write.
   ```js
   [10, 9, 1].sort()               // → [1, 10, 9]
   [10, 9, 1].sort((a, b) => a - b)  // → [1, 9, 10]
   ```
5. **`new Array(n).fill([])` shares ONE array across every slot.** Pushing
   into bucket 0 pushes into all of them. Build each slot separately.
   ```js
   Array.from({ length: n }, () => [])   // n distinct arrays
   ```
6. **A plain object is not a clean dictionary.** It inherits keys you
   never set; `Map` and `Object.create(null)` do not.
   ```js
   'toString' in {}                // → true
   ```
7. **A BST fed sorted data becomes a linked list.** Ids, timestamps and
   autoincrement keys arrive sorted, and every "O(log n)" lookup quietly
   turns into O(n). Measure with `height()` — that is exercise 15.
8. **Recursion depth is a real limit.** DFS on a 10,000-deep chain
   overflows the call stack; rewrite it with an explicit stack array when
   the depth is unbounded.
9. **Objects and arrays compare by identity.** `[1] === [1]` is false, and
   a Map keyed by objects looks up the reference, not the contents — two
   equal-looking keys are two different entries.

## Cheat table

| structure | fast at | cost of that | typical use |
| --- | --- | --- | --- |
| array | index read O(1), push/pop O(1) | insert/remove at front O(n) | everything, by default |
| stack | push/pop/peek O(1) | no random access | nesting, undo, backtracking |
| queue (head index) | enqueue/dequeue O(1) | dead prefix until compacted | jobs, BFS, spoolers |
| circular buffer | push O(1), fixed memory | overwrites the oldest | last-N logs, samples |
| linked list | splice at a known node O(1) | find index i O(i), no `[i]` | editor buffers, free lists |
| hash map | get/set/has/delete O(1) avg | unordered, O(n) worst case | lookups by key |
| BST (balanced) | insert/contains O(log n), sorted read O(n) | O(n) if it degenerates | ordered sets, index ranges |
| binary heap | peek min O(1), insert/extract O(log n) | only the root is ordered | priority queues, top-K |
| LRU cache (Map) | get/set O(1) with eviction | bounded — it forgets | caches with a budget |
| graph (adjacency list) | neighbours O(1), BFS/DFS O(V+E) | "are a,b linked?" is O(degree) | routes, deps, social |

## Exercises

| # | file | ★ | what you build |
| --- | --- | --- | --- |
| 01 | `01-stack.js` | ★☆☆ | `Stack` class: push/pop/peek/size/isEmpty |
| 02 | `02-balanced-brackets.js` | ★★☆ | `{[()]}` checker over a code snippet |
| 03 | `03-undo-history.js` | ★★☆ | generic undo stack behind Ctrl+Z |
| 04 | `04-queue.js` | ★★☆ | O(1) queue with a head index, no `shift()` |
| 05 | `05-queue-two-stacks.js` | ★★★ | FIFO built from two LIFOs, amortised O(1) |
| 06 | `06-round-robin.js` | ★★☆ | pure round-robin scheduler over a task list |
| 07 | `07-circular-buffer.js` | ★★★ | fixed-capacity ring that overwrites the oldest |
| 08 | `08-linked-list-basics.js` | ★☆☆ | nodes, `push` via a tail pointer, `toArray` |
| 09 | `09-linked-list-edit.js` | ★★☆ | `find` / `insertAt` / `removeAt` pointer surgery |
| 10 | `10-linked-list-reverse.js` | ★★★ | reverse in place, same nodes, one pass |
| 11 | `11-string-hash.js` | ★☆☆ | djb2 string hash + bucket index |
| 12 | `12-hash-map.js` | ★★★ | buckets, collisions, set/get/has/delete |
| 13 | `13-bst-insert.js` | ★★☆ | BST `insert` + `contains` |
| 14 | `14-bst-in-order.js` | ★★☆ | in-order traversal → sorted array |
| 15 | `15-bst-stats.js` | ★★☆ | `min` / `max` / `height`, and why balance matters |
| 16 | `16-tree-traversals.js` | ★★☆ | depth-first vs breadth-first on nested objects |
| 17 | `17-tree-find-path.js` | ★★☆ | path from root to a node (breadcrumbs) |
| 18 | `18-min-heap.js` | ★★★ | min-heap / priority queue, sift up and down |
| 19 | `19-top-k.js` | ★★★ | top-K in O(n log k) with a size-k heap |
| 20 | `20-lru-cache.js` | ★★★ | capacity-bounded cache, precise eviction order |
| 21 | `21-graph-build.js` | ★☆☆ | adjacency list from an edge list, neighbours |
| 22 | `22-graph-search.js` | ★★★ | BFS order, shortest path, directed cycle check |

Do the warm-ups and core in order — 01→22 is a build-up, and later files
hand you the structures from earlier ones as scaffolding. Stretch if time
allows; 05, 12, 18 and 22 are the ones that show up in interviews.

### Extra reps

Twenty more, and deliberately the harder half: the deeper cuts of the
structures above, plus the four that only appear once you combine them —
trie, union-find, Dijkstra, topological sort. Every solution states the
big-O of its key operations and why that structure wins.

| # | file | ★ | what you build |
| --- | --- | --- | --- |
| 23 | `23-linked-list-middle.js` | ★☆☆ | the middle node in one pass, fast and slow |
| 24 | `24-linked-list-merge.js` | ★★☆ | merge two sorted lists by splicing nodes |
| 25 | `25-linked-list-cycle.js` | ★★★ | Floyd cycle detection, and where the loop starts |
| 26 | `26-linked-list-palindrome.js` | ★★☆ | palindrome check in O(1) space, list restored |
| 27 | `27-min-stack.js` | ★★★ | a stack with O(1) `getMin` |
| 28 | `28-sliding-window-max.js` | ★★★ | window maxima with a monotonic deque |
| 29 | `29-rpn-shunting-yard.js` | ★★★ | evaluate postfix + infix→postfix (shunting yard) |
| 30 | `30-bst-validate.js` | ★★☆ | validate a BST with min/max bounds |
| 31 | `31-bst-queries.js` | ★★☆ | kth smallest with an early exit + closest value |
| 32 | `32-bst-delete.js` | ★★★ | delete a node, all three cases |
| 33 | `33-max-heap.js` | ★☆☆ | max-heap — the same code, comparison flipped |
| 34 | `34-heapify.js` | ★★☆ | O(n) in-place heapify, then heapsort |
| 35 | `35-merge-k-sorted.js` | ★★★ | merge k sorted arrays in O(N log k) |
| 36 | `36-trie-basics.js` | ★★☆ | trie: `insert` / `search` / `startsWith` |
| 37 | `37-trie-autocomplete.js` | ★★★ | ranked top-N suggestions for a prefix |
| 38 | `38-union-find.js` | ★★★ | disjoint set: path compression + union by rank |
| 39 | `39-union-find-groups.js` | ★★☆ | cycles and components over an edge list |
| 40 | `40-dijkstra.js` | ★★★ | cheapest weighted route, min-heap as the frontier |
| 41 | `41-topological-sort.js` | ★★★ | Kahn's algorithm + course scheduling |
| 42 | `42-intervals.js` | ★★☆ | merge overlapping intervals, insert into a sorted list |

23→26 share one trick (two pointers at different speeds), 33→34→35 and
38→39 are pairs — do each run back to back. If you are prepping for
interviews, 25, 27, 28, 32, 35, 37, 38, 40 and 41 are the regulars.

Run one file at a time:

```
node exercises/01-stack.js       # ☐ todo until you write the code
node solutions/01-stack.js       # the worked answer + walkthrough
node ../progress.js 09           # your scoreboard for this module
```

---

**Stuck?** `cheatsheets/big-o.md` (structure costs, the interview playbook) · **Deep dive:** `guides/03-values-references-and-memory.md` · **Self-check:** `quizzes/07-data-structures-algorithms.md` · **Next:** `bootcamp/10-algorithms-and-patterns`
