import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import fastifyScalarUi from "@scalar/fastify-api-reference";
import fastify from "fastify";
import {
    jsonSchemaTransform,
    serializerCompiler,
    validatorCompiler,
    type ZodTypeProvider,
} from "fastify-type-provider-zod";

import { requestErrorHandler } from "./middlewares/errorHandler.ts";
import { authRoutes } from "./routes/auth/routes.ts";
import { coursesRoutes } from "./routes/courses/routes.ts";
import { env } from "../env/index.ts";

export const app = fastify({
    logger: {
        transport: {
            target: "pino-pretty",
            options: {
                translateTime: "HH:MM:ss Z",
                ignore: "pid,hostname",
            },
        },
    },
}).withTypeProvider<ZodTypeProvider>();

if (env.NODE_ENV === "development") {
    app.register(fastifySwagger, {
        openapi: {
            info: {
                title: "Academic Manager API",
                version: "1.0.0",
            },
        },
        transform: jsonSchemaTransform,
    });

    app.register(fastifyScalarUi, {
        routePrefix: "/docs",
        configuration: {
            theme: "kepler",
        },
    });
}

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

// Middlewares
app.setErrorHandler(requestErrorHandler);

// Route plugins
app.register(coursesRoutes);
app.register(authRoutes);
