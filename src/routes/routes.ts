// @ts-ignore
/// <reference path="../../fastify.d.ts" />

import { randomUUID } from 'crypto';
import * as csv from 'fast-csv';
import { FastifyInstance } from 'fastify';

import { Classificacao, getDb, TaxaFrete } from '../db/db';
import { parseCsvStream } from '../functions/csvHelpers';

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
            const classificacao = Classificacao[chunk['Classificacao'] as keyof typeof Classificacao] ?? Classificacao.CAPITAL;
            taxas.push({
                id: randomUUID(),
                uf: chunk['UF'],
                municipios: chunk['Municipios'],
                classificacao: classificacao,
            });
        }

        db.data.taxasFrete.push(...taxas);
        await db.write();

        reply.send({ message: `${taxas.length} registros adicionados` });
    });

    fastify.post('/upload/parse-precos', async (request, reply) => {
        try {
            const data = await request.file();
            if (!data) {
                return reply.status(400).send({ error: 'Nenhum arquivo foi enviado.' });
            }

            console.log(`Recebendo arquivo para parsing de preços: ${data.filename}`);
            const dadosPrecos = await parseCsvStream(data.file);

            const db = getDb();
            db.data.fretePrecos = [];
            db.data.fretePrecos.push(...dadosPrecos);
            await db.write();

            return reply.send({
                message: `${dadosPrecos.length} registros de preços salvos com sucesso!`,
                filename: data.filename,
            });
        } catch (error: any & { message: string }) { // @ts-ignore
            console.error('Erro no upload de preços:', error.message);
            return reply.status(500).send({
                error: 'Ocorreu um erro ao processar o arquivo.',
                details: error.message,
            });
        }
    });
}
