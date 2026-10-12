-- ==============================================================================
-- MIGRAÇÃO MULTITENANCY E ROW-LEVEL SECURITY (RLS)
-- Garante isolamento estrito de dados entre psicólogos/clínicas,
-- mantendo acesso irrestrito para GLOBAL_ADMIN e conexões do sistema/background.
-- ==============================================================================

-- 1. Tabela USERS
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_admin_system_policy" ON "users";
CREATE POLICY "users_admin_system_policy" ON "users"
  FOR ALL
  USING (
    current_setting('app.current_user_role', true) = 'GLOBAL_ADMIN'
    OR current_setting('app.current_user_id', true) IS NULL
  );

DROP POLICY IF EXISTS "users_psicologo_policy" ON "users";
CREATE POLICY "users_psicologo_policy" ON "users"
  FOR ALL
  USING (
    id = current_setting('app.current_user_id', true)::uuid
    OR psicologo_id = current_setting('app.current_user_id', true)::uuid
  );

--> statement-breakpoint

-- 2. Tabela ANAMNESES
ALTER TABLE "anamneses" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anamneses_admin_system_policy" ON "anamneses";
CREATE POLICY "anamneses_admin_system_policy" ON "anamneses"
  FOR ALL
  USING (
    current_setting('app.current_user_role', true) = 'GLOBAL_ADMIN'
    OR current_setting('app.current_user_id', true) IS NULL
  );

DROP POLICY IF EXISTS "anamneses_psicologo_policy" ON "anamneses";
CREATE POLICY "anamneses_psicologo_policy" ON "anamneses"
  FOR ALL
  USING (
    psicologo_id = current_setting('app.current_user_id', true)::uuid
  );

--> statement-breakpoint

-- 3. Tabela CLINICAL_NOTES
ALTER TABLE "clinical_notes" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clinical_notes_admin_system_policy" ON "clinical_notes";
CREATE POLICY "clinical_notes_admin_system_policy" ON "clinical_notes"
  FOR ALL
  USING (
    current_setting('app.current_user_role', true) = 'GLOBAL_ADMIN'
    OR current_setting('app.current_user_id', true) IS NULL
  );

DROP POLICY IF EXISTS "clinical_notes_psicologo_policy" ON "clinical_notes";
CREATE POLICY "clinical_notes_psicologo_policy" ON "clinical_notes"
  FOR ALL
  USING (
    psicologo_id = current_setting('app.current_user_id', true)::uuid
  );

--> statement-breakpoint

-- 4. Tabela APPOINTMENTS
ALTER TABLE "appointments" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "appointments_admin_system_policy" ON "appointments";
CREATE POLICY "appointments_admin_system_policy" ON "appointments"
  FOR ALL
  USING (
    current_setting('app.current_user_role', true) = 'GLOBAL_ADMIN'
    OR current_setting('app.current_user_id', true) IS NULL
  );

DROP POLICY IF EXISTS "appointments_psicologo_policy" ON "appointments";
CREATE POLICY "appointments_psicologo_policy" ON "appointments"
  FOR ALL
  USING (
    psicologo_id = current_setting('app.current_user_id', true)::uuid
  );

--> statement-breakpoint

-- 5. Tabela GAME_SESSIONS
ALTER TABLE "game_sessions" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "game_sessions_admin_system_policy" ON "game_sessions";
CREATE POLICY "game_sessions_admin_system_policy" ON "game_sessions"
  FOR ALL
  USING (
    current_setting('app.current_user_role', true) = 'GLOBAL_ADMIN'
    OR current_setting('app.current_user_id', true) IS NULL
  );

DROP POLICY IF EXISTS "game_sessions_psicologo_policy" ON "game_sessions";
CREATE POLICY "game_sessions_psicologo_policy" ON "game_sessions"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "users" u
      WHERE u.id = "game_sessions".aluno_id
        AND u.psicologo_id = current_setting('app.current_user_id', true)::uuid
    )
  );
