ALTER TABLE "users" ADD COLUMN "confirmed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "createdAt" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "enrollment_unique_per_user_and_course" ON "enrollments" USING btree ("userId","courseId");