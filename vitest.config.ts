import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "node",
        globals: true,
        coverage: {
            provider: "v8",
            reporter: ["text", "json", "html"],
            exclude: [
                "node_modules/**",
                "dist/**",
                "drizzle/**",
                "coverage/**",
                "env/**",
                "**/*.config.ts",
                "**/*.config.js",
                "**/tests/**",
                "**/*.spec.ts",
                "**/*.test.ts",
                "**/*.d.ts",
                "src/database/client.ts",
                "src/database/seed.ts",
                "src/server.ts",
                "src/app.ts",
                "drizzle.config.ts",
                "vitest.config.ts",
                "tsconfig.json",
                "package.json",
                "README.md",
                "LICENSE",
                "requests.http",
                "docker-compose.yml",
                "biome.json",
            ],
        },
    },
});
