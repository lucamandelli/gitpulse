ALTER TABLE "repositories" ADD COLUMN "is_private" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "repositories" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "repositories" ADD COLUMN "default_branch" text DEFAULT 'main' NOT NULL;--> statement-breakpoint
ALTER TABLE "repositories" ADD COLUMN "stars" integer DEFAULT 0 NOT NULL;