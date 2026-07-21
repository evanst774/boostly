// src/lib/utils/sanitize.ts

/**
 * Fields that should NEVER be exposed in API responses
 */
const SENSITIVE_USER_FIELDS = [
  'passwordHash',
  'totpSecret',
  'totpBackupCodes',
  'emailVerificationToken',
  'passwordResetToken',
  'passwordResetExpires',
  'failedLoginAttempts',
  'failedVerificationAttempts',
  'accountLockedUntil',
  'verificationLockedUntil',
] as const;

const SENSITIVE_CUSTOMER_FIELDS = ['nationalId'] as const;

type SensitiveUserField = (typeof SENSITIVE_USER_FIELDS)[number];
type SensitiveCustomerField = (typeof SENSITIVE_CUSTOMER_FIELDS)[number];

/**
 * Remove sensitive fields from a user object
 */
export function sanitizeUser<T extends Record<string, unknown>>(
  user: T,
): Omit<T, SensitiveUserField> {
  const sanitized = { ...user };
  for (const field of SENSITIVE_USER_FIELDS) {
    delete sanitized[field as keyof T];
  }
  return sanitized as Omit<T, SensitiveUserField>;
}

/**
 * Remove sensitive fields from a customer object
 */
export function sanitizeCustomer<T extends Record<string, unknown>>(
  customer: T,
): Omit<T, SensitiveCustomerField> {
  const sanitized = { ...customer };
  for (const field of SENSITIVE_CUSTOMER_FIELDS) {
    delete sanitized[field as keyof T];
  }
  return sanitized as Omit<T, SensitiveCustomerField>;
}

/**
 * Recursively sanitize an object, removing sensitive fields from nested user/customer objects
 */
export function sanitizeResponse<T>(data: T): T {
  if (Array.isArray(data)) {
    return data.map(sanitizeResponse) as unknown as T;
  }

  if (data && typeof data === 'object') {
    const obj = { ...data } as Record<string, unknown>;

    // Check if this looks like a user object (has passwordHash, email, roleId)
    if ('passwordHash' in obj || 'totpSecret' in obj) {
      return sanitizeUser(obj) as unknown as T;
    }

    // Check if this looks like a customer object (has nationalId)
    if ('nationalId' in obj && 'name' in obj && 'phone' in obj) {
      return sanitizeCustomer(obj) as unknown as T;
    }

    // Recursively sanitize nested objects
    for (const key of Object.keys(obj)) {
      if (obj[key] && typeof obj[key] === 'object') {
        obj[key] = sanitizeResponse(obj[key]);
      }
    }

    return obj as T;
  }

  return data;
}
