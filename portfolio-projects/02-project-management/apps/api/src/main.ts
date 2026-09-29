import { config } from './config.js';
import { openDatabase, migrate } from './db.js';
import { Repository } from './repository.js';
import { createApp } from './app.js';
const cfg=config();const db=openDatabase(cfg.DATABASE_PATH);migrate(db);const server=createApp(new Repository(db));server.listen(cfg.PORT,()=>console.log(JSON.stringify({level:'info',event:'api.started',port:cfg.PORT})));
let closing=false;function shutdown(signal:string):void{if(closing)return;closing=true;console.log(JSON.stringify({level:'info',event:'api.shutdown',signal}));server.close(()=>{db.close();process.exit(0);});setTimeout(()=>process.exit(1),10_000).unref();}process.on('SIGTERM',()=>shutdown('SIGTERM'));process.on('SIGINT',()=>shutdown('SIGINT'));
