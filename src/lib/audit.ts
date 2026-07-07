import { prisma } from './db';

export async function writeAuditLog(params: { userId: string; action: string; target: string; meta?: Record<string, unknown> }) {
  return prisma.auditLog.create({
    data: {
      userId: params.userId,
      action: params.action,
      target: params.target,
      ipAddress: params.meta ? JSON.stringify(params.meta).slice(0, 200) : null,
    },
  });
}
