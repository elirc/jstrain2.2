// ─────────────────────────────────────────────────────────────────────────
//  36 · a machine report — SOLUTION                          ★☆☆ warm-up
//  run: node 36-machine-report.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the whole lesson is in the signature. `os` and `process`
//  arrive as arguments, so the same function serves the real diagnostics
//  endpoint and a test with a machine that has exactly 8 CPUs and 16 GB
//  of RAM forever. Import them inside the function and the only test you
//  can write is "it returned a number".
//  os.cpus() builds an array of objects per call — take .length and let
//  it go. os.totalmem()/freemem() are bytes, and >> 20 style cleverness
//  is not worth it: two divisions by 1024 say what they mean.
//  Math.round for megabytes and the percentage, Math.floor for minutes —
//  62.08 minutes of uptime is 62 minutes, not 62 and a bit.

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
  const totalBytes = osModule.totalmem();
  const freeBytes = osModule.freemem();
  const toMB = (bytes) => Math.round(bytes / 1024 / 1024);

  return {
    platform: osModule.platform(),
    arch: osModule.arch(),
    cpus: osModule.cpus().length,
    totalMemMB: toMB(totalBytes),
    freeMemMB: toMB(freeBytes),
    memoryUsedPercent: Math.round(((totalBytes - freeBytes) / totalBytes) * 100),
    uptimeMinutes: Math.floor(osModule.uptime() / 60),
    node: processObject.versions.node,
    pid: processObject.pid,
  };
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
