import { z } from 'zod';

export const Id = z.string().uuid();
export const Role = z.enum(['owner', 'admin', 'manager', 'contributor', 'guest', 'viewer']);
export const Priority = z.enum(['low', 'medium', 'high', 'urgent']);
export const TaskCreate = z.object({
  projectId: Id, columnId: Id, title: z.string().trim().min(1).max(160),
  description: z.string().max(10_000).default(''), priority: Priority.default('medium'),
  dueAt: z.string().datetime().nullable().default(null)
}).strict();
export const TaskUpdate = z.object({
  version: z.number().int().positive(), title: z.string().trim().min(1).max(160).optional(),
  description: z.string().max(10_000).optional(), priority: Priority.optional(),
  dueAt: z.string().datetime().nullable().optional()
}).strict();
export const TaskMove = z.object({
  version: z.number().int().positive(), targetColumnId: Id,
  beforeTaskId: Id.nullable().default(null), afterTaskId: Id.nullable().default(null),
  idempotencyKey: z.string().min(8).max(100)
}).strict().refine(v => !(v.beforeTaskId && v.afterTaskId), 'Only one rank anchor may be provided');
export const ProjectCreate = z.object({ key: z.string().trim().regex(/^[A-Z][A-Z0-9]{1,9}$/), name: z.string().trim().min(2).max(100) }).strict();
export const InviteCreate = z.object({ email: z.string().email(), role: Role.exclude(['owner']), expiresInHours: z.number().int().min(1).max(168).default(72) }).strict();
export const CommentCreate = z.object({ body: z.string().trim().min(1).max(5000) }).strict();
export const SavedViewCreate = z.object({ name: z.string().trim().min(1).max(80), visibility: z.enum(['personal','project']), filters: z.record(z.string(), z.unknown()), sort: z.enum(['rank','updated','due']).default('rank') }).strict();
export const AttachmentCreate = z.object({ fileName: z.string().min(1).max(180).refine(v => !/[\\/]/.test(v), 'Path characters are not allowed'), contentType: z.enum(['image/png','image/jpeg','application/pdf','text/plain']), size: z.number().int().positive().max(5_000_000), checksum: z.string().regex(/^[a-f0-9]{64}$/) }).strict();
export const ListQuery = z.object({ q: z.string().max(100).optional(), state: z.string().max(50).optional(), priority: Priority.optional(), assignee: Id.optional(), label: Id.optional(), page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(100).default(25), sort: z.enum(['rank','updated','due']).default('rank') }).strict();
export type TaskCreateInput = z.infer<typeof TaskCreate>;
export type TaskMoveInput = z.infer<typeof TaskMove>;
export type ApiError = { error: { code: string; message: string; correlationId: string; details?: unknown } };
