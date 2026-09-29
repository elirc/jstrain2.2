import { migrate,openDb } from '../apps/api/src/db.js';const db=openDb();migrate(db);db.close();console.log('Migrations applied');
