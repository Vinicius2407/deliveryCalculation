import 'dotenv/config';
import { FastifyServer } from './routes/server.js';
import { createConnection } from './db/db.js';

createConnection();
const server = new FastifyServer();
server.start(3000);