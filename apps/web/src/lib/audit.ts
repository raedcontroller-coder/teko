import { db } from '../../../../packages/db/db/index';
import { auditLogs } from '../../../../packages/db/db/schema';

export interface AuditLogParams {
  userId?: string | null;
  userRole?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  details?: Record<string, unknown>;
}

/**
 * Registra um log de auditoria no sistema de forma não-bloqueante e segura (fail-safe).
 * Falhas na auditoria nunca interrompem a operação principal do usuário.
 */
export async function recordAudit(params: AuditLogParams): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      userId: params.userId || null,
      userRole: params.userRole || null,
      action: params.action,
      resourceType: params.resourceType,
      resourceId: params.resourceId || null,
      details: params.details || {},
    });
  } catch (error) {
    // Falha silenciosa para o cliente, preservando a disponibilidade
    console.error('[AUDIT TRAIL ERROR]: Falha ao registrar log de auditoria:', error);
  }
}
