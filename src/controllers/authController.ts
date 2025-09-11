
import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../services/authService.js';

/**
 * @class AuthController
 * @description Handles authentication-related requests.
 */
export class AuthController {
    /**
     * @constructor
     * @param {AuthService} authService - The authentication service.
     */
    constructor(private authService: AuthService) {}

    /**
     * @method login
     * @description Handles user login.
     * @param {FastifyRequest} request - The request object.
     * @param {FastifyReply} reply - The reply object.
     */
    async login(request: FastifyRequest, reply: FastifyReply) {
        const { email, password } = request.headers as { email: string, password: string };
        
        try {
            const token = await this.authService.login(email, password);
            return { token };
        } catch (error) {
            reply.status(401).send({ message: 'Credenciais Invalidas' });
        }
    }
}
