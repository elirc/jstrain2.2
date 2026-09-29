import { afterEach } from 'vitest';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import { migrate,openDb,seed,type Db } from '../apps/api/src/db.js';
const cleanups:string[]=[];afterEach(()=>{for(const file of cleanups.splice(0))for(const suffix of ['','-shm','-wal'])fs.rmSync(file+suffix,{force:true});});
export function testDb():Db{const file=path.join(os.tmpdir(),`schedule-${crypto.randomUUID()}.db`);cleanups.push(file);const db=openDb(file);migrate(db);seed(db);return db;}
export function nextWeekday(now=new Date()):string{const d=new Date(now);do{d.setUTCDate(d.getUTCDate()+1);}while([0,6].includes(d.getUTCDay()));return d.toISOString().slice(0,10);}
