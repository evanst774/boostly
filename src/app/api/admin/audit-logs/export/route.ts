// src/app/api/admin/audit-logs/export/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session.server';
import { requirePermission } from '@/lib/auth/permissions';
import { PermissionKeys } from '@/modules/rbac/permissions';
import { db } from '@/lib/db';
import { auditLogs, AuditEntityType } from '@/lib/db/schema/audit';
import { users } from '@/lib/db/schema/users';
import { and, desc, eq, like, or, sql, SQL } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await requirePermission(PermissionKeys.AUDIT_READ);

    const url = new URL(request.url);
    const search = url.searchParams.get('search') || '';
    const actionFilter = url.searchParams.get('action') || '';
    const moduleFilter = url.searchParams.get('module') || '';
    const dateRange = url.searchParams.get('dateRange') || '';
    const format = url.searchParams.get('format') || 'csv';

    // Build conditions
    const conditions: SQL[] = [];

    if (search) {
      conditions.push(
        or(
          like(users.name, `%${search}%`),
          like(auditLogs.action, `%${search}%`),
          like(auditLogs.entityId, `%${search}%`),
        ) as SQL,
      );
    }

    // Action category filter
    if (actionFilter === 'edit') {
      conditions.push(
        sql`(${auditLogs.action} LIKE '%CREATED%' OR ${auditLogs.action} LIKE '%UPDATED%' OR ${auditLogs.action} LIKE '%UPLOADED%')`,
      );
    } else if (actionFilter === 'delete') {
      conditions.push(
        sql`(${auditLogs.action} LIKE '%DELETED%' OR ${auditLogs.action} LIKE '%CANCELLED%')`,
      );
    } else if (actionFilter === 'payment') {
      conditions.push(
        sql`(${auditLogs.action} LIKE '%PAYMENT%' OR ${auditLogs.action} LIKE '%INSTALLMENT%')`,
      );
    } else if (actionFilter === 'inventory') {
      conditions.push(
        sql`(${auditLogs.action} LIKE '%BIKE%' OR ${auditLogs.action} LIKE '%CATEGORY%' OR ${auditLogs.action} LIKE '%INVENTORY%')`,
      );
    }

    if (moduleFilter && isValidEntityType(moduleFilter)) {
      conditions.push(eq(auditLogs.entityType, moduleFilter));
    }

    // Date range filter
    if (dateRange === 'today') {
      conditions.push(sql`date(${auditLogs.createdAt}) = date('now')`);
    } else if (dateRange === 'week') {
      conditions.push(
        sql`${auditLogs.createdAt} >= datetime('now', '-7 days')`,
      );
    } else if (dateRange === 'month') {
      conditions.push(
        sql`${auditLogs.createdAt} >= datetime('now', '-30 days')`,
      );
    }

    // Build query using $dynamic() so we can conditionally call .where()
    // even after chaining .orderBy()/.limit(). Without $dynamic(), Drizzle's
    // builder types lock in once those methods are chained, and reassigning
    // `query = query.where(...)` afterward breaks (the error you saw).
    let query = db
      .select({
        id: auditLogs.id,
        userName: users.name,
        userEmail: users.email,
        action: auditLogs.action,
        entityType: auditLogs.entityType,
        entityId: auditLogs.entityId,
        oldData: auditLogs.oldData,
        newData: auditLogs.newData,
        ipAddress: auditLogs.ipAddress,
        userAgent: auditLogs.userAgent,
        createdAt: auditLogs.createdAt,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .$dynamic();

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Fetch logs for export
    const logs = await query.orderBy(desc(auditLogs.createdAt)).limit(10000);

    // Format data for export
    const exportData = logs.map((log) => ({
      Date: new Date(log.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }),
      Time: new Date(log.createdAt).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      User: log.userName || 'System',
      Email: log.userEmail || 'N/A',
      Action: log.action,
      Module: log.entityType || 'N/A',
      'Record ID': log.entityId || 'N/A',
      Description: log.newData
        ? (() => {
            try {
              const d = JSON.parse(log.newData);
              return d.notes || d.reason || '';
            } catch {
              return '';
            }
          })()
        : '',
      'IP Address': log.ipAddress || 'N/A',
      'User Agent': log.userAgent || 'N/A',
    }));

    if (format === 'json') {
      return NextResponse.json({ logs: exportData, total: exportData.length });
    }

    // CSV format with BOM for Excel compatibility
    const headers = Object.keys(exportData[0] || {});
    const csvRows = [
      headers.join(','),
      ...exportData.map((row) =>
        headers
          .map((header) => {
            const value = row[header as keyof typeof row];
            const stringValue = String(value || '');
            // Escape quotes and wrap in quotes if contains comma, newline, or quote
            if (
              stringValue.includes(',') ||
              stringValue.includes('"') ||
              stringValue.includes('\n')
            ) {
              return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
          })
          .join(','),
      ),
    ];

    // Add BOM (Byte Order Mark) for Excel UTF-8 compatibility
    const BOM = '\uFEFF';
    const csvContent = BOM + csvRows.join('\n');
    const fileName = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}

// Type guard to validate entity type
function isValidEntityType(value: string): value is AuditEntityType {
  const validTypes = [
    'user',
    'role',
    'permission',
    'bike',
    'category',
    'supplier',
    'model',
    'sale',
    'invoice',
    'customer',
    'payment',
    'installment',
    'contract',
    'report',
    'setting',
    'company',
    'session',
    'otp',
    'communication',
    'email',
  ] as const;

  return (validTypes as readonly string[]).includes(value);
}
