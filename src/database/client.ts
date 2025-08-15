import { drizzle } from "drizzle-orm/node-postgres";

import { env } from "../../env/index.ts";

export const db = drizzle(env.DATABASE_URL, {
    logger: env.NODE_ENV === "development",
});
