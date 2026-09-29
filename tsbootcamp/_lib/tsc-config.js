// Shared compiler invocation for run.js / verify.js / progress.js.
// Flags mirror tsconfig.json — keep the two in sync.

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const trackRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
export const tscJs = join(trackRoot, 'node_modules', 'typescript', 'lib', 'tsc.js');

export const tscFlags = [
  '--noEmit',
  '--strict',
  '--target', 'es2022',
  '--lib', 'es2023',
  '--module', 'nodenext',
  '--moduleResolution', 'nodenext',
  '--allowImportingTsExtensions',
  '--skipLibCheck',
  '--types', 'node',
  '--pretty', 'false',
];

// Node flags that let .ts files run directly (enums included), quietly.
export const nodeTsFlags = [
  '--experimental-transform-types',
  '--disable-warning=ExperimentalWarning',
];

// Parse `--pretty false` tsc output into per-file error lists.
// Lines look like:  path/file.ts(12,5): error TS2322: message
export function parseTscOutput(stdout) {
  const errors = [];
  for (const line of stdout.split(/\r?\n/)) {
    const m = line.match(/^(.*?)\((\d+),(\d+)\): error (TS\d+): (.*)$/);
    if (m) {
      errors.push({
        file: m[1].replaceAll('\\', '/'),
        line: Number(m[2]),
        code: m[4],
        message: m[5],
        raw: line,
      });
    } else if (errors.length && /^\s+/.test(line)) {
      errors[errors.length - 1].raw += `\n${line}`; // continuation line
    }
  }
  return errors;
}
