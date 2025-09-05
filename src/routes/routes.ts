// @ts-ignore
/// <reference path="../../fastify.d.ts" />

import { FastifyInstance } from 'fastify';
import { randomUUID } from 'crypto';
import * as csv from 'fast-csv';
import { getDb, TaxaFrete } from '../db/db';

/**
 * Fastify routes for the application.
 * @param fastify The Fastify instance.
 */
export async function routes(fastify: FastifyInstance) {
    fastify.post('/login', {
        schema: {
            description: 'Rota para fazer login e obter um token JWT',
            tags: ['auth'],
            summary: 'Rota para fazer login e obter um token JWT',
            headers: {
                type: 'object',
                properties: {
                    email: { type: 'string' },
                    password: { type: 'string' }
                },
                required: ['email', 'password']
            },
            response: {
                200: {
                    description: 'Sucesso ao fazer login',
                    type: 'object',
                    properties: {
                        token: { type: 'string' }
                    }
                },
                401: {
                    description: 'Credenciais Invalidas',
                    type: 'object',
                    properties: {
                        message: { type: 'string' }
                    }
                }
            }
        }
    }, async (request, reply) => {
        const { email, password } = request.headers as { email: string, password: string };
        const db = getDb();
        const user = db.data.users.find(user => user.email === email && user.password === password);

        if (user) {
            const token = fastify.jwt.sign({ email: user.email });
            return { token };
        }

        reply.status(401).send({ message: 'Credenciais Invalidas' });
    });

    fastify.post('/upload/taxas-frete', {
        schema: {
            description: 'Suba o arquivo com os nomes e regiões das taxas de frete',
            tags: ['taxas-frete'],
            summary: 'Suba o arquivo com os nomes e regiões das taxas de frete',
            headers: {
                type: 'object',
                properties: {
                    authorization: { type: 'string', description: 'Campo para autenticação' },
                },
                required: ['authorization'],
            },
            consumes: ['multipart/form-data'],
            requestBody: {
                required: true,
                content: {
                    'multipart/form-data': {
                        schema: {
                            type: 'object',
                            properties: {
                                file: { type: 'string', format: 'binary' },
                            },
                            required: ['file'],
                        },
                    },
                },
            },
            response: {
                200: {
                    description: 'Resposta bem-sucedida',
                    type: 'object',
                    properties: {
                        message: { type: 'string' },
                    },
                },
                400: {
                    description: 'Arquivo não encontrado',
                    type: 'object',
                    properties: {
                        message: { type: 'string' },
                    },
                },
            },
        },
    }, async (request, reply) => {
        const data = await request.file();
        if (!data) {
            return reply.status(400).send({ message: 'Arquivo não encontrado' });
        }

        const db = getDb();
        db.data.taxasFrete = [];
        await db.write();

        const taxas: TaxaFrete[] = [];

        const stream = data.file.pipe(csv.parse({ headers: true, delimiter: ';' }));

        for await (const chunk of stream) {
            taxas.push({
                id: randomUUID(),
                uf: chunk['UF'],
                municipios: chunk['Municipios'],
                classificacao: chunk['Classificacao'],
            });
        }

        db.data.taxasFrete.push(...taxas);
        await db.write();

        reply.send({ message: `${taxas.length} registros adicionados` });
    });
}
