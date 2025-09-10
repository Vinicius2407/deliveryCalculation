// @ts-ignore
/// <reference path="../../fastify.d.ts" />

import { randomUUID } from 'crypto';
import * as csv from 'fast-csv';
import { FastifyInstance } from 'fastify';
import { Classificacao, getDb, TaxaFrete } from '../db/db';
import { parseCsvStream } from '../functions/csvHelpers';
import { getAddressByZipcode } from '../integrations/viaCepIntegration';
import { Quote, RequestIntegration, ResponseIntegration } from '../types/integrations/yampiTypes';

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

    fastify.post('calculo-frete', async (request, reply) => {
        const requestBodyIntegration = request.body as RequestIntegration;
        const db = getDb();

        const cityViaCep = await getAddressByZipcode(requestBodyIntegration.zipcode);

        if (!cityViaCep || !cityViaCep.uf || !cityViaCep.localidade) {
            return reply.status(400).send({ message: 'CEP inválido ou não encontrado.' });
        }

        const classificacaoMunicipios = db.data.taxasFrete.find(t => t.uf.toLowerCase() === cityViaCep.uf.toLowerCase() && t.municipios.toLowerCase() === cityViaCep.localidade.toLowerCase());

        const pricesPerKg = db.data.fretePrecos.filter(p => p.UF == classificacaoMunicipios?.uf && p.classificacao.toLowerCase() === (classificacaoMunicipios?.classificacao.toLowerCase() ?? Classificacao.CAPITAL.toLowerCase()));

        if (pricesPerKg.length === 0) {
            return reply.status(400).send({ message: 'Nenhuma tabela de frete encontrada para a localidade.' });
        }

        if (pricesPerKg.length === 0 || !pricesPerKg[0]!.precos_por_kg) {
            return reply.status(400).send({ message: 'Nenhuma tabela de frete encontrada para a localidade.' });
        }

        const totalWeight = requestBodyIntegration.skus.reduce((acc, sku) => acc + sku.weight * sku.quantity, 0);

        const precosObj = pricesPerKg[0]!.precos_por_kg;
        const pesosDasFaixas = Object.keys(precosObj);
        const faixasOrdenadas = pesosDasFaixas.map(p => parseFloat(p)).sort((a, b) => a - b);
        const faixaEncontrada = faixasOrdenadas.find(pesoDaFaixa => totalWeight <= pesoDaFaixa);

        let valorDoFrete = null;

        if (faixaEncontrada !== undefined) {
            valorDoFrete = precosObj[faixaEncontrada];
        }

        if (valorDoFrete === null) {
            return reply.status(400).send({ message: `O peso total de ${totalWeight}kg excede o limite de frete para esta região.` });
        }

        const retornoPrecos: ResponseIntegration = new ResponseIntegration();
        const quote: Quote = new Quote();
        quote.name = "Tabela Fedex";
        quote.service = "FEDEX";
        quote.price = valorDoFrete!;
        quote.days = 13; // Prazo fixo de entrega
        quote.quote_id = randomUUID();
        quote.free_shipment = requestBodyIntegration.amount >= 150; // Frete grátis para compras acima de 150

        retornoPrecos.quotes.push(quote);

        return reply.send(retornoPrecos);
    });
}