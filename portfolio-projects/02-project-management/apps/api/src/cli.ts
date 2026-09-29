import { existsSync, rmSync } from 'node:fs';
import { config } from './config.js';import { openDatabase,migrate,seed } from './db.js';
const command=process.argv[2],path=config().DATABASE_PATH;if(command==='reset'&&path!==':memory:'&&existsSync(path))rmSync(path);const db=openDatabase(path);migrate(db);if(command==='seed'||command==='reset')seed(db);db.close();console.log(JSON.stringify({event:`database.${command}`,path}));
