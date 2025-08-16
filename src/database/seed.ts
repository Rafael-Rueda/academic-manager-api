import { fakerPT_BR as faker } from "@faker-js/faker";

import { db } from "./client.ts";
import { courses, enrollments, users } from "./schema.ts";

async function seed() {
    const usersInsert = await db
        .insert(users)
        .values([
            { name: faker.person.fullName(), email: faker.internet.email(), confirmed: true },
            { name: faker.person.fullName(), email: faker.internet.email(), confirmed: true },
            { name: faker.person.fullName(), email: faker.internet.email(), confirmed: true },
            { name: faker.person.fullName(), email: faker.internet.email(), confirmed: true },
            { name: faker.person.fullName(), email: faker.internet.email(), confirmed: true },
        ])
        .returning();

    const coursesInsert = await db
        .insert(courses)
        .values([
            {
                title: faker.lorem.words(4),
                description: faker.lorem.sentence(),
                price: faker.number.int({ min: 10, max: 200 }),
            },
            {
                title: faker.lorem.words(4),
                description: faker.lorem.sentence(),
                price: faker.number.int({ min: 10, max: 200 }),
            },
            {
                title: faker.lorem.words(4),
                description: faker.lorem.sentence(),
                price: faker.number.int({ min: 10, max: 200 }),
            },
            {
                title: faker.lorem.words(4),
                description: faker.lorem.sentence(),
                price: faker.number.int({ min: 10, max: 200 }),
            },
            {
                title: faker.lorem.words(4),
                description: faker.lorem.sentence(),
                price: faker.number.int({ min: 10, max: 200 }),
            },
        ])
        .returning();

    await db.insert(enrollments).values([
        { courseId: coursesInsert[0]!.id, userId: usersInsert[0]!.id },
        { courseId: coursesInsert[0]!.id, userId: usersInsert[1]!.id },
        { courseId: coursesInsert[1]!.id, userId: usersInsert[2]!.id },
        { courseId: coursesInsert[1]!.id, userId: usersInsert[3]!.id },
        { courseId: coursesInsert[2]!.id, userId: usersInsert[4]!.id },
        { courseId: coursesInsert[2]!.id, userId: usersInsert[0]!.id },
        { courseId: coursesInsert[3]!.id, userId: usersInsert[1]!.id },
        { courseId: coursesInsert[3]!.id, userId: usersInsert[2]!.id },
        { courseId: coursesInsert[4]!.id, userId: usersInsert[3]!.id },
        { courseId: coursesInsert[4]!.id, userId: usersInsert[4]!.id },
    ]);
}

seed();
