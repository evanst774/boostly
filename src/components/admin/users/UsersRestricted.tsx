// src/components/admin/users/UsersRestricted.tsx
'use client';

import { ROUTES } from '@/lib/routes';
import { PermissionRestricted } from '@/components/auth/PermissionRestricted';

export function UsersRestricted() {
  return (
    <PermissionRestricted
      feature="user management"
      requiredPermission="users.manage"
      action="manage"
      backLink={ROUTES.DASHBOARD}
      backText="Back to Dashboard"
    />
  );
}
