import z from "zod";

export const createCourseBodySchema = z.preprocess(
    (data) => {
        if (typeof data === "object" && data !== null) {
            if (!("price" in data)) {
                return { ...data, price: null };
            }
            if (!("title" in data)) {
                return { ...data, title: undefined };
            }
        }
        return data;
    },
    z
        .object({
            title: z.string().min(5, "The title has to have a minimum of 5 characters").optional(),
            description: z.string().nullable(),
            price: z.number().nullable(),
        })
        .strict()
        .superRefine((obj, ctx) => {
            if (obj.title === undefined) {
                ctx.addIssue({
                    code: "custom",
                    path: ["title"],
                    message: "Title is required",
                });
            }

            if (obj.price === undefined) {
                ctx.addIssue({
                    code: "custom",
                    path: ["price"],
                    message: "Price is required",
                });
            }

            if (obj.price !== null && obj.price < 0) {
                ctx.addIssue({
                    code: "custom",
                    path: ["price"],
                    message: "Price cannot be negative",
                });
            }
        })
        .transform((obj) => ({
            title: obj.title!, // Garantido pela validação acima
            description: obj.description,
            price: obj.price!, // Garantido pela validação acima
        })),
);
