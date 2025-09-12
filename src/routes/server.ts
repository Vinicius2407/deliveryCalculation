import fastifyJwt from '@fastify/jwt';
import fastifyMultipart from '@fastify/multipart';
import staticPlugin from '@fastify/static';
import Fastify, { FastifyReply, FastifyRequest } from 'fastify';
import path from 'node:path';
import { Readable } from 'node:stream';
import { fileURLToPath } from 'node:url';

import { getDb } from '../db/db.js';
import { routes } from './routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class FastifyServer {
    private app = Fastify({ logger: true });

    private async setup() {
        this.app.addHook('preParsing', (request, reply, payload, done) => {
            const contentType = request.headers['content-type'];

            // Ignora multipart para uploads de arquivo
            if (contentType && contentType.startsWith('multipart/form-data')) {
                return done(null, payload);
            }

            let data = '';
            payload.on('data', (chunk) => {
                data += chunk;
            });

            payload.on('end', () => {
                (request as any).rawBody = data;
                const newStream = Readable.from(data);
                done(null, newStream);
            });

            payload.on('error', (err) => {
                console.error("Erro ao ler o corpo da requisicao:", err);
                // Em caso de erro, passe o erro para o Fastify
                done(err, undefined);
            });
        });

        this.app.addHook('onRequest', async (request, reply) => {
            const db = getDb();
            if (db.data.settings.isBlocked) {
                const allowedRoutes = ['/login', '/admin/toggle-lock'];
                if (!allowedRoutes.includes(request.raw.url!)) {
                    reply.status(503).send({ message: 'Serviço temporariamente indisponível.' });
                }
            }
        });

        this.app.register(fastifyMultipart);

        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET não foi definido no arquivo .env');
        }

        this.app.register(fastifyJwt, { secret: process.env.JWT_SECRET });

        this.app.decorate("authenticate",
            async function (request: FastifyRequest, reply: FastifyReply) {
                try {
                    await request.jwtVerify()
                } catch (err) {
                    reply.send(err)
                }
            });

        this.app.decorate("authenticateAdmin",
            async function (request: FastifyRequest, reply: FastifyReply) {
                try {
                    await request.jwtVerify();
                    const userToken = request.user;
                    const db = getDb();
                    const user = db.data.users.find(u => u.email === userToken.email);

                    if (!user || !user.isAdmin) {
                        reply.status(403).send({ message: 'Acesso negado. Requer privilégios de administrador.' });
                    }
                } catch (err) {
                    reply.send(err)
                }
            });

        this.app.register(staticPlugin, {
            root: path.join(__dirname, '..', 'public'),
            prefix: '/',
        });

        this.app.register(routes);
    }

    async start(port: number) {
        try {
            await this.setup();
            await this.app.ready();
            await this.app.listen({ port });
            console.log(`Server running at http://localhost:${port}`);
        } catch (err) {
            console.error("Error starting server:", err);
            await this.app.close();
            process.exit(1);
        }
    }
}