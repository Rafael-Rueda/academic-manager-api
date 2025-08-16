import { boolean, integer, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
    id: uuid().primaryKey().defaultRandom(),
    name: text().notNull(),
    email: text().notNull().unique(),
    confirmed: boolean().notNull().default(false),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const courses = pgTable("courses", {
    id: uuid().primaryKey().defaultRandom(),
    title: text().notNull().unique(),
    description: text(),
    price: integer(),
});

// Table for temporary confirmation codes
export const emailConfirmationCodes = pgTable("email_confirmation_codes", {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid()
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    code: text().notNull(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    used: boolean().notNull().default(false),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

// // Table for managing active user sessions
// export const userSessions = pgTable("user_sessions", {
//     id: uuid().primaryKey().defaultRandom(),
//     userId: uuid()
//         .notNull()
//         .references(() => users.id, { onDelete: "cascade" }),
//     tokenHash: text().notNull(), // SHA256 hash of the JWT token
//     expiresAt: timestamp({ withTimezone: true }).notNull(),
//     createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
//     lastUsedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
// });

export const enrollments = pgTable(
    "enrollments",
    {
        id: uuid().primaryKey().defaultRandom(),
        userId: uuid()
            .notNull()
            .references(() => users.id),
        courseId: uuid()
            .notNull()
            .references(() => courses.id),
        createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(), // 2025-08-10T10:00:00-3:00 <- WITH TIMEZONE
    },
    (table) => [uniqueIndex("enrollment_unique_per_user_and_course").on(table.userId, table.courseId)],
);
