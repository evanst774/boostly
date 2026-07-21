// src/components/admin/users/edit/EditUserRestricted.tsx
'use client';

import { ROUTES } from '@/lib/routes';
import { PermissionRestricted } from '@/components/auth/PermissionRestricted';

export function EditUserRestricted() {
  return (
    <PermissionRestricted
      feature="edit user"
      requiredPermission="users.manage"
      action="edit"
      backLink={ROUTES.ADMIN.USERS}
      backText="Back to Users"
    />
  );
}
