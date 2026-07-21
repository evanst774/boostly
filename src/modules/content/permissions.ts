// src/modules/content/permissions.ts
import { PermissionKeys } from '@/modules/rbac/permissions';

export const ContentPermissions = {
  // Videos
  VIDEOS_READ: PermissionKeys.VIDEOS_READ,
  VIDEOS_CREATE: PermissionKeys.VIDEOS_CREATE,
  VIDEOS_UPDATE: PermissionKeys.VIDEOS_UPDATE,
  VIDEOS_DELETE: PermissionKeys.VIDEOS_DELETE,
  VIDEOS_PUBLISH: PermissionKeys.VIDEOS_PUBLISH,

  // Games
  GAMES_READ: PermissionKeys.GAMES_READ,
  GAMES_CREATE: PermissionKeys.GAMES_CREATE,
  GAMES_UPDATE: PermissionKeys.GAMES_UPDATE,
  GAMES_DELETE: PermissionKeys.GAMES_DELETE,
  GAMES_PUBLISH: PermissionKeys.GAMES_PUBLISH,

  // Surveys
  SURVEYS_READ: PermissionKeys.SURVEYS_READ,
  SURVEYS_CREATE: PermissionKeys.SURVEYS_CREATE,
  SURVEYS_UPDATE: PermissionKeys.SURVEYS_UPDATE,
  SURVEYS_DELETE: PermissionKeys.SURVEYS_DELETE,
  SURVEYS_PUBLISH: PermissionKeys.SURVEYS_PUBLISH,
} as const;

export type ContentPermission =
  (typeof ContentPermissions)[keyof typeof ContentPermissions];
