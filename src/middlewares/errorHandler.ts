import type { FastifyReply, FastifyRequest } from "fastify";

export async function requestErrorHandler(error: unknown, request: FastifyRequest, reply: FastifyReply) {
    console.log("Error caught:", error);

    if (error && typeof error === "object") {
        // 1. VALIDATION ERRORS (Zod/Fastify)
        if ("code" in error && error.code === "FST_ERR_VALIDATION") {
            if ("validation" in error && Array.isArray(error.validation)) {
                // Build array of objects where key = field name and value = message
                const formattedErrors = error.validation.reduce((acc, err) => {
                    const field = (err.instancePath?.replace("/", "") || "field").trim();
                    acc[field] = err.message;
                    return acc;
                }, {});

                return reply.status(400).send({
                    errors: formattedErrors,
                });
            }

            return reply.status(400).send({
                error: "Invalid request data",
            });
        }

        // 2. DATABASE ERRORS (Drizzle)
        if ("cause" in error && error.cause) {
            const dbError = error.cause;

            if (dbError && typeof dbError === "object" && "code" in dbError) {
                switch (dbError.code) {
                    case "23505":
                        return reply.status(409).send({
                            error: "Course title already registered.",
                        });
                    case "23503":
                        return reply.status(400).send({
                            error: "Invalid reference to related data.",
                        });
                    case "23502":
                        return reply.status(400).send({
                            error: "Required field is missing.",
                        });
                }
            }
        }
    }

    // GENERIC ERROR
    return reply.status(500).send({
        error: "Internal unexpected server error",
    });
}
