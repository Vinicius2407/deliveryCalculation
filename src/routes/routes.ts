// @ts-ignore
/// <reference path="../../fastify.d.ts" />

import { FastifyInstance } from 'fastify';
import { AuthController } from '../controllers/authController.js';
import { FreightController } from '../controllers/freightController.js';
import { AuthService } from '../services/authService.js';
import { FreightService } from '../services/freightService.js';
import { FreightRepository } from '../repositories/freightRepository.js';

export async function routes(fastify: FastifyInstance) {
    const freightRepository = new FreightRepository();
    const freightService = new FreightService(freightRepository);
    const freightController = new FreightController(freightService);

    const authService = new AuthService(fastify);
    const authController = new AuthController(authService);

    fastify.post('/login', authController.login.bind(authController));

    fastify.post('/admin/toggle-lock', {
        preHandler: [fastify.authenticateAdmin]
    }, authController.toggleSystemLock.bind(authController));

    fastify.post('/upload/taxas-frete', {
        preHandler: [fastify.authenticate]
    }, freightController.uploadTaxasFrete.bind(freightController));

    fastify.post('/upload/parse-precos', {
        preHandler: [fastify.authenticate]
    }, freightController.uploadParsePrecos.bind(freightController));

    fastify.post('/calculo-frete', freightController.calculoFrete.bind(freightController));
}