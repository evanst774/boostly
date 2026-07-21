// src/components/admin/users/detail/UserDetailRestricted.tsx
'use client';

import { ROUTES } from '@/lib/routes';
import { PermissionRestricted } from '@/components/auth/PermissionRestricted';

export function UserDetailRestricted() {
  return (
    <PermissionRestricted
      feature="view user details"
      requiredPermission="users.manage"
      action="view"
      backLink={ROUTES.ADMIN.USERS}
      backText="Back to Users"
    />
  );
}
