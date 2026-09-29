// verify-dom.js — CI for the DOM module. Run: node bootcamp/13-dom-and-browser/verify-dom.js
//
// Loads every exercise and solution HTML file in a headless jsdom window, lets
// the file's own inline test harness run, then reads window.__RESULTS.
//
//   solutions/*.html  →  failed = 0 AND todo = 0   (everything green)
//   exercises/*.html  →  failed = 0                (todo is the expected state)
//
// Exits 1 if anything is broken. jsdom comes from the sibling jstrain project;
// nothing else is installed and nothing is downloaded.

import { readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const HERE = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(HERE, '..', '..', 'jstrain', 'package.json'));
const { JSDOM, VirtualConsole } = require('jsdom');

const only = process.argv[2]; // optional file-name filter, e.g. `node verify-dom.js 14`
const TIMEOUT_MS = 15000;
const POLL_MS = 25;

function listFiles(kind) {
  const dir = join(HERE, kind);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.html'))
    .filter((f) => !only || f.startsWith(only))
    .sort()
    .map((f) => ({ kind, file: f, path: join(dir, f) }));
}

async function runFile(job) {
  const errors = [];
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', (err) => errors.push(err.message));
  virtualConsole.on('error', (msg) => errors.push(String(msg)));

  let dom;
  try {
    dom = await JSDOM.fromFile(job.path, {
      runScripts: 'dangerously',
      url: 'http://localhost/',
      pretendToBeVisual: true,
      virtualConsole,
    });
  } catch (err) {
    return { ...job, ok: false, note: 'could not load: ' + err.message };
  }

  const { window } = dom;
  const started = Date.now();
  while (!window.__RESULTS && Date.now() - started < TIMEOUT_MS) {
    await new Promise((r) => setTimeout(r, POLL_MS));
  }

  const results = window.__RESULTS;
  const ms = Date.now() - started;
  window.close(); // stops any interval the exercise left running

  if (!results) {
    return {
      ...job,
      ok: false,
      note: 'no #done line after ' + TIMEOUT_MS + 'ms' +
        (errors.length ? ' — ' + errors[0].split('\n')[0] : ''),
    };
  }

  const { passed, failed, todo } = results;
  const total = passed + failed + todo;
  const wantsClean = job.kind === 'solutions';
  // *-debug* files are bug hunts: the exercise SHIPS with failing checks
  // (the student's job is to fix the page). Only the solution must pass.
  const debugHunt = job.kind === 'exercises' && /-debug/.test(job.file);
  const ok = debugHunt
    ? failed > 0 && total > 0
    : failed === 0 && (!wantsClean || todo === 0) && total > 0;

  let note = '';
  if (total === 0) note = 'no tests found';
  else if (debugHunt && failed === 0) note = 'debug hunt already passes (no bug to find)';
  else if (failed > 0 && !debugHunt) note = failed + ' failing test(s)';
  else if (wantsClean && todo > 0) note = todo + ' unimplemented test(s) in a solution';
  else if (job.kind === 'exercises' && !debugHunt && todo === 0) note = 'nothing left to do?';

  return { ...job, ok, passed, failed, todo, total, ms, note };
}

const jobs = [...listFiles('solutions'), ...listFiles('exercises')];
if (jobs.length === 0) {
  console.error('no HTML files found in ' + HERE);
  process.exit(1);
}

const rows = [];
for (const job of jobs) rows.push(await runFile(job));

const pad = (s, n) => String(s).padEnd(n);
const num = (s, n) => String(s).padStart(n);

console.log('');
console.log(pad('', 2) + pad('file', 34) + num('pass', 5) + num('fail', 5) + num('todo', 5) + '  note');
console.log('─'.repeat(72));

let lastKind = null;
for (const row of rows) {
  if (row.kind !== lastKind) {
    console.log(row.kind + '/');
    lastKind = row.kind;
  }
  console.log(
    pad(row.ok ? ' ✔' : ' ✘', 2) +
      pad('  ' + row.file, 34) +
      num(row.passed ?? '-', 5) +
      num(row.failed ?? '-', 5) +
      num(row.todo ?? '-', 5) +
      (row.note ? '  ' + row.note : '')
  );
}

const broken = rows.filter((r) => !r.ok);
const tests = rows.reduce((sum, r) => sum + (r.total || 0), 0);
const solutionTests = rows
  .filter((r) => r.kind === 'solutions')
  .reduce((sum, r) => sum + (r.total || 0), 0);

console.log('─'.repeat(72));
console.log(
  rows.length + ' files · ' + tests + ' test runs · ' +
    solutionTests + ' tests per pass · ' + broken.length + ' broken'
);

if (broken.length > 0) {
  console.log('');
  for (const row of broken) console.log('BROKEN ' + row.kind + '/' + row.file + ' — ' + row.note);
  process.exit(1);
}
console.log('all green — solutions pass, exercises are clean TODOs');
