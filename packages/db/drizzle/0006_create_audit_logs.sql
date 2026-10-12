-- ==============================================================================
-- MIGRAÇÃO AUDIT LOGS TABLE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
	"user_role" text,
	"action" text NOT NULL,
	"resource_type" text NOT NULL,
	"resource_id" text,
	"details" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);

--> statement-breakpoint

-- Habilita RLS em audit_logs: apenas GLOBAL_ADMIN ou processos de sistema podem ler
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_logs_admin_system_policy" ON "audit_logs";
CREATE POLICY "audit_logs_admin_system_policy" ON "audit_logs"
  FOR ALL
  USING (
    current_setting('app.current_user_role', true) = 'GLOBAL_ADMIN'
    OR current_setting('app.current_user_id', true) IS NULL
  );
