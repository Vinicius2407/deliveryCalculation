import fastifyMultipart from '@fastify/multipart';
import staticPlugin from '@fastify/static';
import fastify, { FastifyReply, FastifyRequest } from 'fastify';
import path from 'path';
import { routes } from './routes';

export class FastifyServer {
    private app = fastify({ logger: true });

    private async setup() {
        this.app.register(fastifyMultipart);

        this.app.register(require('@fastify/jwt'), { secret: 'faksldjf;alksjdfl;k3j2l;fj2;lfja;lkfj;saldkf' });

        this.app.decorate("authenticate",
            async function (request: FastifyRequest, reply: FastifyReply) {
                try {
                    await request.jwtVerify()
                } catch (err) {
                    reply.send(err)
                }
            });

        this.app.register(staticPlugin, {
            root: path.join(__dirname, '..', 'public'), // Caminho para a pasta 'public'
            prefix: '/', // Opcional: sirva a partir da raiz do site
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
