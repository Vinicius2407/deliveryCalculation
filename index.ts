import { FastifyServer } from './src/routes/server';
import { createConnection } from './src/db/db';


createConnection();
const server = new FastifyServer();
server.start(3000);



