import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { randomUUID } from 'node:crypto';
import { ZodError, type ZodType } from 'zod';
import { AttachmentCreate, CommentCreate, InviteCreate, ListQuery, ProjectCreate, SavedViewCreate, TaskCreate, TaskMove, TaskUpdate } from '../../../packages/contracts/src/index.js';
import { Repository, Conflict, Forbidden, NotFound, type Identity } from './repository.js';

type Handler = (req:IncomingMessage,res:ServerResponse,ctx:Identity,url:URL,params:Record<string,string>)=>Promise<void>|void;
type Route={method:string;pattern:RegExp;keys:string[];handler:Handler;public?:boolean};
const json=(res:ServerResponse,status:number,body:unknown):void=>{res.statusCode=status;res.setHeader('content-type','application/json; charset=utf-8');res.end(JSON.stringify(body));};
async function body<T>(req:IncomingMessage,schema:ZodType<T>):Promise<T>{let raw='';for await(const chunk of req){raw+=String(chunk);if(raw.length>1_000_000)throw new PayloadTooLarge();}let value:unknown;try{value=JSON.parse(raw||'{}');}catch{throw new ZodError([]);}return schema.parse(value);}
class PayloadTooLarge extends Error {}
function route(method:string,path:string,handler:Handler,publicRoute=false):Route{const keys:string[]=[];const pattern=new RegExp(`^${path.replace(/:([A-Za-z]+)/g,(_m,k:string)=>{keys.push(k);return '([^/]+)';})}$`);return{method,pattern,keys,handler,public:publicRoute};}
export function createApp(repo:Repository):Server{
  const routes:Route[]=[
    route('GET','/health/live',(_q,r)=>json(r,200,{status:'ok'}),true),
    route('GET','/health/ready',(_q,r)=>{repo.db.prepare('SELECT 1').get();json(r,200,{status:'ready',database:'ok'});},true),
    route('GET','/api/me',(_q,r,c)=>json(r,200,{userId:c.userId,organizationId:c.orgId,role:c.role,organizations:repo.organizations(c.userId)})),
    route('GET','/api/projects',(_q,r,c,u)=>json(r,200,{items:repo.projects(c,u.searchParams.get('q')??'')})),
    route('POST','/api/projects',async(q,r,c)=>json(r,201,repo.createProject(c,await body(q,ProjectCreate)))),
    route('GET','/api/boards/:id',(_q,r,c,_u,p)=>json(r,200,repo.board(c,p.id!))),
    route('GET','/api/tasks',(_q,r,c,u)=>{const parsed=ListQuery.parse(Object.fromEntries(u.searchParams));const projectId=u.searchParams.get('projectId');if(!projectId)throw new ZodError([]);json(r,200,repo.tasks(c,{projectId,...parsed}));}),
    route('POST','/api/tasks',async(q,r,c)=>json(r,201,repo.createTask(c,await body(q,TaskCreate)))),
    route('PATCH','/api/tasks/:id',async(q,r,c,_u,p)=>json(r,200,repo.updateTask(c,p.id!,await body(q,TaskUpdate)))),
    route('POST','/api/tasks/:id/move',async(q,r,c,_u,p)=>json(r,200,repo.moveTask(c,p.id!,await body(q,TaskMove)))),
    route('POST','/api/tasks/:id/comments',async(q,r,c,_u,p)=>{const x=await body(q,CommentCreate);json(r,201,repo.addComment(c,p.id!,x.body));}),
    route('POST','/api/tasks/:id/attachments',async(q,r,c,_u,p)=>json(r,202,repo.attachment(c,p.id!,await body(q,AttachmentCreate)))),
    route('POST','/api/projects/:id/saved-views',async(q,r,c,_u,p)=>json(r,201,repo.savedView(c,p.id!,await body(q,SavedViewCreate)))),
    route('GET','/api/projects/:id/activities',(_q,r,c,_u,p)=>json(r,200,{items:repo.activities(c,p.id!)})),
    route('GET','/api/notifications',(_q,r,c)=>json(r,200,{items:repo.notifications(c)})),
    route('POST','/api/invitations',async(q,r,c)=>json(r,201,repo.invite(c,await body(q,InviteCreate))))
  ];
  return createServer(async(req,res)=>{const correlationId=typeof req.headers['x-correlation-id']==='string'?req.headers['x-correlation-id'].slice(0,100):randomUUID();res.setHeader('x-correlation-id',correlationId);res.setHeader('access-control-allow-origin','http://localhost:5202');res.setHeader('access-control-allow-headers','authorization,content-type,x-organization-id,x-correlation-id');if(req.method==='OPTIONS'){res.statusCode=204;res.end();return;}try{const url=new URL(req.url??'/','http://localhost');const found=routes.map(r=>({r,m:r.pattern.exec(url.pathname)})).find(x=>x.m&&x.r.method===req.method);if(!found){json(res,404,{error:{code:'NOT_FOUND',message:'Route not found',correlationId}});return;}let ctx={} as Identity;if(!found.r.public){const auth=req.headers.authorization;const org=req.headers['x-organization-id'];if(!auth?.startsWith('Bearer ')||typeof org!=='string')throw new Forbidden('Authentication is required');ctx=repo.authenticate(auth.slice(7),org);}const params=Object.fromEntries(found.r.keys.map((k,i)=>[k,decodeURIComponent(found.m![i+1]??'')]));await found.r.handler(req,res,ctx,url,params);console.log(JSON.stringify({level:'info',event:'http.request',correlationId,method:req.method,path:url.pathname,status:res.statusCode}));}catch(e){let status=500,code='INTERNAL',message='Unexpected server error',details:unknown;if(e instanceof ZodError){status=422;code='VALIDATION';message='Request validation failed';details=e.issues;}else if(e instanceof Forbidden){status=404;code='NOT_FOUND';message='Resource is not available';}else if(e instanceof NotFound){status=404;code='NOT_FOUND';message='Resource is not available';}else if(e instanceof Conflict){status=409;code=e.code;message=e.message;details=e.current;}else if(e instanceof PayloadTooLarge){status=413;code='PAYLOAD_TOO_LARGE';message='Request exceeds the 1 MB limit';}else if(e instanceof Error&&e.message.includes('UNIQUE constraint')){status=409;code='CONFLICT';message='A resource with that unique value already exists';}json(res,status,{error:{code,message,correlationId,...(details===undefined?{}:{details})}});console.error(JSON.stringify({level:'error',event:'http.error',correlationId,code,status}));}});
}
