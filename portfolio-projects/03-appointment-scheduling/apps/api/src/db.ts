import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

export type Db = Database.Database;
export function openDb(filename = process.env.DATABASE_PATH ?? path.resolve('data/schedule.db')): Db {
  if (filename !== ':memory:') fs.mkdirSync(path.dirname(filename), { recursive: true });
  const db = new Database(filename);
  db.pragma('foreign_keys = ON'); db.pragma('journal_mode = WAL'); db.pragma('busy_timeout = 5000');
  return db;
}
export function migrate(db: Db): void {
  db.exec('CREATE TABLE IF NOT EXISTS schema_migrations(version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL)');
  const applied = new Set((db.prepare('SELECT version FROM schema_migrations').all() as {version:number}[]).map(r => r.version));
  const directory = path.resolve('migrations');
  for (const file of fs.readdirSync(directory).filter(f => /^\d+.*\.sql$/.test(f)).sort()) {
    const version = Number(file.match(/^\d+/)![0]); if (applied.has(version)) continue;
    const sql = fs.readFileSync(path.join(directory, file), 'utf8');
    db.transaction(() => { db.exec(sql); db.prepare('INSERT INTO schema_migrations VALUES (?,?)').run(version, new Date().toISOString()); })();
  }
}
export function seed(db: Db): void {
  const seedTx = db.transaction(() => {
    db.prepare('INSERT OR IGNORE INTO organizations VALUES (?,?)').run('org-1','Northstar Health');
    db.prepare('INSERT OR IGNORE INTO locations VALUES (?,?,?,?)').run('loc-1','org-1','Downtown Clinic','America/Los_Angeles');
    const users = [['admin-1','Ada Admin','admin'],['scheduler-1','Sam Scheduler','scheduler'],['provider-1','Priya Provider','provider'],['reception-1','Riley Reception','reception'],['customer-1','Casey Customer','customer'],['customer-2','Morgan Customer','customer']];
    for (const [uid,name,role] of users) db.prepare('INSERT OR IGNORE INTO users VALUES (?,?,?,?)').run(uid,'org-1',name,role);
    db.prepare('INSERT OR IGNORE INTO services VALUES (?,?,?,?,?,?,?)').run('svc-1','org-1','Initial consultation',30,10,5,12500);
    db.prepare('INSERT OR IGNORE INTO staff VALUES (?,?,?,?)').run('staff-1','provider-1','loc-1',1);
    db.prepare('INSERT OR IGNORE INTO resources VALUES (?,?,?,?,?,?,?)').run('room-1','org-1','loc-1','Consultation room','room',1,1);
    db.prepare('INSERT OR IGNORE INTO resources VALUES (?,?,?,?,?,?,?)').run('equipment-1','org-1','loc-1','Ultrasound','equipment',1,1);
    db.prepare('INSERT OR IGNORE INTO staff_services VALUES (?,?)').run('staff-1','svc-1');
    for (let weekday=1; weekday<=5; weekday++) db.prepare('INSERT OR IGNORE INTO availability_rules VALUES (?,?,?,?,?,?,?,?)').run(`rule-${weekday}`,'org-1','staff-1',weekday,'09:00','17:00','2025-01-01','2030-12-31');
  }); seedTx();
}
