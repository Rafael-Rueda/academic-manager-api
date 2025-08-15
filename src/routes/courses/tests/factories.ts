import { faker } from "@faker-js/faker";
import request from "supertest";

import { app } from "../../../app.ts";

export async function makeCourse() {
    return await request(app.server).post("/courses").set("Content-Type", "application/json").send({
        title: "New Course",
        description: faker.lorem.paragraph(),
        price: 100,
    });
}
