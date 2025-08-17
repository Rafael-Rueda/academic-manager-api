import { execSync } from "node:child_process";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// Mock nodemailer to prevent actual email sending during tests
const mockSendMail = vi.hoisted(() => vi.fn());
vi.mock("nodemailer", () => ({
    default: {
        createTransport: vi.fn(() => ({
            sendMail: mockSendMail,
        })),
    },
}));

import { env } from "../../../../env/index.ts";
import { app } from "../../../app.ts";
import { db } from "../../../database/client.ts";
import { emailConfirmationCodes, users } from "../../../database/schema.ts";

describe("Auth routes tests", () => {
    beforeAll(async () => {
        execSync("npx drizzle-kit migrate");
        await app.ready();
    });

    beforeEach(async () => {
        // Clean up the database
        await db.delete(emailConfirmationCodes);
        await db.delete(users);
        // Reset mock before each test
        mockSendMail.mockClear();
    }, 15000);

    afterAll(async () => {
        await db.delete(emailConfirmationCodes);
        await db.delete(users);
        await app.close();
    });

    describe("Registration Flow", () => {
        it("should register a new user and generate confirmation code", async () => {
            const userData = {
                name: "John Doe",
                email: "john.doe@example.com",
            };

            const response = await request(app.server).post("/auth/register").send(userData);

            expect(response.status).toBe(201);
            expect(response.body.message).toContain("Cadastro criado");
            expect(response.body.userId).toBeDefined();

            // Verify email was "sent"
            expect(mockSendMail).toHaveBeenCalledTimes(1);

            // Verify confirmation code was created in database
            const confirmationCodes = await db
                .select()
                .from(emailConfirmationCodes)
                .where(eq(emailConfirmationCodes.userId, response.body.userId));

            expect(confirmationCodes).toHaveLength(1);
            expect(confirmationCodes[0]?.code).toMatch(/^\d{6}$/); // 6 digits
            expect(confirmationCodes[0]?.used).toBe(false);
            expect(new Date(confirmationCodes[0]?.expiresAt || new Date()) > new Date()).toBe(true);
        });

        it("should handle duplicate email registration", async () => {
            const userData = {
                name: "John Doe",
                email: "john.doe@example.com",
            };

            // First registration
            await request(app.server).post("/auth/register").send(userData);

            // Second registration with same email
            const response = await request(app.server).post("/auth/register").send(userData);

            // Should still return 201 but send new confirmation email
            expect(response.status).toBe(201);
            expect(mockSendMail).toHaveBeenCalledTimes(2);
        });
    });

    describe("Email Verification - 6-digit Code Method", () => {
        let user: typeof users.$inferSelect;
        let confirmationCode: string;

        beforeEach(async () => {
            // Create a user and get the confirmation code
            const userData = {
                name: "Test User",
                email: "test@example.com",
            };

            const response = await request(app.server).post("/auth/register").send(userData);

            // Get user from database since the API doesn't return user details
            const [dbUser] = await db.select().from(users).where(eq(users.id, response.body.userId));

            user = dbUser!;

            // Get the confirmation code from database
            const codes = await db
                .select()
                .from(emailConfirmationCodes)
                .where(eq(emailConfirmationCodes.userId, user.id));

            confirmationCode = codes[0]?.code || "";
        });

        it("should verify email with valid 6-digit code", async () => {
            const response = await request(app.server).post("/auth/verify").send({
                email: user.email,
                code: confirmationCode,
            });

            expect(response.status).toBe(200);
            expect(response.body.message).toContain("confirmed successfully");
            expect(response.body.user.confirmed).toBe(true);
            expect(response.body.token).toBeDefined();

            // Verify JWT token
            const decoded = jwt.verify(response.body.token, env.JWT_SECRET) as { userId: string };
            expect(decoded.userId).toBe(user.id);

            // Verify code is marked as used
            const usedCode = await db
                .select()
                .from(emailConfirmationCodes)
                .where(eq(emailConfirmationCodes.code, confirmationCode));

            expect(usedCode[0]?.used).toBe(true);
        });

        it("should reject invalid confirmation code", async () => {
            const response = await request(app.server).post("/auth/verify").send({
                email: user.email,
                code: "123456", // Wrong code
            });

            expect(response.status).toBe(400);
            expect(response.body.error).toContain("Invalid or already used");
        });

        it("should reject already used confirmation code", async () => {
            // Use the code first time
            await request(app.server).post("/auth/verify").send({
                email: user.email,
                code: confirmationCode,
            });

            // Try to use the same code again
            const response = await request(app.server).post("/auth/verify").send({
                email: user.email,
                code: confirmationCode,
            });

            expect(response.status).toBe(400);
            expect(response.body.error).toMatch(/Invalid|already used|verification code/i);
        });

        it("should reject expired confirmation code", async () => {
            // Manually expire the code
            await db
                .update(emailConfirmationCodes)
                .set({ expiresAt: new Date(Date.now() - 1000) }) // 1 second ago
                .where(eq(emailConfirmationCodes.code, confirmationCode));

            const response = await request(app.server).post("/auth/verify").send({
                email: user.email,
                code: confirmationCode,
            });

            expect(response.status).toBe(400);
            expect(response.body.error).toContain("expired");
        });
    });

    describe("Email Verification - JWT Token Method", () => {
        let user: { id: string; email: string; name: string; confirmed: boolean };
        let confirmationToken: string;

        beforeEach(async () => {
            // Create a user
            const userData = {
                name: "Test User",
                email: "test@example.com",
            };

            const response = await request(app.server).post("/auth/register").send(userData);

            // Get user from database since the API doesn't return user details
            const [dbUser] = await db.select().from(users).where(eq(users.id, response.body.userId));

            user = dbUser!;

            // Generate a valid confirmation token (simulating the email link)
            confirmationToken = jwt.sign(
                {
                    userId: user.id,
                    email: user.email,
                    name: user.name,
                    type: "email-confirmation",
                },
                env.JWT_SECRET,
                { expiresIn: "1h" },
            );
        });

        it("should verify email with valid JWT token", async () => {
            const response = await request(app.server)
                .post("/auth/verify")
                .set("Authorization", `Bearer ${confirmationToken}`)
                .send({
                    email: user.email,
                });

            expect(response.status).toBe(200);
            expect(response.body.message).toContain("confirmed successfully");
            expect(response.body.user.confirmed).toBe(true);
            expect(response.body.token).toBeDefined();
        });

        it("should reject invalid JWT token", async () => {
            const invalidToken = "invalid.jwt.token";

            const response = await request(app.server)
                .post("/auth/verify")
                .set("Authorization", `Bearer ${invalidToken}`)
                .send({
                    email: user.email,
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toContain("Invalid or expired");
        });

        it("should reject expired JWT token", async () => {
            const expiredToken = jwt.sign(
                {
                    userId: user.id,
                    email: user.email,
                    name: user.name,
                    type: "email-confirmation",
                },
                env.JWT_SECRET,
                { expiresIn: "-1h" }, // Already expired
            );

            const response = await request(app.server)
                .post("/auth/verify")
                .set("Authorization", `Bearer ${expiredToken}`)
                .send({
                    email: user.email,
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toContain("Invalid or expired");
        });

        it("should reject token with wrong type", async () => {
            const wrongTypeToken = jwt.sign(
                {
                    userId: user.id,
                    email: user.email,
                    name: user.name,
                    type: "wrong-type", // Wrong type
                },
                env.JWT_SECRET,
                { expiresIn: "1h" },
            );

            const response = await request(app.server)
                .post("/auth/verify")
                .set("Authorization", `Bearer ${wrongTypeToken}`)
                .send({
                    email: user.email,
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toContain("Invalid token type");
        });
    });

    describe("Login Flow", () => {
        let confirmedUser: { id: string; email: string; name: string; confirmed: boolean };

        beforeEach(async () => {
            // Create and confirm a user
            const userData = {
                name: "Confirmed User",
                email: "confirmed@example.com",
            };

            const registerResponse = await request(app.server).post("/auth/register").send(userData);

            const userId = registerResponse.body.userId;

            // Manually confirm the user
            await db.update(users).set({ confirmed: true }).where(eq(users.id, userId));

            // Get user from database
            const [dbUser] = await db.select().from(users).where(eq(users.id, userId));

            confirmedUser = dbUser!;
        });

        it("should send login confirmation email", async () => {
            const response = await request(app.server).post("/auth/login").send({
                email: confirmedUser.email,
            });

            expect(response.status).toBe(200);
            expect(response.body.message).toContain("Email de login enviado");
            expect(mockSendMail).toHaveBeenCalledTimes(2); // Once for register, once for login
        });

        it("should login with 6-digit code", async () => {
            // Request login
            await request(app.server).post("/auth/login").send({
                email: confirmedUser.email,
            });

            // Get the new login code
            const codes = await db
                .select()
                .from(emailConfirmationCodes)
                .where(eq(emailConfirmationCodes.userId, confirmedUser.id));

            const loginCode = codes.find((code) => !code.used)?.code;
            expect(loginCode).toBeDefined();

            // Use the code to login
            const response = await request(app.server).post("/auth/verify").send({
                email: confirmedUser.email,
                code: loginCode,
            });

            expect(response.status).toBe(200);
            expect(response.body.message).toContain("Login successful");
            expect(response.body.token).toBeDefined();
        });

        it("should reject login for non-existent user", async () => {
            const response = await request(app.server).post("/auth/login").send({
                email: "nonexistent@example.com",
            });

            expect(response.status).toBe(400);
            expect(response.body.error).toContain("Failed to find");
        });
    });

    describe("Edge Cases and Security", () => {
        it("should require either code or token", async () => {
            const response = await request(app.server).post("/auth/verify").send({
                email: "test@example.com",
                // No code or token provided
            });

            expect(response.status).toBe(400);
            expect(response.body.error).toContain("Either 'code'");
        });

        it("should handle non-existent user in verification", async () => {
            const response = await request(app.server).post("/auth/verify").send({
                email: "nonexistent@example.com",
                code: "123456",
            });

            expect(response.status).toBe(404);
            expect(response.body.error).toContain("User not found");
        });

        it("should validate code format", async () => {
            const response = await request(app.server).post("/auth/verify").send({
                email: "test@example.com",
                code: "123", // Wrong format
            });

            expect(response.status).toBe(400);
        });
    });
});
