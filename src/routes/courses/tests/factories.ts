import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import request from "supertest";
import { vi } from "vitest";

import { env } from "../../../../env/index.ts";
import { app } from "../../../app.ts";
import { db } from "../../../database/client.ts";
import { users } from "../../../database/schema.ts";

// Mock nodemailer to prevent actual email sending during tests
const mockSendMail = vi.hoisted(() => vi.fn());
vi.mock("nodemailer", () => ({
    default: {
        createTransport: vi.fn(() => ({
            sendMail: mockSendMail,
        })),
    },
}));

export async function makeCourse(authToken?: string) {
    const req = request(app.server).post("/courses").set("Content-Type", "application/json");

    if (authToken) {
        req.set("Authorization", `Bearer ${authToken}`);
    }

    return await req.send({
        title: "New Course",
        description: faker.lorem.paragraph(),
        price: 100,
    });
}

export async function makeAuthorizedUser() {
    const response = await request(app.server).post("/auth/register").send({
        name: faker.person.fullName(),
        email: faker.internet.email(),
    });

    const [user] = await db.select().from(users).where(eq(users.id, response.body.userId));

    const confirmationToken: string = jwt.sign(
        {
            userId: user!.id,
            email: user!.email,
            name: user!.name,
            type: "email-confirmation",
        },
        env.JWT_SECRET,
        { expiresIn: "1h" },
    );

    const verify = await request(app.server)
        .post("/auth/verify")
        .set("Authorization", `Bearer ${confirmationToken}`)
        .send({
            email: user!.email,
        });

    return { token: verify.body.token, user: verify.body.user };
}
