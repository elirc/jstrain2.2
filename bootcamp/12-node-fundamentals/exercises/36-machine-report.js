// ─────────────────────────────────────────────────────────────────────────
//  36 · a machine report                                     ★☆☆ warm-up
//  concepts: node:os · process facts · dependency injection
//  run: node 36-machine-report.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Every diagnostics endpoint prints the same handful of facts about the
//  box it is running on. The catch: a function that calls os.freemem()
//  directly can only be tested by asserting "some number came back". Take
//  the os module as an ARGUMENT and a fake one makes the whole report
//  predictable.
//
//      machineReport(os, process)
//        → { platform: 'win32', arch: 'x64', cpus: 8,
//            totalMemMB: 16384, freeMemMB: 4096, memoryUsedPercent: 75,
//            uptimeMinutes: 62, node: '22.16.0', pid: 4242 }
//
//  Megabytes are bytes / 1024 / 1024, rounded. memoryUsedPercent is
//  (total - free) / total as a whole-number percentage. uptimeMinutes
//  drops the leftover seconds. `node` and `pid` come from the process
//  object you were handed, never from the global.

import { test, eq, ok } from '../../_lib/check.js';
import os from 'node:os';

// Provided: a machine that never changes, so the numbers can be asserted.
const fakeOs = {
  platform: () => 'linux',
  arch: () => 'arm64',
  cpus: () => new Array(8).fill({ model: 'Fake CPU' }),
  totalmem: () => 16 * 1024 * 1024 * 1024,
  freemem: () => 4 * 1024 * 1024 * 1024,
  uptime: () => 3725, // 62 minutes and 5 seconds
};

const fakeProcess = { versions: { node: '22.0.0' }, pid: 4242 };

export function machineReport(osModule, processObject) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('platform and arch come straight from the os module', () => {
  const report = machineReport(fakeOs, fakeProcess);
  eq(report.platform, 'linux');
  eq(report.arch, 'arm64');
});

test('cpus is a count, not the array', () => {
  eq(machineReport(fakeOs, fakeProcess).cpus, 8);
});

test('memory is reported in whole megabytes', () => {
  const report = machineReport(fakeOs, fakeProcess);
  eq(report.totalMemMB, 16384);
  eq(report.freeMemMB, 4096);
});

test('memoryUsedPercent is a whole-number percentage', () => {
  eq(machineReport(fakeOs, fakeProcess).memoryUsedPercent, 75);
});

test('uptime is whole minutes, leftover seconds dropped', () => {
  eq(machineReport(fakeOs, fakeProcess).uptimeMinutes, 62);
});

test('the node version and pid come from the injected process', () => {
  const report = machineReport(fakeOs, fakeProcess);
  eq(report.node, '22.0.0');
  eq(report.pid, 4242);
});

test('it also works on the machine you are actually on', () => {
  const report = machineReport(os, process);
  eq(report.platform, process.platform);
  eq(report.pid, process.pid);
  ok(report.cpus >= 1);
  ok(report.totalMemMB > 0);
  ok(report.memoryUsedPercent >= 0 && report.memoryUsedPercent <= 100);
  ok(Number.isInteger(report.uptimeMinutes));
});
