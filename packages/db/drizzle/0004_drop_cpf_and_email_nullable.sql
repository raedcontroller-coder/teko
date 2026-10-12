ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_cpf_unique";
--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "cpf";
