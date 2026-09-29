import { migrate,openDb,seed } from '../apps/api/src/db.js';const db=openDb();migrate(db);seed(db);db.close();console.log('Deterministic demo data seeded');
