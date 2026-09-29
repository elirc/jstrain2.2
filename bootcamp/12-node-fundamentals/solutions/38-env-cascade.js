// ─────────────────────────────────────────────────────────────────────────
//  38 · .env cascade loading — SOLUTION                         ★★☆ core
//  run: node 38-env-cascade.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: three small functions instead of one big loader — a pure
//  parser, an async merger, a pure validator. Only the middle one touches
//  the disk, which is why the other two need no temp directories to test.
//  `indexOf('=')` rather than `split('=')`: a value like a URL with a
//  query string is full of '=' signs, and split-then-take-[1] truncates
//  it at the first one.
//  The cascade is just Object.assign in precedence order, lowest first.
//  The real environment goes last and skips '' so an accidentally-empty
//  variable does not blank out a perfectly good file value.
//  ENOENT is expected and becomes an empty layer; any other error is
//  rethrown, because "permission denied" must not read as "no config".
//  typedEnv throws on junk instead of falling back — a PORT of 'eighty'
//  should stop the process at boot, not quietly serve on 3000.

import { test, eq, throws } from '../../_lib/check.js';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

// Provided: temp dir per test + a writer for the env files in it.
const TMP_ROOT = path.join(import.meta.dirname, '..', 'tmp-test');

async function withTempDir(run) {
  const dir = path.join(TMP_ROOT, randomUUID());
  await fs.mkdir(dir, { recursive: true });
  try {
    return await run(dir);
  } finally {
    await fs.rm(dir, { recursive: true, force: true, maxRetries: 3 });
    await fs.rmdir(TMP_ROOT).catch(() => {});
  }
}

async function writeEnvFiles(dir, files) {
  for (const [name, text] of Object.entries(files)) {
    await fs.writeFile(path.join(dir, name), text, 'utf8');
  }
}

const TRUE_WORDS = ['1', 'true', 'yes', 'on'];
const FALSE_WORDS = ['0', 'false', 'no', 'off'];

export function parseEnvFile(text) {
  const values = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line === '' || line.startsWith('#')) continue;

    const split = line.indexOf('=');
    if (split === -1) continue;

    const key = line.slice(0, split).trim();
    let value = line.slice(split + 1).trim();
    const quoted =
      value.length >= 2 &&
      ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'")));
    if (quoted) value = value.slice(1, -1);

    if (key) values[key] = value;
  }
  return values;
}

export async function loadEnv(dir, processEnv = {}) {
  const merged = {};

  for (const name of ['.env', '.env.local']) {
    const text = await fs.readFile(path.join(dir, name), 'utf8').catch((err) => {
      if (err.code === 'ENOENT') return '';
      throw err;
    });
    Object.assign(merged, parseEnvFile(text));
  }

  for (const [key, value] of Object.entries(processEnv)) {
    if (value !== undefined && value !== '') merged[key] = value;
  }
  return merged;
}

function coerce(key, raw, type) {
  if (type === 'string') return raw;
  if (type === 'number') {
    const value = Number(raw);
    if (!Number.isFinite(value)) {
      throw new Error(`${key} must be a number, got ${JSON.stringify(raw)}`);
    }
    return value;
  }
  if (type === 'boolean') {
    const word = raw.trim().toLowerCase();
    if (TRUE_WORDS.includes(word)) return true;
    if (FALSE_WORDS.includes(word)) return false;
    throw new Error(`${key} must be a boolean, got ${JSON.stringify(raw)}`);
  }
  throw new Error(`unknown type for ${key}: ${type}`);
}

export function typedEnv(env, schema) {
  const config = {};
  for (const [key, spec] of Object.entries(schema)) {
    const raw = env[key];
    if (raw === undefined || raw === '') {
      if ('default' in spec) {
        config[key] = spec.default;
        continue;
      }
      throw new Error(`missing required env var: ${key}`);
    }
    config[key] = coerce(key, raw, spec.type);
  }
  return config;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('parses pairs and ignores comments and blank lines', () => {
  const text = '# database\n\nPORT=8080\n  # indented comment\nHOST=localhost\n';
  eq(parseEnvFile(text), { PORT: '8080', HOST: 'localhost' });
});

test('splits on the first = only, and trims', () => {
  eq(parseEnvFile('URL=https://x.dev/?a=1&b=2'), { URL: 'https://x.dev/?a=1&b=2' });
  eq(parseEnvFile('  NAME =  spaced  \n'), { NAME: 'spaced' });
  eq(parseEnvFile('EMPTY=\nJUNK_LINE\n'), { EMPTY: '' });
});

test('strips one pair of surrounding quotes', () => {
  eq(parseEnvFile('A="my app"\nB=\'single\'\nC=no"quotes"here'), {
    A: 'my app',
    B: 'single',
    C: 'no"quotes"here',
  });
});

test('loadEnv reads .env from the directory', async () => {
  await withTempDir(async (dir) => {
    await writeEnvFiles(dir, { '.env': 'PORT=8080\nHOST=localhost\n' });
    eq(await loadEnv(dir), { PORT: '8080', HOST: 'localhost' });
  });
});

test('.env.local wins over .env, key by key', async () => {
  await withTempDir(async (dir) => {
    await writeEnvFiles(dir, {
      '.env': 'PORT=8080\nHOST=localhost\n',
      '.env.local': 'PORT=3000\nDEBUG=true\n',
    });
    eq(await loadEnv(dir), { PORT: '3000', HOST: 'localhost', DEBUG: 'true' });
  });
});

test('missing files are normal, not an error', async () => {
  await withTempDir(async (dir) => {
    eq(await loadEnv(dir), {});
    await writeEnvFiles(dir, { '.env.local': 'ONLY=local\n' });
    eq(await loadEnv(dir), { ONLY: 'local' });
  });
});

test('the real environment beats both files', async () => {
  await withTempDir(async (dir) => {
    await writeEnvFiles(dir, {
      '.env': 'PORT=8080\n',
      '.env.local': 'PORT=3000\n',
    });
    eq(await loadEnv(dir, { PORT: '9999', EXTRA: 'x' }), {
      PORT: '9999',
      EXTRA: 'x',
    });
    eq((await loadEnv(dir, { PORT: '' })).PORT, '3000', 'empty is not set');
  });
});

test('typedEnv coerces, defaults, and refuses junk', () => {
  const schema = {
    PORT: { type: 'number', default: 3000 },
    DEBUG: { type: 'boolean', default: false },
    API_URL: { type: 'string' },
  };
  eq(typedEnv({ PORT: '8080', DEBUG: 'YES', API_URL: 'https://x.dev' }, schema), {
    PORT: 8080,
    DEBUG: true,
    API_URL: 'https://x.dev',
  });
  eq(typedEnv({ API_URL: 'https://x.dev' }, schema), {
    PORT: 3000,
    DEBUG: false,
    API_URL: 'https://x.dev',
  });
  throws(() => typedEnv({}, schema), 'API_URL');
  throws(() => typedEnv({ PORT: 'eighty', API_URL: 'u' }, schema), 'PORT');
  throws(() => typedEnv({ DEBUG: 'maybe', API_URL: 'u' }, schema), 'DEBUG');
});
