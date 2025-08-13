import { eq } from "drizzle-orm";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import z from "zod";

import { createCourseBodySchema } from "./schemas.ts";
import { db } from "../../database/client.ts";
import { courses } from "../../database/schema.ts";

export const coursesRoutes: FastifyPluginAsyncZod = async (app) => {
    // List all courses
    app.get(
        "/courses",
        {
            schema: {
                tags: ["courses"],
                summary: "Get all courses",
                response: {
                    200: z.object({
                        courses: z.array(
                            z.object({
                                id: z.uuid(),
                                title: z.string(),
                                description: z.string().nullable(),
                                price: z.number().nullable(),
                            }),
                        ),
                    }),
                },
            },
        },
        async (request, reply) => {
            const result = await db.select().from(courses);

            reply.status(200).send({ courses: result });
        },
    );

    // List a specific course
    app.get(
        "/courses/:id",
        {
            schema: {
                tags: ["courses"],
                summary: "Get a specific course",
                params: z.object({
                    id: z.uuid(),
                }),
                response: {
                    200: z.object({
                        course: z.object({
                            id: z.uuid(),
                            title: z.string(),
                            description: z.string().nullable(),
                            price: z.number().nullable(),
                        }),
                    }),
                    404: z.null().describe("Course not found"),
                },
            },
        },
        async (request, reply) => {
            const courseId = request.params.id;

            const result = await db.select().from(courses).where(eq(courses.id, courseId));

            if (result[0] && result.length > 0) {
                reply.status(200).send({ course: result[0] });
            }

            return reply.status(404).send();
        },
    );

    // Create a course
    app.post(
        "/courses",
        {
            schema: {
                tags: ["courses"],
                summary: "Create a course",
                body: createCourseBodySchema,
                response: {
                    201: z.object({ courseId: z.uuid() }).describe("Course created succesfully !"),
                },
            },
        },
        async (request, reply) => {
            const created = await db
                .insert(courses)
                .values({
                    title: request.body.title,
                    description: request.body.description ?? null,
                    price: request.body.price,
                })
                .returning({ id: courses.id });

            const createdRowId = created[0]!.id;
            reply.status(201).send({ courseId: createdRowId });
        },
    );
};
