import { and, asc, count, desc, eq, ilike, type SQL } from "drizzle-orm";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import z from "zod";

import { createCourseBodySchema, errorCreateCourseSchema } from "./schemas.ts";
import { db } from "../../database/client.ts";
import { courses, enrollments } from "../../database/schema.ts";

export const coursesRoutes: FastifyPluginAsyncZod = async (app) => {
    // List all courses
    app.get(
        "/courses",
        {
            schema: {
                tags: ["courses"],
                summary: "Get all courses",
                querystring: z.object({
                    search: z.string().optional(), // Query string always optional
                    orderBy: z.enum(["id", "title", "price"]).optional().default("id"),
                    page: z.coerce.number().optional().default(1),
                }),
                response: {
                    200: z.object({
                        courses: z.array(
                            z.object({
                                id: z.uuid(),
                                title: z.string(),
                                description: z.string().nullable(),
                                price: z.number().nullable(),
                                enrollments: z.number(),
                            }),
                        ),
                        total: z.number(),
                    }),
                },
            },
        },
        async (request, reply) => {
            const { search, orderBy, page } = request.query;

            const conditions: SQL[] = [];

            if (search) {
                conditions.push(ilike(courses.title, `%${search}%`));
            }

            const [result, total] = await Promise.all([
                db
                    .select({
                        id: courses.id,
                        title: courses.title,
                        description: courses.description,
                        price: courses.price,
                        enrollments: count(enrollments.id),
                    })
                    .from(courses)
                    .orderBy(asc(courses[orderBy]))
                    .offset((page - 1) * 2)
                    .limit(2)
                    .leftJoin(enrollments, eq(courses.id, enrollments.courseId))
                    .groupBy(courses.id)
                    .where(and(...conditions)),

                db.$count(courses, and(...conditions)),
            ]);

            reply.status(200).send({ courses: result, total });
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
                    400: z
                        .object({
                            errors: z.object(errorCreateCourseSchema),
                        })
                        .describe("Incorrect data format"),
                    409: z.object({ error: z.string() }).describe("Course title already registred."),
                    500: z.object({ error: z.string() }).describe("Internal unexpected server error"),
                },
            },
        },
        async (request, reply) => {
            const created = await db
                .insert(courses)
                .values({
                    title: request.body.title,
                    description: request.body.description ?? null,
                    price: request.body.price ?? 0,
                })
                .returning({ id: courses.id });

            // if (created.length === 0) {
            //     reply.status(409).send({ error: "Course title already registred." });
            // }

            const createdRowId = created[0]!.id;
            reply.status(201).send({ courseId: createdRowId });
        },
    );
};
