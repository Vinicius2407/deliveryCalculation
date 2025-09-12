
import { FastifyRequest, FastifyReply } from 'fastify';
import { FreightService } from '../services/freightService.js';
import { RequestIntegration } from '../types/integrations/yampiTypes.js';
import crypto from 'node:crypto';

/**
 * @class FreightController
 * @description Handles freight-related requests.
 */
export class FreightController {
    /**
     * @constructor
     * @param {FreightService} freightService - The freight service.
     */
    constructor(private freightService: FreightService) {}

    /**
     * @method uploadTaxasFrete
     * @description Uploads freight rates from a CSV file.
     * @param {FastifyRequest} request - The request object.
     * @param {FastifyReply} reply - The reply object.
     */
    async uploadTaxasFrete(request: FastifyRequest, reply: FastifyReply) {
        const data = await request.file();
        if (!data) {
            return reply.status(400).send({ message: 'Arquivo não encontrado' });
        }

        try {
            const result = await this.freightService.uploadTaxasFrete(data);
            reply.send(result);
        } catch (error) {
            reply.status(500).send({ message: 'Erro ao processar o arquivo' });
        }
    }

    /**
     * @method uploadParsePrecos
     * @description Uploads and parses freight prices from a CSV file.
     * @param {FastifyRequest} request - The request object.
     * @param {FastifyReply} reply - The reply object.
     */
    async uploadParsePrecos(request: FastifyRequest, reply: FastifyReply) {
        const data = await request.file();
        if (!data) {
            return reply.status(400).send({ error: 'Nenhum arquivo foi enviado.' });
        }

        try {
            const result = await this.freightService.uploadParsePrecos(data);
            return reply.send(result);
        } catch (error) {
            return reply.status(500).send({
                error: 'Ocorreu um erro ao processar o arquivo.',
            });
        }
    }

    /**
     * @method calculoFrete
     * @description Calculates the freight cost after validating the HMAC signature.
     * @param {FastifyRequest} request - The request object.
     * @param {FastifyReply} reply - The reply object.
     */
    async calculoFrete(request: FastifyRequest, reply: FastifyReply) {
        const secret = process.env.YAMPI_SECRET_KEY;
        if (!secret) {
            request.log.error('YAMPI_SECRET_KEY não foi definido no .env');
            return reply.status(500).send({ message: 'Erro de configuração interna do servidor.' });
        }

        const yampiSignature = request.headers['x-yampi-hmac-sha256'];
        if (!yampiSignature) {
            return reply.status(400).send({ message: 'Cabeçalho X-Yampi-Hmac-SHA256 ausente.' });
        }

        const rawBody = (request as any).rawBody;
        if (typeof rawBody !== 'string') {
            return reply.status(500).send({ message: 'Não foi possível ler o corpo da requisição.' });
        }

        const calculatedSignature = crypto
            .createHmac('sha256', secret)
            .update(rawBody)
            .digest('base64');

        if (calculatedSignature !== yampiSignature) {
            return reply.status(403).send({ message: 'Assinatura inválida.' });
        }

        // Se a assinatura for válida, continue com a lógica original
        const requestBodyIntegration = request.body as RequestIntegration;

        try {
            const result = await this.freightService.calculoFrete(requestBodyIntegration);
            return reply.send(result);
        } catch (error: any) {
            return reply.status(400).send({ message: error.message });
        }
    }
}
