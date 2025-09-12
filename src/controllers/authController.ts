
import { FastifyReply, FastifyRequest } from "fastify";
import { AuthService } from "../services/authService.js";
import { getDb } from "../db/db.js";

export class AuthController {
    constructor(private authService: AuthService) { }

    async login(request: FastifyRequest, reply: FastifyReply) {
        const { email, password } = request.headers as { email: string; password: string };

        try {
            const token = await this.authService.login(email, password);
            reply.send({ token });
        } catch (error: any) {
            reply.status(401).send({ message: error.message });
        }
    }

    async toggleSystemLock(request: FastifyRequest, reply: FastifyReply) {
        try {
            const db = getDb();
            db.data.settings.isBlocked = !db.data.settings.isBlocked;
            await db.write();
            reply.send({ 
                message: "Status do sistema alterado com sucesso.",
                isBlocked: db.data.settings.isBlocked 
            });
        } catch (error: any) { 
            request.log.error(error, 'Erro ao alterar o status de bloqueio do sistema.');
            reply.status(500).send({ message: 'Erro interno ao alterar o status do sistema.' });
        }
    }
}
