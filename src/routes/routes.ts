// @ts-ignore
/// <reference path="../../fastify.d.ts" />

import { FastifyInstance } from 'fastify';
import { randomUUID } from 'crypto';
import * as csv from 'fast-csv';
import { getDb, TaxaFrete } from '../db/db';
import { parseCsvStream } from '../functions/csvHelpers';

/**
 * Fastify routes for the application.
 * @param fastify The Fastify instance.
 */
export async function routes(fastify: FastifyInstance) {
    fastify.post('/login', async (request, reply) => {
        const { email, password } = request.headers as { email: string, password: string };
        const db = getDb();
        const user = db.data.users.find(user => user.email === email && user.password === password);

        if (user) {
            const token = fastify.jwt.sign({ email: user.email });
            return { token };
        }

        reply.status(401).send({ message: 'Credenciais Invalidas' });
    });

    fastify.post('/upload/taxas-frete', async (request, reply) => {
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
            const classificacao = 
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

    fastify.get('/api/parse-precos', async (request, reply) => {
        try {
            const data = await request.file();
            if (!data) {
                return reply.status(400).send({ error: 'Nenhum arquivo foi enviado.' });
            }
            console.log(`Recebendo arquivo: ${data.filename}`);
            const dadosPrecos = await parseCsvStream(data.file);
            return reply.send({
                message: 'Arquivo processado com sucesso!',
                filename: data.filename,
                data: dadosPrecos,
            });
        } catch (error) {
            return reply.status(500).send({
                error: 'Ocorreu um erro ao processar o arquivo.',
            });
        }
    });
}
