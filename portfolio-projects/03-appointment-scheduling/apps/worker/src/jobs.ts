import type { Db } from '../../api/src/db.js';
export type Delivery=(message:{reminderId:string;appointmentId:string;channel:string})=>Promise<void>;
export async function runOnce(db:Db,now:Date,deliver:Delivery=async()=>{}):Promise<{expiredHolds:number;delivered:number;retried:number;dead:number}>{
  const expired=db.prepare("UPDATE holds SET state='expired' WHERE state='active' AND expires_at<=?").run(now.toISOString()).changes;let delivered=0,retried=0,dead=0;
  const due=db.prepare("SELECT * FROM reminders WHERE state='pending' AND scheduled_at<=? ORDER BY scheduled_at LIMIT 50").all(now.toISOString()) as {id:string;appointment_id:string;channel:string;attempts:number}[];
  for(const reminder of due){try{await deliver({reminderId:reminder.id,appointmentId:reminder.appointment_id,channel:reminder.channel});db.prepare("UPDATE reminders SET state='delivered',attempts=attempts+1,last_error=NULL WHERE id=? AND state='pending'").run(reminder.id);delivered++;}catch(error){const attempts=reminder.attempts+1;const state=attempts>=3?'dead':'pending';const delay=Math.min(2**attempts*60_000,15*60_000);db.prepare('UPDATE reminders SET state=?,attempts=?,scheduled_at=?,last_error=? WHERE id=?').run(state,attempts,new Date(now.getTime()+delay).toISOString(),error instanceof Error?error.message:'delivery failure',reminder.id);if(state==='dead')dead++;else retried++;}}
  return {expiredHolds:expired,delivered,retried,dead};
}
