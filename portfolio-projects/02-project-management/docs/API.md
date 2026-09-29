# API contract

Protected requests require `Authorization: Bearer …` and `X-Organization-Id`. JSON errors have `{ "error": { "code", "message", "correlationId", "details?" } }`. Validation is 422, concurrency/WIP conflict 409, oversized body 413, and denied or absent resources use the same non-enumerating 404.

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/health/live`, `/health/ready` | Process/dependency health |
| GET/POST | `/api/projects` | Search active projects / create |
| GET | `/api/boards/:id` | Canonical board, columns, tasks |
| GET/POST | `/api/tasks` | Filtered bounded task list / create |
| PATCH | `/api/tasks/:id` | Version-checked edit |
| POST | `/api/tasks/:id/move` | Idempotent versioned move command |
| POST | `/api/tasks/:id/comments` | Comment and activity |
| POST | `/api/tasks/:id/attachments` | Validate metadata, enqueue scan |
| POST | `/api/projects/:id/saved-views` | Personal/project view |
| GET | `/api/projects/:id/activities` | Tenant/project activity timeline |
| GET | `/api/notifications` | Current user's notification records |
| POST | `/api/invitations` | Owner/admin expiring invitation |

Example move body: `{"version":1,"targetColumnId":"uuid","beforeTaskId":null,"afterTaskId":null,"idempotencyKey":"client-generated-key"}`. A stale edit returns code `VERSION_CONFLICT` and current state in `details`; full WIP returns `WIP_LIMIT`.
