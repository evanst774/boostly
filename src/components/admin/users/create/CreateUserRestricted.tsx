// src/components/admin/users/create/CreateUserRestricted.tsx
'use client';

import { ROUTES } from '@/lib/routes';
import { PermissionRestricted } from '@/components/auth/PermissionRestricted';

export function CreateUserRestricted() {
  return (
    <PermissionRestricted
      feature="create user"
      requiredPermission="users.manage"
      action="create"
      backLink={ROUTES.ADMIN.USERS}
      backText="Back to Users"
    />
  );
}
