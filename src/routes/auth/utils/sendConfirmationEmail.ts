import type { FastifyReply } from "fastify";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

import { env } from "../../../../env/index.ts";
import { db } from "../../../database/client.ts";
import type { users } from "../../../database/schema.ts";
import { emailConfirmationCodes } from "../../../database/schema.ts";

const JWT_SECRET = env.JWT_SECRET;
const FRONTEND_URL = env.FRONTEND_URL;

// Configure email transporter
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASSWORD,
    },
});

// User type from schema
type User = typeof users.$inferSelect;

export interface EmailConfirmationPayload {
    userId: string;
    email: string;
    name: string;
    type: "email-confirmation";
}

// Helper function to send registration confirmation
export async function sendRegistrationConfirmation(user: User, reply: FastifyReply) {
    // Generate confirmation token with user data
    const confirmationToken = jwt.sign(
        {
            userId: user.id,
            email: user.email,
            name: user.name,
            type: "email-confirmation",
        },
        JWT_SECRET,
        { expiresIn: "1h" }, // 1 hour to confirm
    );

    // Create confirmation link
    const confirmationLink = `${FRONTEND_URL}/auth/verify?token=${confirmationToken}`;

    // Generate 6-digit confirmation code
    const confirmationCode = Math.floor(100000 + Math.random() * 900000);

    // Save confirmation code to database
    await db.insert(emailConfirmationCodes).values({
        userId: user.id,
        code: confirmationCode.toString(),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour expiration
    });

    // Email template for confirmation
    const mailOptions = {
        from: env.EMAIL_USER,
        to: user.email,
        subject: "✅ Confirme seu email para completar o cadastro - Academic Manager",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Bem-vindo(a), ${user.name}! 🎉</h2>
                <p>Obrigado por se cadastrar ! Para completar seu registro, confirme seu email clicando no botão abaixo:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${confirmationLink}" 
                       style="background-color: #28a745; color: white; padding: 12px 30px; 
                              text-decoration: none; border-radius: 5px; display: inline-block;">
                        Confirmar Email e Acessar Conta
                    </a>
                </div>
                
                <p style="color: #666; font-size: 14px;">
                    Este link expira em 1 hora.<br>
                    Após a confirmação, você será logado automaticamente.
                </p>

                <p style="color: #666; font-size: 14px;">
                    Caso prefira, você pode usar esse código de 6 dígitos para confirmar sua conta:
                    <code>${confirmationCode}</code>
                </p>

                <p style="color: #999; font-size: 12px;">
                    Ou copie e cole este link no navegador:<br>
                    <code>${confirmationLink}</code>
                </p>
            </div>
        `,
    };

    await transporter.sendMail(mailOptions);

    return reply.status(201).send({
        message: "Cadastro criado! Verifique seu email para confirmar a conta.",
        userId: user.id,
    });
}

export async function sendLoginConfirmation(user: User, reply: FastifyReply) {
    const confirmationToken = jwt.sign(
        {
            userId: user.id,
            email: user.email,
            name: user.name,
            type: "email-confirmation",
        },
        JWT_SECRET,
        { expiresIn: "1h" }, // 1 hour to confirm
    );

    const confirmationLink = `${FRONTEND_URL}/auth/verify?token=${confirmationToken}`;

    // Generate 6-digit confirmation code
    const confirmationCode = Math.floor(100000 + Math.random() * 900000);

    // Save confirmation code to database
    await db.insert(emailConfirmationCodes).values({
        userId: user.id,
        code: confirmationCode.toString(),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour expiration
    });

    const mailOptions = {
        from: env.EMAIL_USER,
        to: user.email,
        subject: "✅ Confirme seu email para completar o login - Academic Manager",
        html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Bem-vindo(a), ${user.name}! 🎉</h2>
                <p>Obrigado por estar conosco ! Para completar seu login, confirme seu email clicando no botão abaixo:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${confirmationLink}" 
                       style="background-color: #28a745; color: white; padding: 12px 30px; 
                              text-decoration: none; border-radius: 5px; display: inline-block;">
                        Confirmar Email e Acessar Aplicativo
                    </a>
                </div>
                
                <p style="color: #666; font-size: 14px;">
                    Este link expira em 1 hora.<br>
                    Após a confirmação, você será logado automaticamente.
                </p>

                <p style="color: #666; font-size: 14px;">
                    Caso prefira, você pode usar esse código de 6 dígitos para confirmar seu acesso:
                    <code>${confirmationCode}</code>
                </p>

                <p style="color: #999; font-size: 12px;">
                    Ou copie e cole este link no navegador:<br>
                    <code>${confirmationLink}</code>
                </p>
            </div>
        `,
    };

    await transporter.sendMail(mailOptions);

    return reply.status(200).send({
        message: "Email de login enviado! Verifique seu email para confirmar a conta.",
        userId: user.id,
    });
}
