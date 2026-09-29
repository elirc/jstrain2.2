# Deployment and rollback

Back up the database, run `npm ci`, `npm run verify`, `npm run db:migrate`, `npm run build`, then start API and worker under a supervisor with termination grace above ten seconds. Probe readiness before routing traffic. Roll back application code only while migrations remain backward compatible. For an incompatible future migration: stop writers, restore the verified backup, deploy the prior build, then reopen traffic. Never delete movement history to undo a business command; append a compensating command.
