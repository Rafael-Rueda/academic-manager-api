import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
    id: uuid().primaryKey().defaultRandom(),
    name: text().notNull(),
    email: text().notNull().unique(),
});

export const courses = pgTable("courses", {
    id: uuid().primaryKey().defaultRandom(),
    title: text().notNull().unique(),
    description: text(),
    price: integer(),
});

export const enrollments = pgTable("enrollments", {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid()
        .notNull()
        .references(() => users.id),
    courseId: uuid()
        .notNull()
        .references(() => courses.id),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(), // 2025-08-10T10:00:00-3:00 <- WITH TIMEZONE
});
