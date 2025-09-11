
import { FastifyRequest, FastifyReply } from 'fastify';
import { FreightService } from '../services/freightService.js';
import { RequestIntegration } from '../types/integrations/yampiTypes.js';

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
     * @description Calculates the freight cost.
     * @param {FastifyRequest} request - The request object.
     * @param {FastifyReply} reply - The reply object.
     */
    async calculoFrete(request: FastifyRequest, reply: FastifyReply) {
        const requestBodyIntegration = request.body as RequestIntegration;

        try {
            const result = await this.freightService.calculoFrete(requestBodyIntegration);
            return reply.send(result);
        } catch (error: any) {
            return reply.status(400).send({ message: error.message });
        }
    }
}
