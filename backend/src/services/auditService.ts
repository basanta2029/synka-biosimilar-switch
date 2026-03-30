import { prisma } from '../utils/prisma';
import { AuthRequest } from '../types';

export interface AuditMetadata {
  [key: string]: any;
}

export const logAudit = async (params: {
  req: AuthRequest;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: AuditMetadata;
}) => {
  const { req, action, entityType, entityId, metadata } = params;

  if (!req.user) {
    // For safety, do not log if we don't know the user
    return;
  }

  try {
    await (prisma as any).auditLog.create({
      data: {
        userId: req.user.id,
        action,
        entityType,
        entityId,
        metadata: metadata ?? undefined,
      },
    });
  } catch (error) {
    // Audit logging failure should never break main request flow
    // eslint-disable-next-line no-console
    console.error('Failed to write audit log', {
      error,
      action,
      entityType,
      entityId,
    });
  }
};

