import {openDb,migrate,seed,type Db} from '../../../apps/api/src/db.js';
export function testDb():Db{const db=openDb(':memory:');migrate(db);seed(db);return db}
export const admin={userId:'u_admin',orgId:'org_demo',role:'admin'} as const;
export const sales={userId:'u_sales',orgId:'org_demo',role:'sales'} as const;
export const token=(user='u_admin',org='org_demo')=>Buffer.from(`${user}:${org}`).toString('base64url');
