# 16 · Node CLI Tooling

The tools you use all day — `git`, `npm`, `docker`, `grep` — are the same
handful of moves repeated: read argv, read stdin, print something aligned,
exit with a number. Nothing in that list needs a dependency. This module
builds a polished CLI out of nothing but Node builtins: a git-style
subcommand parser, a `.env` reader, ANSI colour, aligned tables, tree and
progress rendering, testable prompts, Unix-filter plumbing, exit-code
conventions, config discovery and a scaffolder. The real lesson is
narrower than the topic list: a command-line tool is a **pure core with
streams at the edges**, and the difference between code you can test and
code you can only run by hand is which of those edges you passed in as an
argument.

## The mental model

**1 · Inject every edge.** A function that reads `process.stdin`, calls
`Date.now()` or touches `process.argv` can only be tested by launching a
process. The same function with those things as parameters is an ordinary
unit test.

```js
// untestable                      // testable — same code, edges passed in
function run() {                   function run(argv, { stdin, out, now }) {
  const a = process.argv.slice(2);   ...
  process.stdout.write(...);       }
}
// main.js is the only file that knows about the real ones:
process.exitCode = await run(process.argv.slice(2),
  { stdin: process.stdin, out: process.stdout, now: Date.now });
```

Every exercise here follows that rule, which is why all 231 tests run in
memory with no child process and no temp terminal.

**2 · Rendering is string math, in two passes.** Measure everything, then
draw. You cannot print the first row of a table until you have seen the
last one, because that row might hold the widest cell.

```js
const width = Math.max(...rows.map((r) => r.name.length));
rows.map((r) => r.name.padEnd(width));   // pass 2 uses what pass 1 learned
```

**3 · The contract with the shell is four things.** stdin, stdout, stderr
and an exit code. Data goes to stdout so it can be piped; everything a
human reads — progress, warnings, errors — goes to stderr so it survives
`tool > out.txt`. The number is how `&&`, `make` and CI find out whether
you worked.

```js
out.write(JSON.stringify(result));  // the answer
err.write('warning: 2 skipped\n');  // the commentary
return 0;                           // 0 = fine, anything else = not
```

**4 · A stream filter is a function of (input, output).** Read lines,
write lines, resolve when the input ends. That one shape is `nl`, `grep`,
`wc`, `sed` and every log processor you will ever write.

```js
for await (const line of createInterface({ input, crlfDelay: Infinity })) {
  if (line.includes(needle)) output.write(`${line}\n`);
}
```

## The details that bite

1. **`argv[0]` is node and `argv[1]` is your script.** Your arguments start
   at 2. `node app.js build` → `process.argv.slice(2)` is `['build']`.
2. **`--flag value` is ambiguous without a schema.** `--verbose deploy`
   parses as `{ verbose: 'deploy' }` unless the parser has been told that
   `verbose` is a boolean. Every real parser has that list.
3. **Negative numbers look like flags.** `--limit -5` sets `limit` to
   `true` and then reads `-5` as the short cluster `{ 5: true }`.
4. **A file written on Windows ends its lines with `\r\n`.**
   `'8080\r\n'.split('\n')[0]` is `'8080\r'`, and `Number('8080\r')` is
   `8080` — right up until you compare it to a string. Split on `/\r?\n/`,
   or let `readline` strip it for you.
5. **Colour is text, and it goes into files.** Nothing strips your escape
   codes when stdout is a pipe. Ask before you paint:
   `const useColor = stream.isTTY && !process.env.NO_COLOR;`
6. **`.length` is not display width.** `'\x1b[31mhi\x1b[39m'.length` is 12,
   so `padEnd(5)` does nothing and your table shears. Measure with the
   escapes stripped.
7. **`stdout` is for data, `stderr` is for humans.** A progress bar printed
   to stdout ends up in the file the user redirected the results into.
8. **`process.exit()` truncates.** It kills the process with writes still
   queued, so the last line of your output vanishes on a pipe. Set
   `process.exitCode = n` and let the program end on its own.
9. **Exit 0 means success, and nothing else does.** A tool that always
   exits 0 silently breaks `cmd && next`, `set -e` and every CI gate.
   Reserve 2 for "you used it wrong" and print usage to stderr.
10. **`--help` is a success.** It exits 0 and prints to stdout. A *missing*
    argument is a failure: exit 2, print to stderr.
11. **`path.dirname` stops changing at the top.** `path.dirname('C:\\')` is
    `'C:\\'` and `path.dirname('/')` is `'/'` — a walk-up loop that waits
    for a falsy value never ends.
12. **Chunk boundaries fall anywhere.** Mid-line, mid-word and mid-
    character. `Buffer.from('héllo').subarray(0, 2).toString()` is broken
    text; `StringDecoder` holds the tail back until the rest arrives.
13. **`.test()` on a `/g` regex is stateful.** `const re = /o/g` matched
    against `'foo'` then `'boo'` then `'zoo'` returns true, true, false —
    `lastIndex` carried over. Drop the flag before looping.
14. **`stream.write()` returns false when the buffer is full.** For a few
    hundred lines it never matters; for a million it is the difference
    between 40 MB of RAM and 4 GB. Then you wait for `'drain'`, or use
    `pipeline`.

## Cheat table

