import { defineConfig } from "drizzle-kit";

import { env } from "./env/index.ts";

if (!env.DATABASE_URL) {
    throw new Error("The DATABASE_URL env is required.");
}

export default defineConfig({
    dialect: "postgresql",
    dbCredentials: {
        url: env.DATABASE_URL,
    },
    out: "./drizzle",
    schema: "./src/database/schema.ts",
});
