import { and, eq } from "drizzle-orm";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import jwt from "jsonwebtoken";
import z from "zod";

import {
    type EmailConfirmationPayload,
    sendLoginConfirmation,
    sendRegistrationConfirmation,
} from "./utils/sendConfirmationEmail.ts";
import { env } from "../../../env/index.ts";
import { db } from "../../database/client.ts";
import { emailConfirmationCodes, users } from "../../database/schema.ts";

const JWT_SECRET = env.JWT_SECRET;

export const authRoutes: FastifyPluginAsyncZod = async (app) => {
    app.post(
        "/auth/register",
        {
            schema: {
                tags: ["auth"],
                summary: "Register a new user (requires email confirmation)",
                body: z
                    .object({
                        name: z.string().min(1),
                        email: z.email(),
                    })
                    .strict(),
            },
        },
        async (request, reply) => {
            const { name, email } = request.body;

            try {
                const [user] = await db
                    .insert(users)
                    .values({
                        name,
                        email,
                    })
                    .returning();

                if (!user) {
                    return reply.status(400).send({
                        error: "Failed to create user",
                    });
                }

                await sendRegistrationConfirmation(user, reply);

                return reply.status(201).send({
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        confirmed: user.confirmed,
                        createdAt: user.createdAt,
                    },
                });
            } catch (error) {
                const [user] = await db.select().from(users).where(eq(users.email, email));

                if (!user) {
                    return reply.status(400).send({
                        error: "Failed to create user",
                    });
                }

                await sendRegistrationConfirmation(user, reply);
            }
        },
    );

    app.post(
        "/auth/login",
        {
            schema: {
                tags: ["auth"],
                summary: "Login with email and code or link",
                body: z
                    .object({
                        email: z.email(),
                    })
                    .strict(),
            },
        },
        async (request, reply) => {
            const { email } = request.body;
            const [user] = await db.select().from(users).where(eq(users.email, email));

            if (!user) {
                return reply.status(400).send({
                    error: "Failed to find the specified user",
                });
            }

            await sendLoginConfirmation(user, reply);
        },
    );

    app.post(
        "/auth/verify",
        {
            schema: {
                tags: ["auth"],
                summary: "Verify email with code or JWT token",
                body: z.object({
                    email: z.email(),
                    code: z
                        .string()
                        .length(6)
                        .regex(/^\d{6}$/, "Code must be 6 digits")
                        .optional(), // Opcional quando usar JWT no header
                }),
            },
        },
        async (request, reply) => {
            const { email, code } = request.body;
            const token = request.headers.authorization?.split("Bearer ")[1];

            try {
                // 🔍 Validar que pelo menos um método foi fornecido
                if (!code && !token) {
                    return reply.status(400).send({
                        error: "Either 'code' in body or 'Authorization' header with JWT is required",
                    });
                }

                // 🔍 Buscar usuário por email
                const [user] = await db.select().from(users).where(eq(users.email, email));

                if (!user) {
                    return reply.status(404).send({
                        error: "User not found",
                    });
                }

                // 🎯 CENÁRIO 1: Usuário ainda NÃO confirmou email
                if (!user.confirmed) {
                    // 📱 Método 1: Verificação por CÓDIGO de 6 dígitos
                    if (code) {
                        const [confirmationCode] = await db
                            .select()
                            .from(emailConfirmationCodes)
                            .where(
                                and(
                                    eq(emailConfirmationCodes.userId, user.id),
                                    eq(emailConfirmationCodes.code, code),
                                    eq(emailConfirmationCodes.used, false),
                                ),
                            )
                            .limit(1);

                        if (!confirmationCode) {
                            return reply.status(400).send({
                                error: "Invalid or already used confirmation code",
                            });
                        }

                        // ⏰ Verificar se código expirou
                        if (new Date() > confirmationCode.expiresAt) {
                            return reply.status(400).send({
                                error: "Confirmation code has expired",
                            });
                        }

                        // ✅ Confirmar usuário e marcar código como usado
                        await Promise.all([
                            db
                                .update(emailConfirmationCodes)
                                .set({ used: true })
                                .where(eq(emailConfirmationCodes.id, confirmationCode.id)),
                            db.update(users).set({ confirmed: true }).where(eq(users.id, user.id)),
                        ]);

                        // 🎫 Gerar token de sessão (usuário fica logado)
                        const sessionToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "24h" });

                        return reply.status(200).send({
                            message: "Email confirmed successfully! You are now logged in.",
                            user: {
                                id: user.id,
                                name: user.name,
                                email: user.email,
                                confirmed: true,
                                createdAt: user.createdAt,
                            },
                            token: sessionToken,
                        });
                    }

                    // 🔗 Método 2: Verificação por JWT (link clicado)
                    else if (token) {
                        try {
                            const decoded = jwt.verify(token, JWT_SECRET) as EmailConfirmationPayload;

                            if (decoded.type !== "email-confirmation") {
                                return reply.status(400).send({
                                    error: "Invalid token type",
                                });
                            }

                            // ✅ Confirmar usuário via JWT
                            const [confirmedUser] = await db
                                .update(users)
                                .set({ confirmed: true })
                                .where(eq(users.id, decoded.userId))
                                .returning();

                            if (!confirmedUser) {
                                return reply.status(404).send({
                                    error: "User not found",
                                });
                            }

                            // 🎫 Gerar token de sessão (usuário fica logado)
                            const sessionToken = jwt.sign({ userId: confirmedUser.id }, JWT_SECRET, {
                                expiresIn: "24h",
                            });

                            return reply.status(200).send({
                                message: "Email confirmed successfully! You are now logged in.",
                                user: {
                                    id: confirmedUser.id,
                                    name: confirmedUser.name,
                                    email: confirmedUser.email,
                                    confirmed: true,
                                    createdAt: confirmedUser.createdAt,
                                },
                                token: sessionToken,
                            });
                        } catch (jwtError) {
                            return reply.status(400).send({
                                error: "Invalid or expired JWT token",
                            });
                        }
                    }
                }

                // 🎯 CENÁRIO 2: Usuário JÁ confirmou email (quer fazer LOGIN)
                else {
                    // 🔐 Se o usuário já está confirmado, este endpoint funciona como LOGIN
                    // Ele pode usar qualquer um dos métodos para "provar" que é ele

                    if (code) {
                        // 📱 Login via código de 6 dígitos
                        // Verificar se existe código válido para este usuário
                        const [validCode] = await db
                            .select()
                            .from(emailConfirmationCodes)
                            .where(
                                and(
                                    eq(emailConfirmationCodes.userId, user.id),
                                    eq(emailConfirmationCodes.code, code),
                                    eq(emailConfirmationCodes.used, false),
                                ),
                            )
                            .limit(1);

                        if (!validCode) {
                            return reply.status(400).send({
                                error: "Invalid verification code for login",
                            });
                        }

                        if (new Date() > validCode.expiresAt) {
                            return reply.status(400).send({
                                error: "Verification code has expired",
                            });
                        }

                        // 🎫 Gerar novo token de sessão
                        const sessionToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "24h" });

                        // 📝 Marcar código como usado
                        await db
                            .update(emailConfirmationCodes)
                            .set({ used: true })
                            .where(eq(emailConfirmationCodes.id, validCode.id));

                        return reply.status(200).send({
                            message: "Login successful via verification code",
                            user: {
                                id: user.id,
                                name: user.name,
                                email: user.email,
                                confirmed: user.confirmed,
                                createdAt: user.createdAt,
                            },
                            token: sessionToken,
                        });
                    } else if (token) {
                        // 🔗 Login via JWT (usuário clicou num link de login)
                        try {
                            const decoded = jwt.verify(token, JWT_SECRET) as EmailConfirmationPayload;

                            // Verificar se o token pertence a este usuário
                            if (decoded.userId !== user.id) {
                                return reply.status(400).send({
                                    error: "Token does not match user",
                                });
                            }

                            // 🎫 Gerar novo token de sessão
                            const sessionToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "24h" });

                            return reply.status(200).send({
                                message: "Login successful via token",
                                user: {
                                    id: user.id,
                                    name: user.name,
                                    email: user.email,
                                    confirmed: user.confirmed,
                                    createdAt: user.createdAt,
                                },
                                token: sessionToken,
                            });
                        } catch (tokenError) {
                            return reply.status(400).send({
                                error: "Invalid or expired token",
                            });
                        }
                    }
                }
            } catch (error) {
                console.error("Error verifying confirmation code:", error);
                return reply.status(500).send({
                    error: "Internal server error",
                });
            }
        },
    );
};

export default authRoutes;
