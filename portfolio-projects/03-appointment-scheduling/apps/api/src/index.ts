import { createServer } from 'node:http';
import { createApp } from './app.js';
import { migrate, openDb, seed } from './db.js';
import { config } from './config.js';
const settings=config();const port=settings.PORT;const db=openDb(settings.DATABASE_PATH);migrate(db);seed(db);const server=createServer(createApp(db));server.listen(port,()=>console.log(JSON.stringify({level:'info',event:'api_listening',port})));
let stopping=false;function shutdown(signal:string){if(stopping)return;stopping=true;console.log(JSON.stringify({level:'info',event:'shutdown_started',signal}));server.close(()=>{db.close();console.log(JSON.stringify({level:'info',event:'shutdown_complete'}));process.exit(0);});setTimeout(()=>process.exit(1),10_000).unref();}process.on('SIGTERM',()=>shutdown('SIGTERM'));process.on('SIGINT',()=>shutdown('SIGINT'));
