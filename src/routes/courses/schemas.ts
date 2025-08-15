import z from "zod";

export const createCourseBodySchema = z.object({
    // Title: required and minimum length 5
    // (Custom "required" message and min-length message)
    title: z
        .string({
            error: (value) => (value.input === undefined ? "Title is required" : "Title must be a string"),
        })
        .min(5, "The title has to have a minimum of 5 characters"),

    // Description: nullable string
    description: z.string().nullable().optional(),

    // Price: required but can be null; if number, must be >= 0
    price: z
        .number({
            error: (value) =>
                value.input !== Number || value.input !== null
                    ? "Price must be a number or null"
                    : "Price argument is invalid",
        })
        .nonnegative({ message: "Price cannot be negative" })
        .nullable()
        .default(null),
});

export const errorCreateCourseSchema = Object.keys(createCourseBodySchema.shape).reduce(
    (acc, key) => {
        acc[key] = z.string().optional();
        return acc;
    },
    {} as Record<string, z.ZodOptional>,
);
