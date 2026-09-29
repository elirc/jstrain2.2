import type { DatabaseSync } from 'node:sqlite';
import { uid, hash } from './db.js';
import { can, assertWip, rankBetween, DomainError, type Action, type OrgRole } from '../../../packages/domain/src/index.js';
import type { TaskCreateInput, TaskMoveInput } from '../../../packages/contracts/src/index.js';

export type Identity = { userId: string; orgId: string; role: OrgRole };
type Cell = string | number | bigint | null | Uint8Array;
type Row = Record<string, unknown>;
export class NotFound extends Error {}
export class Forbidden extends Error {}
export class Conflict extends Error { constructor(public code: string, message: string, public current?: unknown) { super(message); } }

export class Repository {
  constructor(readonly db: DatabaseSync, private clock: () => Date = () => new Date()) {}
  now(): string { return this.clock().toISOString(); }
  authenticate(token: string, orgId: string): Identity {
    const row = this.db.prepare(`SELECT s.user_id userId,m.org_id orgId,m.role FROM sessions s JOIN memberships m ON m.user_id=s.user_id WHERE s.token_hash=? AND m.org_id=? AND m.state='active' AND s.expires_at>?`).get(hash(token),orgId,this.now()) as Row|undefined;
    if (!row) throw new Forbidden('Authentication or membership is invalid');
    return row as Identity;
  }
  authorize(ctx: Identity, action: Action, projectId?: string): void {
    if (!can(ctx.role, action)) throw new Forbidden('Resource is not available');
    if (projectId) {
      const project=this.db.prepare('SELECT id FROM projects WHERE id=? AND org_id=?').get(projectId,ctx.orgId);
      if (!project) throw new Forbidden('Resource is not available');
      if (ctx.role==='guest') {
        const grant=this.db.prepare('SELECT 1 FROM project_members WHERE project_id=? AND user_id=?').get(projectId,ctx.userId);
        if (!grant) throw new Forbidden('Resource is not available');
      }
    }
  }
  organizations(userId: string): Row[] { return this.db.prepare(`SELECT o.id,o.slug,o.name,m.role FROM memberships m JOIN organizations o ON o.id=m.org_id WHERE m.user_id=? AND m.state='active' ORDER BY o.name,o.id`).all(userId) as Row[]; }
  projects(ctx: Identity, q=''): Row[] {
    this.authorize(ctx,'task:read'); const guest=ctx.role==='guest';
    return this.db.prepare(`SELECT p.id,p.project_key projectKey,p.name,p.archived_at archivedAt,p.updated_at updatedAt FROM projects p ${guest?'JOIN project_members pm ON pm.project_id=p.id AND pm.user_id=?':''} WHERE p.org_id=? AND p.archived_at IS NULL AND p.name LIKE ? ORDER BY p.name,p.id LIMIT 100`).all(...(guest?[ctx.userId]:[]),ctx.orgId,`%${q}%`) as Row[];
  }
  createProject(ctx: Identity, input:{key:string;name:string}): Row { this.authorize(ctx,'org:admin'); const id=uid(),now=this.now(); this.db.prepare('INSERT INTO projects VALUES(?,?,?,?,?,?,?,?)').run(id,ctx.orgId,input.key,input.name,null,1,now,now); this.activity(ctx,id,null,'project.created',{key:input.key}); return {id,projectKey:input.key,name:input.name,archivedAt:null,updatedAt:now}; }
  board(ctx: Identity, boardId: string): Row {
    const board=this.db.prepare('SELECT id,project_id projectId,name FROM boards WHERE id=? AND org_id=?').get(boardId,ctx.orgId) as Row|undefined;
    if (!board) throw new NotFound(); this.authorize(ctx,'task:read',String(board.projectId));
    const columns=this.db.prepare('SELECT id,name,rank,wip_limit wipLimit FROM columns WHERE board_id=? AND org_id=? ORDER BY rank,id').all(boardId,ctx.orgId) as Row[];
    const tasks=this.db.prepare(`SELECT id,project_id projectId,column_id columnId,task_number taskNumber,title,description,priority,rank,version,due_at dueAt,updated_at updatedAt FROM tasks WHERE org_id=? AND project_id=? AND archived_at IS NULL ORDER BY column_id,rank,id`).all(ctx.orgId,String(board.projectId)) as Row[];
    return {...board,columns:columns.map(c=>({...c,tasks:tasks.filter(t=>t.columnId===c.id)}))};
  }
  tasks(ctx: Identity, input:{projectId:string;q?:string|undefined;state?:string|undefined;priority?:string|undefined;page:number;pageSize:number;sort:string}): {items:Row[];page:number;pageSize:number;total:number} {
    this.authorize(ctx,'task:read',input.projectId); const where=['t.org_id=?','t.project_id=?','t.archived_at IS NULL']; const args:Cell[]=[ctx.orgId,input.projectId];
    if(input.q){where.push('(t.title LIKE ? OR t.description LIKE ?)');args.push(`%${input.q}%`,`%${input.q}%`);} if(input.state){where.push('c.name=?');args.push(input.state);} if(input.priority){where.push('t.priority=?');args.push(input.priority);}
    const count=(this.db.prepare(`SELECT COUNT(*) total FROM tasks t JOIN columns c ON c.id=t.column_id WHERE ${where.join(' AND ')}`).get(...args) as {total:number}).total;
    const order=input.sort==='updated'?'t.updated_at DESC,t.id':input.sort==='due'?'t.due_at IS NULL,t.due_at,t.id':'t.rank,t.id';
    const items=this.db.prepare(`SELECT t.id,t.task_number taskNumber,t.title,t.description,t.priority,t.column_id columnId,c.name state,t.version,t.rank,t.due_at dueAt,t.updated_at updatedAt FROM tasks t JOIN columns c ON c.id=t.column_id WHERE ${where.join(' AND ')} ORDER BY ${order} LIMIT ? OFFSET ?`).all(...args,input.pageSize,(input.page-1)*input.pageSize) as Row[];
    return {items,page:input.page,pageSize:input.pageSize,total:count};
  }
  createTask(ctx: Identity, input: TaskCreateInput): Row {
    this.authorize(ctx,'task:write',input.projectId); const column=this.db.prepare('SELECT c.id,c.wip_limit wipLimit,(SELECT COUNT(*) FROM tasks t WHERE t.column_id=c.id AND t.archived_at IS NULL) current FROM columns c JOIN boards b ON b.id=c.board_id WHERE c.id=? AND c.org_id=? AND b.project_id=?').get(input.columnId,ctx.orgId,input.projectId) as Row|undefined; if(!column) throw new NotFound(); assertWip(Number(column.current),column.wipLimit===null?null:Number(column.wipLimit),false);
    this.db.exec('BEGIN IMMEDIATE'); try { const p=this.db.prepare('SELECT next_task_number n FROM projects WHERE id=? AND org_id=?').get(input.projectId,ctx.orgId) as {n:number}; this.db.prepare('UPDATE projects SET next_task_number=next_task_number+1,updated_at=? WHERE id=? AND org_id=?').run(this.now(),input.projectId,ctx.orgId); const max=this.db.prepare('SELECT MAX(rank) r FROM tasks WHERE column_id=? AND org_id=?').get(input.columnId,ctx.orgId) as {r:number|null}; const id=uid(),now=this.now(),rank=(max.r??0)+1024; this.db.prepare('INSERT INTO tasks VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(id,ctx.orgId,input.projectId,input.columnId,p.n,input.title,input.description,input.priority,rank,1,ctx.userId,input.dueAt,null,now,now); this.activity(ctx,input.projectId,id,'task.created',{taskNumber:p.n}); this.db.exec('COMMIT'); return {...input,id,taskNumber:p.n,rank,version:1,updatedAt:now}; } catch(e){this.db.exec('ROLLBACK');throw e;}
  }
  updateTask(ctx: Identity, taskId:string, input:Record<string,unknown>&{version:number}): Row {
    const current=this.taskForWrite(ctx,taskId); const allowed=['title','description','priority','dueAt']; const sets:string[]=[];const args:Cell[]=[]; const names:Record<string,string>={dueAt:'due_at'}; for(const k of allowed) if(k in input){sets.push(`${names[k]??k}=?`);args.push(input[k] as Cell);} if(!sets.length)return current; sets.push('version=version+1','updated_at=?');args.push(this.now(),taskId,ctx.orgId,input.version);
    const result=this.db.prepare(`UPDATE tasks SET ${sets.join(',')} WHERE id=? AND org_id=? AND version=? AND archived_at IS NULL`).run(...args); if(result.changes===0){const fresh=this.db.prepare('SELECT * FROM tasks WHERE id=? AND org_id=?').get(taskId,ctx.orgId);throw new Conflict('VERSION_CONFLICT','Task changed since it was opened',fresh);} this.activity(ctx,String(current.projectId),taskId,'task.updated',{fields:allowed.filter(k=>k in input)}); return this.db.prepare('SELECT id,project_id projectId,column_id columnId,task_number taskNumber,title,description,priority,rank,version,due_at dueAt,updated_at updatedAt FROM tasks WHERE id=? AND org_id=?').get(taskId,ctx.orgId) as Row;
  }
  moveTask(ctx:Identity,taskId:string,input:TaskMoveInput):Row {
    const existing=this.db.prepare('SELECT response_json response FROM idempotency_keys WHERE org_id=? AND scope=? AND key=?').get(ctx.orgId,`move:${taskId}`,input.idempotencyKey) as {response:string}|undefined;if(existing)return JSON.parse(existing.response) as Row;
    this.db.exec('BEGIN IMMEDIATE'); try {const task=this.taskForWrite(ctx,taskId);if(Number(task.version)!==input.version)throw new Conflict('VERSION_CONFLICT','Task changed since it was opened',task);const col=this.db.prepare(`SELECT c.id,b.project_id projectId,c.wip_limit wipLimit,(SELECT COUNT(*) FROM tasks x WHERE x.org_id=c.org_id AND x.column_id=c.id AND x.archived_at IS NULL) current FROM columns c JOIN boards b ON b.id=c.board_id WHERE c.id=? AND c.org_id=?`).get(input.targetColumnId,ctx.orgId) as Row|undefined;if(!col||col.projectId!==task.projectId)throw new NotFound();assertWip(Number(col.current),col.wipLimit===null?null:Number(col.wipLimit),task.columnId===input.targetColumnId);
      const before=input.beforeTaskId?this.rank(ctx,input.beforeTaskId,input.targetColumnId):null;const after=input.afterTaskId?this.rank(ctx,input.afterTaskId,input.targetColumnId):null;let rank:number;if(input.beforeTaskId) {const next=this.db.prepare('SELECT MIN(rank) r FROM tasks WHERE org_id=? AND column_id=? AND rank>?').get(ctx.orgId,input.targetColumnId,before) as {r:number|null};rank=rankBetween(before,next.r);} else if(input.afterTaskId){const prev=this.db.prepare('SELECT MAX(rank) r FROM tasks WHERE org_id=? AND column_id=? AND rank<?').get(ctx.orgId,input.targetColumnId,after) as {r:number|null};rank=rankBetween(prev.r,after);} else {const max=this.db.prepare('SELECT MAX(rank) r FROM tasks WHERE org_id=? AND column_id=?').get(ctx.orgId,input.targetColumnId) as {r:number|null};rank=rankBetween(max.r,null);}
      this.db.prepare('UPDATE tasks SET column_id=?,rank=?,version=version+1,updated_at=? WHERE id=? AND org_id=?').run(input.targetColumnId,rank,this.now(),taskId,ctx.orgId);const response=this.db.prepare('SELECT id,column_id columnId,rank,version,updated_at updatedAt FROM tasks WHERE id=?').get(taskId) as Row;this.activity(ctx,String(task.projectId),taskId,'task.moved',{toColumnId:input.targetColumnId});this.db.prepare('INSERT INTO idempotency_keys VALUES(?,?,?,?,?)').run(ctx.orgId,`move:${taskId}`,input.idempotencyKey,JSON.stringify(response),this.now());this.db.exec('COMMIT');return response;
    }catch(e){this.db.exec('ROLLBACK');if(e instanceof DomainError)throw new Conflict(e.code,e.message);throw e;}
  }
  addComment(ctx:Identity,taskId:string,body:string):Row{const task=this.taskForWrite(ctx,taskId);this.authorize(ctx,'comment:write',String(task.projectId));const id=uid(),now=this.now();this.db.prepare('INSERT INTO comments VALUES(?,?,?,?,?,?,?,?)').run(id,ctx.orgId,taskId,ctx.userId,body,now,null,null);this.activity(ctx,String(task.projectId),taskId,'comment.created',{});return{id,taskId,body,createdAt:now};}
  attachment(ctx:Identity,taskId:string,input:{fileName:string;contentType:string;size:number;checksum:string}):Row{const task=this.taskForWrite(ctx,taskId);this.authorize(ctx,'attachment:write',String(task.projectId));const id=uid(),now=this.now(),objectKey=`${ctx.orgId}/${String(task.projectId)}/${id}`;this.db.exec('BEGIN');try{this.db.prepare('INSERT INTO attachments VALUES(?,?,?,?,?,?,?,?,?,?,?)').run(id,ctx.orgId,taskId,ctx.userId,input.fileName,input.contentType,input.size,input.checksum,objectKey,'pending',now);this.db.prepare('INSERT INTO jobs VALUES(?,?,?,?,?,?,?,?,?,?)').run(uid(),ctx.orgId,'attachment.scan',JSON.stringify({attachmentId:id}),`scan:${id}`,'pending',0,now,null,now);this.activity(ctx,String(task.projectId),taskId,'attachment.created',{attachmentId:id});this.db.exec('COMMIT');return{id,...input,scanState:'pending',createdAt:now};}catch(e){this.db.exec('ROLLBACK');throw e;}}
  savedView(ctx:Identity,projectId:string,input:{name:string;visibility:string;filters:unknown;sort:string}):Row{this.authorize(ctx,'task:read',projectId);if(input.visibility==='project'&&!can(ctx.role,'project:configure'))throw new Forbidden('Project-visible views require manager permission');const id=uid(),now=this.now();this.db.prepare('INSERT INTO saved_views VALUES(?,?,?,?,?,?,?,?,?)').run(id,ctx.orgId,projectId,ctx.userId,input.name,input.visibility,JSON.stringify(input.filters),input.sort,now);return{id,projectId,...input,createdAt:now};}
  activities(ctx:Identity,projectId:string):Row[]{this.authorize(ctx,'task:read',projectId);return this.db.prepare('SELECT id,task_id taskId,actor_id actorId,action,metadata_json metadata,occurred_at occurredAt FROM activities WHERE org_id=? AND project_id=? ORDER BY occurred_at DESC,id DESC LIMIT 100').all(ctx.orgId,projectId) as Row[];}
  notifications(ctx:Identity):Row[]{return this.db.prepare('SELECT id,dedupe_key dedupeKey,state,created_at createdAt FROM notifications WHERE org_id=? AND recipient_id=? ORDER BY created_at DESC LIMIT 100').all(ctx.orgId,ctx.userId) as Row[];}
  invite(ctx:Identity,input:{email:string;role:string;expiresInHours:number}):Row{this.authorize(ctx,'org:admin');const id=uid(),token=uid(),expires=new Date(this.clock().getTime()+input.expiresInHours*3600000).toISOString();this.db.prepare('INSERT INTO invitations VALUES(?,?,?,?,?,?,?,?,?)').run(id,ctx.orgId,input.email,input.role,hash(token),expires,null,null,ctx.userId);this.activity(ctx,null,null,'invitation.created',{role:input.role});return{id,email:input.email,role:input.role,expiresAt:expires,token};}
  private taskForWrite(ctx:Identity,taskId:string):Row{const t=this.db.prepare('SELECT id,project_id projectId,column_id columnId,version,archived_at archivedAt FROM tasks WHERE id=? AND org_id=?').get(taskId,ctx.orgId) as Row|undefined;if(!t||t.archivedAt)throw new NotFound();this.authorize(ctx,'task:write',String(t.projectId));return t;}
  private rank(ctx:Identity,taskId:string,columnId:string):number{const r=this.db.prepare('SELECT rank FROM tasks WHERE id=? AND org_id=? AND column_id=?').get(taskId,ctx.orgId,columnId) as {rank:number}|undefined;if(!r)throw new NotFound();return r.rank;}
  private activity(ctx:Identity,projectId:string|null,taskId:string|null,action:string,metadata:unknown):number{const result=this.db.prepare('INSERT INTO activities(org_id,project_id,task_id,actor_id,action,metadata_json,occurred_at) VALUES(?,?,?,?,?,?,?)').run(ctx.orgId,projectId,taskId,ctx.userId,action,JSON.stringify(metadata),this.now());const activityId=Number(result.lastInsertRowid);const hooks=this.db.prepare('SELECT id FROM webhooks WHERE org_id=? AND active=1').all(ctx.orgId) as {id:string}[];for(const hook of hooks)this.db.prepare('INSERT OR IGNORE INTO webhook_deliveries VALUES(?,?,?,?,?,?,?)').run(uid(),hook.id,activityId,0,'pending',this.now(),null);return activityId;}
}
