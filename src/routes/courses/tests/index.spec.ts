import { exec, execSync } from "node:child_process";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { makeAuthorizedUser, makeCourse } from "./factories.ts";
import { app } from "../../../app.ts";
import { db } from "../../../database/client.ts";
import { courses, emailConfirmationCodes, users } from "../../../database/schema.ts";

describe("Courses routes", () => {
    let authToken: string;

    beforeAll(async () => {
        execSync("npx drizzle-kit drop");
        execSync("npx drizzle-kit migrate");
        await app.ready();
    });

    beforeEach(async () => {
        // Clean up the database by deleting all courses
        await db.delete(courses);
        await db.delete(emailConfirmationCodes);
        await db.delete(users);

        const { token, user } = await makeAuthorizedUser();
        authToken = token;
    }, 15000); // Increase timeout to 15 seconds

    afterAll(async () => {
        await db.delete(courses);
        await db.delete(emailConfirmationCodes);
        await db.delete(users);
        await app.close();
    });

    it("should be able to list all courses", async () => {
        const response = await request(app.server).get("/courses").set("Authorization", `Bearer ${authToken}`);

        expect(response.status).toBe(200);
    });

    it("should be able to create a course", async () => {
        const response = await makeCourse(authToken);

        expect(response.status).toBe(201);
        expect(response.body).toEqual({
            courseId: expect.any(String),
        });
    });

    it("should be able to get a course by id", async () => {
        const response = await makeCourse(authToken);

        expect(response.status).toBe(201);
        expect(response.body).toEqual({
            courseId: expect.any(String),
        });

        const courseId = response.body.courseId;

        const getCourseResponse = await request(app.server)
            .get(`/courses/${courseId}`)
            .set("Authorization", `Bearer ${authToken}`);

        expect(getCourseResponse.status).toBe(200);
        expect(getCourseResponse.body).toEqual({
            course: {
                id: courseId,
                title: "New Course",
                description: expect.any(String),
                price: 100,
            },
        });
    });

    it("should be able to get a course by title", async () => {
        const response = await makeCourse(authToken);

        expect(response.status).toBe(201);
        expect(response.body).toEqual({
            courseId: expect.any(String),
        });

        const courseTitle = "New Course";

        const getCourseByTitleResponse = await request(app.server)
            .get(`/courses?search=${courseTitle}`)
            .set("Authorization", `Bearer ${authToken}`);

        expect(getCourseByTitleResponse.status).toBe(200);
        expect(getCourseByTitleResponse.body).toEqual({
            courses: [
                {
                    id: response.body.courseId,
                    title: courseTitle,
                    description: expect.any(String),
                    price: expect.any(Number),
                    enrollments: expect.any(Number),
                },
            ],
            total: 1,
        });
    });
});
