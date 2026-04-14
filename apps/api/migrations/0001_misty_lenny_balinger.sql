ALTER TABLE "repositories" DROP CONSTRAINT "repositories_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "summaries" DROP CONSTRAINT "summaries_repository_id_repositories_id_fk";
--> statement-breakpoint
ALTER TABLE "repositories" ADD CONSTRAINT "repositories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "summaries" ADD CONSTRAINT "summaries_repository_id_repositories_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "repositories_user_id_idx" ON "repositories" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "repositories_user_id_github_repo_name_idx" ON "repositories" USING btree ("user_id","github_repo_name");--> statement-breakpoint
CREATE INDEX "summaries_repository_id_idx" ON "summaries" USING btree ("repository_id");