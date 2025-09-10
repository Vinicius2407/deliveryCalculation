// @ts-ignore
/// <reference path="../../fastify.d.ts" />

import { FastifyInstance } from 'fastify';
import { randomUUID } from 'crypto';
import * as csv from 'fast-csv';
import { Classificacao, getDb, TaxaFrete } from '../db/db';
import { parseCsvStream } from '../functions/csvHelpers';

export async function routes(fastify: FastifyInstance) {
    fastify.post('/login', async (request, reply) => {
        const { email, password } = request.headers as { email: string, password: string };
        const db = getDb();
        const user = db.data.users.find(user => user.email === email && user.password === password);

        if (user) {
            const token = fastify.jwt.sign({ email: user.email }, { expiresIn: '8h' });
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
        } catch (error) {
            return reply.status(500).send({
                error: 'Ocorreu um erro ao processar o arquivo.',
            });
        }
    });

    // fastify.post('calculo-frete', async (request, reply) => {
    //     const { } = request.body as { uf: string, peso_kg: number, classificacao: string };
    //     const db = getDb();
    //     const taxa = db.data.taxasFrete.find(t => t.uf === uf && t.classificacao === classificacao);

    //     if (!taxa) {
    //         return reply.status(404).send({ message: 'Taxa de frete não encontrada para os parâmetros fornecidos.' });
    //     }

    //     const precoEntry = db.data.fretePrecos.find(p => p.UF === uf && p.classificacao === classificacao);
    //     if (!precoEntry) {
    //         return reply.status(404).send({ message: 'Preço de frete não encontrado para os parâmetros fornecidos.' });
    //     }

    //     const precoPorKg = precoEntry.precos_por_kg[peso_kg.toString()];
    //     if (precoPorKg === undefined) {
    //         return reply.status(400).send({ message: 'Preço por kg não disponível para o peso fornecido.' });
    //     }

    //     const custoFrete = precoPorKg * peso_kg;

    //     return reply.send({
    //         uf,
    //         peso_kg,
    //         classificacao,
    //         custo_frete: custoFrete,
    //         taxa_id: taxa.id,
    //     });
    // });
}