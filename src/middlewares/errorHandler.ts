import type { FastifyReply, FastifyRequest } from "fastify";

// Define constraint error mappings for better error messages
const CONSTRAINT_ERROR_MESSAGES = {
    // Unique constraints
    users_email_unique: "Email address is already registered.",
    courses_title_unique: "Course title already exists.",
    enrollment_unique_per_user_and_course: "User is already enrolled in this course.",

    // Foreign key constraints
    enrollments_userId_users_id_fk: "Invalid user reference.",
    enrollments_courseId_courses_id_fk: "Invalid course reference.",
} as const;

// Extract constraint name from PostgreSQL error details
function extractConstraintName(error: unknown): string | null {
    // PostgreSQL error details can be in different formats
    if (error && typeof error === "object" && "detail" in error && error.detail) {
        // Try to extract constraint name from detail message
        const detailStr = String(error.detail);
        const constraintMatch = detailStr.match(/Key \(([^)]+)\)/) || detailStr.match(/constraint "([^"]+)"/);
        if (constraintMatch) {
            return constraintMatch[1];
        }
    }

    if (error && typeof error === "object" && "constraint" in error && error.constraint) {
        return String(error.constraint);
    }

    return null;
}

// Generate user-friendly error message based on constraint and error type
function generateConstraintErrorMessage(constraintName: string | null, errorCode: string): string {
    if (!constraintName) {
        switch (errorCode) {
            case "23505":
                return "Duplicate entry detected. This value already exists.";
            case "23503":
                return "Invalid reference to related data.";
            case "23502":
                return "Required field is missing.";
            default:
                return "Database constraint violation.";
        }
    }

    // Check for exact constraint name match
    if (constraintName in CONSTRAINT_ERROR_MESSAGES) {
        return CONSTRAINT_ERROR_MESSAGES[constraintName as keyof typeof CONSTRAINT_ERROR_MESSAGES];
    }

    // Fallback to field-based detection for unique constraints
    if (errorCode === "23505") {
        if (constraintName.includes("email")) {
            return "Email address is already registered.";
        }
        if (constraintName.includes("title")) {
            return "Title already exists.";
        }
        if (constraintName.includes("enrollment")) {
            return "User is already enrolled in this course.";
        }
        return "Duplicate entry detected. This value already exists.";
    }

    // Fallback to field-based detection for foreign key constraints
    if (errorCode === "23503") {
        if (constraintName.includes("user")) {
            return "Invalid user reference.";
        }
        if (constraintName.includes("course")) {
            return "Invalid course reference.";
        }
        return "Invalid reference to related data.";
    }

    return "Database constraint violation.";
}

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
                const constraintName = extractConstraintName(dbError);
                const errorCode = String(dbError.code);

                console.log("Database error details:", {
                    code: errorCode,
                    constraint: constraintName,
                    detail: (dbError as any).detail || "No detail available",
                });

                switch (errorCode) {
                    case "23505": // Unique constraint violation
                        return reply.status(409).send({
                            error: generateConstraintErrorMessage(constraintName, errorCode),
                        });
                    case "23503": // Foreign key constraint violation
                        return reply.status(400).send({
                            error: generateConstraintErrorMessage(constraintName, errorCode),
                        });
                    case "23502": // Not null constraint violation
                        return reply.status(400).send({
                            error: "Required field is missing.",
                        });
                    case "23514": // Check constraint violation
                        return reply.status(400).send({
                            error: "Invalid data format or value.",
                        });
                    default:
                        console.log("Unhandled database error code:", errorCode);
                        return reply.status(500).send({
                            error: "Database operation failed.",
                        });
                }
            }
        }

        // 3. AUTHENTICATION ERRORS (for future auth implementation)
        if ("code" in error) {
            switch (error.code) {
                case "INVALID_TOKEN":
                    return reply.status(401).send({
                        error: "Invalid or expired authentication token.",
                    });
                case "ACCESS_DENIED":
                    return reply.status(403).send({
                        error: "Access denied. Insufficient permissions.",
                    });
                case "USER_NOT_FOUND":
                    return reply.status(404).send({
                        error: "User not found.",
                    });
                case "INVALID_CREDENTIALS":
                    return reply.status(401).send({
                        error: "Invalid credentials provided.",
                    });
            }
        }
    }

    // GENERIC ERROR
    console.error("Unhandled error:", error);
    return reply.status(500).send({
        error: "Internal unexpected server error",
    });
}
