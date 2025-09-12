import 'fastify';
import { JWT } from '@fastify/jwt';

declare module 'fastify' {
    export interface FastifyInstance {
        authenticate: any;
        jwt: JWT;
        authenticateAdmin: any;
    }
    export interface FastifyRequest {
        jwtVerify: any;
        file: any;
    }
}

declare module '@fastify/jwt' {
    interface FastifyJWT {
        payload: { email: string } // payload type is defined here
        user: {
            email: string
        }
    }
}
