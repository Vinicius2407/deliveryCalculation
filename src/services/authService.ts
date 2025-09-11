
import { getDb } from '../db/db.js';
import { FastifyInstance } from 'fastify';

/**
 * @class AuthService
 * @description Provides authentication services.
 */
export class AuthService {
    /**
     * @constructor
     * @param {FastifyInstance} fastify - The Fastify instance.
     */
    constructor(private fastify: FastifyInstance) {}

    /**
     * @method login
     * @description Authenticates a user and returns a JWT token.
     * @param {string} email - The user's email.
     * @param {string} password - The user's password.
     * @returns {Promise<string>} A JWT token.
     * @throws {Error} If the credentials are invalid.
     */
    async login(email: string, password: string): Promise<string> {
        const db = getDb();
        const user = db.data.users.find((user: { id: string; email: string; password: string }) => user.email === email && user.password === password);

        if (user) {
            return this.fastify.jwt.sign({ email: user.email }, { expiresIn: '8h' });
        }

        throw new Error('Credenciais Invalidas');
    }
}
