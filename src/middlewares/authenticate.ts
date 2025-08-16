import { eq } from "drizzle-orm";
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";

import { env } from "../../env/index.ts";
import { db } from "../database/client.ts";
import { users } from "../database/schema.ts";

const JWT_SECRET = env.JWT_SECRET;

export const authenticate = async (request: FastifyRequest, reply: FastifyReply) => {
    const token = request.headers.authorization?.split("Bearer ")[1];

    if (!token) {
        return reply.status(401).send({ error: "Unauthorized" });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

        if (!decoded) {
            return reply.status(401).send({ error: "Unauthorized" });
        }

        const [user] = await db.select().from(users).where(eq(users.id, decoded.userId));

        if (!user) {
            return reply.status(401).send({ error: "Unauthorized" });
        }

        return user;
    } catch (error) {
        return reply.status(401).send({ error: "Unauthorized" });
    }
};
