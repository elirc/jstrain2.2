// ─────────────────────────────────────────────────────────────────────────
//  38 · .env cascade loading                                    ★★☆ core
//  concepts: parsing · layered config · ENOENT · type validation
//  run: node 38-env-cascade.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Every framework ships the same three layers: `.env` is committed and
//  holds the defaults, `.env.local` is git-ignored and holds your
//  machine's overrides, and the real environment beats both — that is how
//  the same image runs in dev and in production.
//
//      parseEnvFile('# db\nPORT=8080\nNAME="my app"\n')
//        → { PORT: '8080', NAME: 'my app' }
//      await loadEnv(dir, { PORT: '9999' })
//        → .env, then .env.local on top, then the real env on top
//      typedEnv(env, { PORT: { type: 'number', default: 3000 },
//                      DEBUG: { type: 'boolean', default: false },
//                      API_URL: { type: 'string' } })
//        → { PORT: 8080, DEBUG: true, API_URL: 'https://…' }
//
//  Parsing: skip blank lines and lines starting with '#', split at the
//  FIRST '=', trim both sides, and drop one pair of matching quotes
//  around a value. A line with no '=' is skipped. A missing .env file is
//  normal, not an error, and a real env var set to '' never overrides.
//  Validation: a schema entry with no `default` is required — throw and
//  name it. A value that is set but unparsable also throws — name the key
//  there too; it never silently falls back. '' counts as not set.
//  Booleans are 1/true/yes/on and 0/false/no/off, any casing.
//
//  hint: `.catch(err => { if (err.code === 'ENOENT') return ''; throw err })`
//  around the read — swallowing every error instead turns a permissions
//  problem into "your config is empty".

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

export function parseEnvFile(text) {
  throw new Error('TODO');
}

export async function loadEnv(dir, processEnv = {}) {
  throw new Error('TODO');
}

export function typedEnv(env, schema) {
  throw new Error('TODO');
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