| you want | the call |
| --- | --- |
| your arguments | `process.argv.slice(2)` |
| the exit code | `process.exitCode = 2` (never `process.exit()`) |
| is this a terminal? | `process.stdout.isTTY` |
| read stdin as lines | `createInterface({ input, crlfDelay: Infinity })` |
| ask a question | `readline/promises` → `await rl.question('name? ')` |
| colour on / off | `\x1b[31m` … `\x1b[39m`, bold `\x1b[1m` … `\x1b[22m` |
| strip colour | `text.replace(/\x1b\[[0-9;]*m/g, '')` |
| pad a column | `s.padEnd(w)` for text, `s.padStart(w)` for numbers |
| decode split chunks | `new StringDecoder('utf8')` — `.write()`, `.end()` |
| walk up to a config | loop until `path.dirname(dir) === dir` |
| stay inside a directory | `path.relative(base, target)` must not start `..` |
| tree connectors | `├── `, `└── `, spine `│   `, blank `    ` |

## Exercises

| # | file | ★ | what you build |
| --- | --- | --- | --- |
| 01 | `01-progress-bar.js` | ★☆☆ | `[████░░░░] 50% (5/10)` as a pure function |
| 02 | `02-human-format.js` | ★☆☆ | bytes → `1.4 MB`, ms → `2m 3s`, relative time from an injected `now` |
| 03 | `03-usage-text.js` | ★☆☆ | render `--help` from a spec, columns aligned per block |
| 04 | `04-parse-command.js` | ★★☆ | git-style argv: subcommand, `--k=v`, `--k v`, `--`, repeats |
| 05 | `05-parse-env.js` | ★★☆ | a `.env` parser: comments, quotes, `export`, CRLF |
| 06 | `06-ansi-style.js` | ★★☆ | colour and bold from raw escapes, `stripAnsi`, `visibleLength` |
| 07 | `07-render-table.js` | ★★☆ | rows of objects → an aligned table, numbers right |
| 08 | `08-truncate-cells.js` | ★★☆ | ellipsis truncation that keeps the table inside its budget |
| 09 | `09-render-tree.js` | ★★★ | `tree`-style ASCII with `├──`, `└──` and the `│` spine |
| 10 | `10-exit-codes.js` | ★★☆ | one try/catch: error type → exit code → stderr |
| 11 | `11-line-numberer.js` | ★★☆ | `nl` as an (input, output) filter |
| 12 | `12-grep-like.js` | ★★☆ | `grep` with `-i`, `-v`, `-n`, and no regex-state bug |
| 13 | `13-wc-like.js` | ★★★ | `wc` counted while streaming, characters not bytes |
| 14 | `14-prompt-basics.js` | ★★★ | `ask` / `askYesNo` over an injected readline interface |
| 15 | `15-prompt-choice.js` | ★★★ | numbered menus and a parse-or-retry prompt |
| 16 | `16-find-config.js` | ★★☆ | find the nearest config by walking up the tree |
| 17 | `17-write-tree.js` | ★★☆ | scaffold a directory tree from a spec, and read it back |
| 18 | `18-task-cli.js` | ★★★ | the finale: a task CLI composing 04, 07 and 10 |

Do the warm-ups and core in order. Stretch if time allows.

Run one file at a time:

```
node exercises/01-progress-bar.js
```

Every test should say `todo` before you start and `all green — next file!`
when you are done. The `solutions/` copy of each file has the same tests
plus a walkthrough comment explaining why the solution is shaped that way —
read it after your own attempt, not before.

Exercises 16 and 17 touch the disk. They work inside
`16-node-cli-tooling/tmp-test/<uuid>/` and delete it again in a `finally`,
so a failing test never leaves litter behind. Exercises 14 and 15 build a
real `readline/promises` interface over fake streams — read that helper
before you start; it is the pattern you will reuse every time you have to
test something interactive.

### Extra reps

Twelve more of the same discipline: every edge is an argument, every
escape code is asserted character for character, and nothing waits on a
clock. Do them in any order once 01–18 are green.

| # | file | ★ | what you build |
| --- | --- | --- | --- |
| 19 | `19-multi-select.js` | ★★☆ | a checkbox prompt — toggle by number, Enter to finish |
| 20 | `20-spinner.js` | ★☆☆ | a spinner whose frames you advance yourself |
| 21 | `21-diff-lines.js` | ★★★ | diff records line against line, then `+`/`-` output |
| 22 | `22-box-table.js` | ★★★ | box-drawing borders with cells that wrap at a width |
| 23 | `23-help-from-spec.js` | ★★☆ | `--help` generated from the flag spec, defaults and all |
| 24 | `24-command-router.js` | ★★★ | commander-lite: per-command flags, validation, exit codes |
| 25 | `25-config-cascade.js` | ★★★ | defaults < file < env < argv, and where each value came from |
| 26 | `26-shell-quote.js` | ★★☆ | POSIX and Windows argument quoting, as two pure functions |
| 27 | `27-multi-progress.js` | ★★☆ | N labelled bars redrawn in place under the cursor |
| 28 | `28-log-levels.js` | ★★☆ | quiet/normal/verbose/debug, plus child loggers with prefixes |
| 29 | `29-tty-aware.js` | ★☆☆ | colour and animation on a terminal, plain text down a pipe |
| 30 | `30-count-unique.js` | ★★☆ | `sort \| uniq -c` as one (input, output) filter |

Three of them lean on work you have already done: 19 reuses the fake
terminal from 14 and 15, 27 takes the bar renderer from 01 as an
argument rather than rebuilding it, and 30 is 13 with a Map in the
middle. 24 and 25 are the two that turn up in real code most often — an
argument you cannot trust and a setting whose origin nobody can explain.

---

**Stuck?** `cheatsheets/node-advanced.md` (CLI conventions, exit codes) · `cheatsheets/node-api.md` (`process`, streams, CLI flags) · **Self-check:** `quizzes/12-node-advanced.md` · **Next:** `bootcamp/17-node-async-advanced`

Builds on `bootcamp/12-node-fundamentals` — if `process.argv`, stdin and exit codes are new, do 12 first.
