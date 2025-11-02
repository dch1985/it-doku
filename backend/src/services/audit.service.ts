import { prisma } from '../lib/prisma.js';

export interface AuditLogData {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditService {
  /**
   * Create an audit log entry
   */
  async log(data: AuditLogData): Promise<void> {
    try {
      await prisma.activityLog.create({
        data: {
          userId: data.userId || null,
          action: data.action,
          resource: data.resource,
          resourceId: data.resourceId || null,
          metadata: data.metadata ? JSON.stringify(data.metadata) : null,
          ipAddress: data.ipAddress || null,
          userAgent: data.userAgent || null,
        },
      });
    } catch (error: any) {
      // Log errors but don't fail the request
      console.error('[AuditService] Failed to create audit log:', error.message);
    }
  }

  /**
   * Get audit logs with filters
   */
  async getLogs(filters?: {
    userId?: string;
    action?: string;
    resource?: string;
    resourceId?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};
    
    if (filters?.userId) where.userId = filters.userId;
    if (filters?.action) where.action = filters.action;
    if (filters?.resource) where.resource = filters.resource;
    if (filters?.resourceId) where.resourceId = filters.resourceId;

    const logs = await prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 100,
      skip: filters?.offset || 0,
    });

    return logs.map(log => ({
      ...log,
      metadata: log.metadata ? JSON.parse(log.metadata) : null,
    }));
  }

  /**
   * Get audit logs for a specific resource
   */
  async getResourceLogs(resource: string, resourceId: string, limit = 50) {
    return this.getLogs({ resource, resourceId, limit });
  }

  /**
   * Get audit logs for a specific user
   */
  async getUserLogs(userId: string, limit = 100) {
    return this.getLogs({ userId, limit });
  }

  /**
   * Get recent activity across all resources
   */
  async getRecentActivity(limit = 50) {
    return this.getLogs({ limit });
  }

  /**
   * Get activity statistics
   */
  async getStats(timeframe: 'day' | 'week' | 'month' = 'week') {
    const now = new Date();
    const startDate = new Date();
    
    switch (timeframe) {
      case 'day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
    }

    const logs = await prisma.activityLog.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        action: true,
        resource: true,
        createdAt: true,
      },
    });

    // Count actions
    const actionCounts: Record<string, number> = {};
    const resourceCounts: Record<string, number> = {};
    
    logs.forEach(log => {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
      resourceCounts[log.resource] = (resourceCounts[log.resource] || 0) + 1;
    });

    return {
      total: logs.length,
      actions: actionCounts,
      resources: resourceCounts,
      period: timeframe,
    };
  }
}

export const auditService = new AuditService();

