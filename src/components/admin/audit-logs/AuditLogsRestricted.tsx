// src/components/admin/audit-logs/AuditLogsRestricted.tsx
'use client';

import { ROUTES } from '@/lib/routes';
import { PermissionRestricted } from '@/components/auth/PermissionRestricted';

export function AuditLogsRestricted() {
  return (
    <PermissionRestricted
      feature="audit logs"
      requiredPermission="audit.read"
      action="view"
      backLink={ROUTES.DASHBOARD}
      backText="Back to Dashboard"
    />
  );
}
