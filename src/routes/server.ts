import fastifyJwt from '@fastify/jwt';
import fastifyMultipart from '@fastify/multipart';
import staticPlugin from '@fastify/static';
import Fastify, { FastifyReply, FastifyRequest } from 'fastify';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { routes } from './routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class FastifyServer {
    private app = Fastify({ logger: true });

    private async setup() {
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