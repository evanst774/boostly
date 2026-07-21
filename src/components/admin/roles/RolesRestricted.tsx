// src/components/admin/roles/RolesRestricted.tsx
'use client';

import { ROUTES } from '@/lib/routes';
import { PermissionRestricted } from '@/components/auth/PermissionRestricted';

export function RolesRestricted() {
  return (
    <PermissionRestricted
      feature="roles & permissions"
      requiredPermission="roles.manage"
      action="manage"
      backLink={ROUTES.DASHBOARD}
      backText="Back to Dashboard"
    />
  );
}
