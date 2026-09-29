import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';

export function hash(value: string): string { return createHash('sha256').update(value).digest('hex'); }
export function openDatabase(path: string): DatabaseSync {
  if (path !== ':memory:') mkdirSync(dirname(resolve(path)), { recursive: true });
  const db = new DatabaseSync(path); db.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;'); return db;
}
export function migrate(db: DatabaseSync): void {
  db.exec('CREATE TABLE IF NOT EXISTS schema_migrations(version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL)');
  const dir = resolve(process.cwd(), 'migrations');
  for (const name of readdirSync(dir).filter(n => /^\d+.*\.sql$/.test(n)).sort()) {
    const version = Number(name.split('_')[0]);
    const found = db.prepare('SELECT 1 FROM schema_migrations WHERE version=?').get(version);
    if (!found) { db.exec('BEGIN IMMEDIATE'); try { db.exec(readFileSync(resolve(dir,name),'utf8')); db.prepare('INSERT INTO schema_migrations VALUES(?,?)').run(version,new Date().toISOString()); db.exec('COMMIT'); } catch(e) { db.exec('ROLLBACK'); throw e; } }
  }
}
export function seed(db: DatabaseSync): void {
  const now='2026-01-15T12:00:00.000Z';
  db.exec('BEGIN IMMEDIATE');
  try {
    const org=db.prepare('INSERT OR IGNORE INTO organizations VALUES(?,?,?,?)');
    org.run('10000000-0000-4000-8000-000000000001','acme','Acme Studio',now); org.run('10000000-0000-4000-8000-000000000002','globex','Globex Labs',now);
    const user=db.prepare('INSERT OR IGNORE INTO users(id,email,name,time_zone) VALUES(?,?,?,?)');
    user.run('20000000-0000-4000-8000-000000000001','owner@acme.test','Avery Owner','America/Los_Angeles'); user.run('20000000-0000-4000-8000-000000000002','owner@globex.test','Gina Owner','UTC'); user.run('20000000-0000-4000-8000-000000000003','guest@demo.test','Gus Guest','UTC');
    const member=db.prepare('INSERT OR IGNORE INTO memberships VALUES(?,?,?,?)');
    member.run('10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','owner','active'); member.run('10000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000002','owner','active'); member.run('10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000003','guest','active');
    const session=db.prepare('INSERT OR REPLACE INTO sessions VALUES(?,?,?)'); session.run(hash('demo-owner-acme'),'20000000-0000-4000-8000-000000000001','2099-01-01T00:00:00Z'); session.run(hash('demo-owner-globex'),'20000000-0000-4000-8000-000000000002','2099-01-01T00:00:00Z'); session.run(hash('demo-guest-acme'),'20000000-0000-4000-8000-000000000003','2099-01-01T00:00:00Z');
    const project=db.prepare('INSERT OR IGNORE INTO projects VALUES(?,?,?,?,?,?,?,?)'); project.run('30000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','WEB','Website Launch',null,3,now,now); project.run('30000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002','WEB','Private Globex Website',null,2,now,now);
    db.prepare('INSERT OR IGNORE INTO project_members VALUES(?,?,?)').run('30000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000003','guest');
    const board=db.prepare('INSERT OR IGNORE INTO boards VALUES(?,?,?,?,?)'); board.run('40000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','Delivery',now); board.run('40000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000002','Delivery',now);
    const col=db.prepare('INSERT OR IGNORE INTO columns VALUES(?,?,?,?,?,?)'); col.run('50000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001','Backlog',1024,null); col.run('50000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001','Doing',2048,1); col.run('50000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001','Done',3072,null); col.run('50000000-0000-4000-8000-000000000004','10000000-0000-4000-8000-000000000002','40000000-0000-4000-8000-000000000002','Backlog',1024,null);
    const task=db.prepare('INSERT OR IGNORE INTO tasks VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'); task.run('60000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000001',1,'Plan launch','Define measurable launch criteria','high',1024,1,'20000000-0000-4000-8000-000000000001',null,null,now,now); task.run('60000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000002',2,'Build landing page','Accessible and responsive','urgent',1024,1,'20000000-0000-4000-8000-000000000001','2026-02-01T18:00:00Z',null,now,now); task.run('60000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000002','50000000-0000-4000-8000-000000000004',1,'Private acquisition','Must never appear in Acme results','urgent',1024,1,'20000000-0000-4000-8000-000000000002',null,null,now,now);
    db.exec('COMMIT');
  } catch(e) { db.exec('ROLLBACK'); throw e; }
}
export function freshDatabase(path=':memory:'): DatabaseSync { const db=openDatabase(path); migrate(db); seed(db); return db; }
export const uid = (): string => randomUUID();
