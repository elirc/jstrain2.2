import Database from 'better-sqlite3';
import fs from 'node:fs'; import path from 'node:path'; import { randomUUID } from 'node:crypto';
export type Db=Database.Database;
export function openDb(filename:string):Db { if(filename!==':memory:') fs.mkdirSync(path.dirname(path.resolve(filename)),{recursive:true}); const db=new Database(filename); db.pragma('foreign_keys=ON'); db.pragma('journal_mode=WAL'); db.pragma('busy_timeout=5000'); return db; }
export function migrate(db:Db, migrationsDir=path.resolve('migrations')) { db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations(name TEXT PRIMARY KEY, applied_at TEXT NOT NULL)`); const done=new Set((db.prepare('SELECT name FROM schema_migrations').all() as {name:string}[]).map(x=>x.name)); for(const name of fs.readdirSync(migrationsDir).filter(x=>x.endsWith('.sql')).sort()){ if(done.has(name))continue; const sql=fs.readFileSync(path.join(migrationsDir,name),'utf8'); db.transaction(()=>{db.exec(sql);db.prepare('INSERT INTO schema_migrations VALUES(?,?)').run(name,new Date().toISOString())})(); } }
export const uid=(prefix:string)=>`${prefix}_${randomUUID()}`;
export function seed(db:Db){ const now='2026-01-01T00:00:00.000Z'; db.transaction(()=>{
  db.prepare('INSERT OR IGNORE INTO organizations VALUES (?,?)').run('org_demo','Demo Distribution');
  db.prepare('INSERT OR IGNORE INTO organizations VALUES (?,?)').run('org_other','Other Tenant');
  for(const [id,email,role] of [['u_admin','admin@example.com','admin'],['u_catalog','catalog@example.com','catalog'],['u_sales','sales@example.com','sales'],['u_viewer','viewer@example.com','viewer'],['u_other','other@example.com','admin']]){db.prepare('INSERT OR IGNORE INTO users VALUES (?,?,?)').run(id,email,'demo-password'); db.prepare('INSERT OR IGNORE INTO memberships VALUES (?,?,?)').run(role==='admin'&&id==='u_other'?'org_other':'org_demo',id,role);}
  db.prepare('INSERT OR IGNORE INTO warehouses VALUES (?,?,?,?,?)').run('wh_main','org_demo','MAIN','Main Warehouse',1);
  db.prepare('INSERT OR IGNORE INTO warehouses VALUES (?,?,?,?,?)').run('wh_west','org_demo','WEST','West Warehouse',1);
  db.prepare('INSERT OR IGNORE INTO suppliers VALUES (?,?,?,?,?,?)').run('sup_demo','org_demo','Acme Supply','orders@acme.test',4,1);
  db.prepare('INSERT OR IGNORE INTO products VALUES (?,?,?,?,?,?,?,?,?)').run('prod_widget','org_demo','WIDGET-001','Widget','each','active',5,1,now);
  db.prepare('INSERT OR IGNORE INTO stock_levels VALUES (?,?,?,?,?,?)').run('org_demo','prod_widget','wh_main',12,0,1);
  db.prepare('INSERT OR IGNORE INTO stock_movements VALUES (?,?,?,?,?,?,?,?,?,?,?)').run('mov_seed','org_demo','prod_widget','wh_main',12,'opening','seed','seed','u_admin','deterministic seed',now);
})(); }
