import { config } from "dotenv";
import z from "zod";

if (process.env.NODE_ENV === "test") {
    config({ path: ".env.test" });
} else {
    config();
}

const envSchema = z.object({
    NODE_ENV: z.enum(["development", "production", "test"]),
    DATABASE_URL: z.string(),
    PORT: z.coerce.number().default(3333),
    JWT_SECRET: z.string(),
    FRONTEND_URL: z.string(),
    EMAIL_USER: z.string(),
    EMAIL_PASSWORD: z.string(),
});

const parsed = envSchema.safeParse(process.env);
console.log(parsed.error);
// Fail-fast path — keep using treeifyError
if (!parsed.success) {
    // Destructure with clearer names to avoid shadowing
    const { errors: fieldErrors, properties } = z.treeifyError(parsed.error);

    for (const [prop, detail] of Object.entries(properties ?? {})) {
        for (const each of detail.errors) {
            console.error(`😒 Invalid environment variable → ${prop}:`, each);
        }
    }

    // Stop the app – fail fast
    process.exit(1);
}

export const env = parsed.data;