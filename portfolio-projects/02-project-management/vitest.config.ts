import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { environmentMatchGlobs: [['**/*.tsx', 'jsdom']], setupFiles: ['./tests/setup.ts'], fileParallelism: false } });
