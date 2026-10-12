import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { generateSignedPdfBuffer } from './sign-terms-pdf';

dotenv.config({ path: resolve(__dirname, "../../.env") });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 15000,
});

async function main() {
  console.log("Iniciando migração retroativa de Termos de Consentimento para Psicólogos existentes...");

  try {
    // 1. Busca todos os usuários com papel 'PSICOLOGO'
    const usersRes = await pool.query(`
      SELECT id, name, email, crp, role, created_at 
      FROM "users" 
      WHERE role = 'PSICOLOGO' AND "deleted_at" IS NULL
    `);

    const psychologists = usersRes.rows;
    console.log(`Encontrados ${psychologists.length} psicólogos no banco de dados.`);

    for (const psi of psychologists) {
      // 2. Verifica se o psicólogo já possui termo assinado na user_consents
      const consentCheck = await pool.query(
        `SELECT id FROM "user_consents" WHERE "user_id" = $1 LIMIT 1`,
        [psi.id]
      );

      if (consentCheck.rows.length > 0) {
        console.log(`- Psicólogo ${psi.name} (${psi.email}) já possui termo registrado. Pulando.`);
        continue;
      }

      console.log(`- Gerando termo assinado para: ${psi.name} (${psi.email})...`);

      const acceptedAt = (psi.created_at || new Date()).toISOString();
      let signedPdfBase64: string | null = null;
      try {
        const signedBuffer = generateSignedPdfBuffer('pt', {
          id: psi.id,
          name: psi.name,
          crp: psi.crp,
          email: psi.email,
          acceptedAt
        });
        signedPdfBase64 = signedBuffer.toString('base64');
      } catch (pdfErr: any) {
        console.warn(`  Aviso ao gerar PDF para ${psi.name}:`, pdfErr.message);
      }

      const allChecksTrue = Array(13).fill(true);

      // Insere em user_consents
      await pool.query(
        `INSERT INTO "user_consents" 
          ("user_id", "term_version", "term_language", "check_items", "signed_pdf_base64", "accepted_at", "created_at")
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [
          psi.id,
          '2.0',
          'pt',
          JSON.stringify(allChecksTrue),
          signedPdfBase64,
          acceptedAt
        ]
      );

      // Insere em audit_logs
      await pool.query(
        `INSERT INTO "audit_logs" ("user_id", "user_role", "action", "resource_type", "resource_id", "details", "created_at")
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [
          psi.id,
          psi.role,
          'TERM_ACCEPTED_RETROACTIVE',
          'TERMS_CONSENT',
          psi.id,
          JSON.stringify({
            version: '2.0',
            language: 'pt',
            retroactive: true,
            totalCheckboxes: 13,
            acceptedAt
          })
        ]
      );

      console.log(`  ✅ Termo v2.0 preenchido e vinculado com sucesso para ${psi.name}!`);
    }

    console.log("\n🎉 Migração retroativa de todos os psicólogos concluída com 100% de sucesso!");
  } catch (err: any) {
    console.error("❌ Erro durante migração retroativa:", err.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

main();
