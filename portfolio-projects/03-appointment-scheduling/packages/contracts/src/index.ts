import { z } from 'zod';

export const roles = ['admin', 'scheduler', 'provider', 'reception', 'customer'] as const;
export type Role = typeof roles[number];
export const id = z.string().trim().min(1).max(80).regex(/^[a-zA-Z0-9_-]+$/);
export const zone = z.string().refine((value) => { try { Intl.DateTimeFormat('en', { timeZone: value }); return true; } catch { return false; } }, 'Invalid IANA time zone');
export const slotQuery = z.object({ serviceId: id, locationId: id, from: z.iso.date(), to: z.iso.date(), zone, staffId: id.optional() }).strict();
export const holdInput = z.object({ slotToken: z.string().min(10).max(1000), idempotencyKey: z.string().min(8).max(100), customerId: id }).strict();
export const confirmInput = z.object({ holdId: id, idempotencyKey: z.string().min(8).max(100) }).strict();
export const commandInput = z.object({ expectedVersion: z.number().int().positive(), reason: z.string().trim().min(3).max(300).optional() }).strict();
export const lifecycleInput = commandInput.extend({ state: z.enum(['checked_in','in_progress','completed','no_show','cancelled']) }).strict();
export const rescheduleInput = commandInput.extend({ slotToken: z.string().min(10).max(1000) }).strict();
export const availabilityInput = z.object({ staffId: id, weekday: z.number().int().min(1).max(7), startLocal: z.string().regex(/^\d\d:\d\d$/), endLocal: z.string().regex(/^\d\d:\d\d$/), effectiveFrom: z.iso.date(), effectiveTo: z.iso.date() }).strict();
export const waitlistInput = z.object({ serviceId: id, locationId: id, customerId: id, earliest: z.iso.datetime({ offset: true }), latest: z.iso.datetime({ offset: true }) }).strict();
export type ErrorEnvelope = { error: { code: string; message: string; correlationId: string; details?: unknown } };
