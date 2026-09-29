import { z } from 'zod';
const Config = z.object({ PORT: z.coerce.number().int().min(1024).max(65535).default(4202), DATABASE_PATH: z.string().min(1).default('./data/project-management.sqlite'), SESSION_SECRET: z.string().min(32).default('local-demo-secret-change-before-prod'), WEB_ORIGIN: z.string().url().default('http://localhost:5202') });
export type AppConfig = z.infer<typeof Config>;
export function config(env: NodeJS.ProcessEnv = process.env): AppConfig { return Config.parse(env); }
