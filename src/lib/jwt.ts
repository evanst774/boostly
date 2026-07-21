// src/lib/jwt.ts

import { SignJWT, jwtVerify } from 'jose';
import { SystemRoles } from '@/modules/rbac/roles';

export interface JWTPayload {
  sub: string;
  email: string;
  name: string;
  role: string;
  roles: string[];
  iat?: number;
  exp?: number;
}

export const JWT_COOKIE_NAME = 'auth-token';
export const JWT_EXPIRY_SECONDS = 7 * 24 * 60 * 60;

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return new TextEncoder().encode(secret);
}

export async function signJWT(
  payload: Omit<JWTPayload, 'iat' | 'exp'>,
): Promise<string> {
  return new SignJWT(payload as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${JWT_EXPIRY_SECONDS}s`)
    .sign(getSecret());
}

export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

// ============================================
// Boostly Role-Based Redirect
// ============================================

export function getRoleRedirectPath(role: string): string {
  // Admin roles → Admin Dashboard
  if (role === SystemRoles.SUPER_ADMIN || role === SystemRoles.ADMIN) {
    return '/admin/dashboard';
  }

  // Regular users → Consumer Dashboard
  return '/dashboard';
}

// ============================================
// Helper: Get redirect path with fallback
// ============================================

export function getRedirectPathForUser(
  role: string,
  roles: string[] = [],
): string {
  // Check if user has admin role
  const isAdmin =
    roles.includes(SystemRoles.SUPER_ADMIN) ||
    roles.includes(SystemRoles.ADMIN) ||
    role === SystemRoles.SUPER_ADMIN ||
    role === SystemRoles.ADMIN;

  if (isAdmin) {
    return '/admin/dashboard';
  }

  return '/dashboard';
}

// ============================================
// Helper: Check if role is admin
// ============================================

export function isAdminRole(role: string): boolean {
  return role === SystemRoles.SUPER_ADMIN || role === SystemRoles.ADMIN;
}

export function isAdminUser(roles: string[]): boolean {
  return (
    roles.includes(SystemRoles.SUPER_ADMIN) || roles.includes(SystemRoles.ADMIN)
  );
}

// ============================================
// Helper: Get dashboard route by role
// ============================================

export const DASHBOARD_ROUTES: Record<string, string> = {
  [SystemRoles.SUPER_ADMIN]: '/admin/dashboard',
  [SystemRoles.ADMIN]: '/admin/dashboard',
  [SystemRoles.USER]: '/dashboard',
};

export function getDashboardRoute(role: string): string {
  return DASHBOARD_ROUTES[role] || '/dashboard';
}

// ============================================
// Helper: Check if path is admin route
// ============================================

export function isAdminRoute(pathname: string): boolean {
  return pathname.startsWith('/admin');
}

// ============================================
// Exports
// ============================================

export { SystemRoles };
