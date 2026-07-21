// src/modules/rbac/permissions.ts

// ============================================
// PERMISSION KEYS - ALL BOOSTLY PERMISSIONS
// ============================================
export const PermissionKeys = {
  // ========== CONTENT ==========
  CONTENT_READ: 'content.read',
  CONTENT_CREATE: 'content.create',
  CONTENT_UPDATE: 'content.update',
  CONTENT_DELETE: 'content.delete',
  CONTENT_PUBLISH: 'content.publish',
  CONTENT_APPROVE: 'content.approve',
  CONTENT_MANAGE: 'content.manage',

  // ========== VIDEOS ==========
  VIDEOS_READ: 'videos.read',
  VIDEOS_CREATE: 'videos.create',
  VIDEOS_UPDATE: 'videos.update',
  VIDEOS_DELETE: 'videos.delete',
  VIDEOS_PUBLISH: 'videos.publish',
  VIDEOS_MANAGE: 'videos.manage',

  // ========== GAMES ==========
  GAMES_READ: 'games.read',
  GAMES_CREATE: 'games.create',
  GAMES_UPDATE: 'games.update',
  GAMES_DELETE: 'games.delete',
  GAMES_PUBLISH: 'games.publish',
  GAMES_MANAGE: 'games.manage',

  // ========== SURVEYS ==========
  SURVEYS_READ: 'surveys.read',
  SURVEYS_CREATE: 'surveys.create',
  SURVEYS_UPDATE: 'surveys.update',
  SURVEYS_DELETE: 'surveys.delete',
  SURVEYS_PUBLISH: 'surveys.publish',
  SURVEYS_MANAGE: 'surveys.manage',

  // ========== REWARDS ==========
  REWARDS_READ: 'rewards.read',
  REWARDS_CREATE: 'rewards.create',
  REWARDS_UPDATE: 'rewards.update',
  REWARDS_DELETE: 'rewards.delete',
  REWARDS_MANAGE: 'rewards.manage',

  // ========== WALLET & TRANSACTIONS ==========
  WALLET_READ: 'wallet.read',
  WALLET_UPDATE: 'wallet.update',
  TRANSACTIONS_READ: 'transactions.read',
  TRANSACTIONS_CREATE: 'transactions.create',
  TRANSACTIONS_MANAGE: 'transactions.manage',

  // ========== WITHDRAWALS ==========
  WITHDRAWALS_READ: 'withdrawals.read',
  WITHDRAWALS_CREATE: 'withdrawals.create',
  WITHDRAWALS_APPROVE: 'withdrawals.approve',
  WITHDRAWALS_REJECT: 'withdrawals.reject',
  WITHDRAWALS_PROCESS: 'withdrawals.process',
  WITHDRAWALS_MANAGE: 'withdrawals.manage',

  // ========== REFERRALS ==========
  REFERRALS_READ: 'referrals.read',
  REFERRALS_CREATE: 'referrals.create',
  REFERRALS_UPDATE: 'referrals.update',
  REFERRALS_DELETE: 'referrals.delete',
  REFERRALS_MANAGE: 'referrals.manage',

  // ========== BADGES ==========
  BADGES_READ: 'badges.read',
  BADGES_CREATE: 'badges.create',
  BADGES_UPDATE: 'badges.update',
  BADGES_DELETE: 'badges.delete',
  BADGES_MANAGE: 'badges.manage',

  // ========== SUBSCRIPTIONS ==========
  SUBSCRIPTIONS_READ: 'subscriptions.read',
  SUBSCRIPTIONS_CREATE: 'subscriptions.create',
  SUBSCRIPTIONS_UPDATE: 'subscriptions.update',
  SUBSCRIPTIONS_DELETE: 'subscriptions.delete',
  SUBSCRIPTIONS_MANAGE: 'subscriptions.manage',

  // ========== CRYPTO ==========
  CRYPTO_CURRENCIES_READ: 'crypto.currencies.read',
  CRYPTO_CURRENCIES_CREATE: 'crypto.currencies.create',
  CRYPTO_CURRENCIES_UPDATE: 'crypto.currencies.update',
  CRYPTO_CURRENCIES_DELETE: 'crypto.currencies.delete',

  CRYPTO_WALLET_READ: 'crypto.wallet.read',
  CRYPTO_WALLET_CREATE: 'crypto.wallet.create',
  CRYPTO_WALLET_UPDATE: 'crypto.wallet.update',

  CRYPTO_DEPOSITS_READ: 'crypto.deposits.read',
  CRYPTO_DEPOSITS_CREATE: 'crypto.deposits.create',
  CRYPTO_DEPOSITS_UPDATE: 'crypto.deposits.update',
  CRYPTO_DEPOSITS_APPROVE: 'crypto.deposits.approve',
  CRYPTO_DEPOSITS_REJECT: 'crypto.deposits.reject',
  CRYPTO_DEPOSITS_PROCESS: 'crypto.deposits.process',

  CRYPTO_WITHDRAWALS_READ: 'crypto.withdrawals.read',
  CRYPTO_WITHDRAWALS_CREATE: 'crypto.withdrawals.create',
  CRYPTO_WITHDRAWALS_UPDATE: 'crypto.withdrawals.update',
  CRYPTO_WITHDRAWALS_APPROVE: 'crypto.withdrawals.approve',
  CRYPTO_WITHDRAWALS_REJECT: 'crypto.withdrawals.reject',
  CRYPTO_WITHDRAWALS_PROCESS: 'crypto.withdrawals.process',

  CRYPTO_RATES_READ: 'crypto.rates.read',
  CRYPTO_RATES_UPDATE: 'crypto.rates.update',

  // ========== USERS ==========
  USERS_READ: 'users.read',
  USERS_CREATE: 'users.create',
  USERS_UPDATE: 'users.update',
  USERS_DELETE: 'users.delete',
  USERS_MANAGE_ROLES: 'users.manage_roles',
  USERS_MANAGE: 'users.manage',

  // ========== ADMIN ==========
  ADMIN_DASHBOARD: 'admin.dashboard',
  ADMIN_ANALYTICS: 'admin.analytics',
  ADMIN_SETTINGS: 'admin.settings',
  ADMIN_LOGS: 'admin.logs',

  // ========== ROLES ==========
  ROLES_MANAGE: 'roles.manage',

  // ========== SYSTEM ==========
  SYSTEM_CONFIG: 'system.config',
  SYSTEM_LOGS: 'system.logs',
  SYSTEM_BACKUP: 'system.backup',
  SUDO_MANAGE: 'sudo.manage',

  // ========== AUDIT ==========
  AUDIT_READ: 'audit.read',
  AUDIT_EXPORT: 'audit.export',

  // ========== PROFILE ==========
  PROFILE_READ: 'profile.read',
  PROFILE_UPDATE: 'profile.update',
  PROFILE_DELETE: 'profile.delete',

  // ========== SECURITY ==========
  SECURITY_READ: 'security.read',
  SECURITY_UPDATE: 'security.update',
  SECURITY_CHANGE_PASSWORD: 'security.change_password',
  SECURITY_CHANGE_EMAIL: 'security.change_email',
  TWOFA_READ: '2fa.read',
  TWOFA_MANAGE: '2fa.manage',

  // ========== DASHBOARD ==========
  DASHBOARD_READ: 'dashboard.read',

  // ========== NOTIFICATIONS ==========
  NOTIFICATIONS_READ: 'notifications.read',
  NOTIFICATIONS_MANAGE: 'notifications.manage',

  // ========== DAILY BONUS ==========
  DAILY_BONUS_READ: 'daily_bonus.read',
  DAILY_BONUS_CLAIM: 'daily_bonus.claim',
  DAILY_BONUS_MANAGE: 'daily_bonus.manage',

  // ========== ADS ==========
  ADS_READ: 'ads.read',
  ADS_WATCH: 'ads.watch',
  ADS_CREATE: 'ads.create',
  ADS_UPDATE: 'ads.update',
  ADS_DELETE: 'ads.delete',
  ADS_MANAGE: 'ads.manage',
} as const;

export type PermissionKey =
  (typeof PermissionKeys)[keyof typeof PermissionKeys];

// ============================================
// ALL PERMISSIONS REGISTRY
// ============================================
export const ALL_PERMISSIONS: Array<{
  key: PermissionKey;
  module: string;
  description: string;
}> = [
  // ========== CONTENT ==========
  {
    key: PermissionKeys.CONTENT_READ,
    module: 'content',
    description: 'View all content',
  },
  {
    key: PermissionKeys.CONTENT_CREATE,
    module: 'content',
    description: 'Create new content',
  },
  {
    key: PermissionKeys.CONTENT_UPDATE,
    module: 'content',
    description: 'Update existing content',
  },
  {
    key: PermissionKeys.CONTENT_DELETE,
    module: 'content',
    description: 'Delete content',
  },
  {
    key: PermissionKeys.CONTENT_PUBLISH,
    module: 'content',
    description: 'Publish content to users',
  },
  {
    key: PermissionKeys.CONTENT_APPROVE,
    module: 'content',
    description: 'Approve content before publishing',
  },
  {
    key: PermissionKeys.CONTENT_MANAGE,
    module: 'content',
    description: 'Full content management',
  },

  // ========== VIDEOS ==========
  {
    key: PermissionKeys.VIDEOS_READ,
    module: 'videos',
    description: 'View videos',
  },
  {
    key: PermissionKeys.VIDEOS_CREATE,
    module: 'videos',
    description: 'Create new videos',
  },
  {
    key: PermissionKeys.VIDEOS_UPDATE,
    module: 'videos',
    description: 'Update video information',
  },
  {
    key: PermissionKeys.VIDEOS_DELETE,
    module: 'videos',
    description: 'Delete videos',
  },
  {
    key: PermissionKeys.VIDEOS_PUBLISH,
    module: 'videos',
    description: 'Publish videos to users',
  },
  {
    key: PermissionKeys.VIDEOS_MANAGE,
    module: 'videos',
    description: 'Full video management',
  },

  // ========== GAMES ==========
  {
    key: PermissionKeys.GAMES_READ,
    module: 'games',
    description: 'View games',
  },
  {
    key: PermissionKeys.GAMES_CREATE,
    module: 'games',
    description: 'Create new games',
  },
  {
    key: PermissionKeys.GAMES_UPDATE,
    module: 'games',
    description: 'Update game information',
  },
  {
    key: PermissionKeys.GAMES_DELETE,
    module: 'games',
    description: 'Delete games',
  },
  {
    key: PermissionKeys.GAMES_PUBLISH,
    module: 'games',
    description: 'Publish games to users',
  },
  {
    key: PermissionKeys.GAMES_MANAGE,
    module: 'games',
    description: 'Full game management',
  },

  // ========== SURVEYS ==========
  {
    key: PermissionKeys.SURVEYS_READ,
    module: 'surveys',
    description: 'View surveys',
  },
  {
    key: PermissionKeys.SURVEYS_CREATE,
    module: 'surveys',
    description: 'Create new surveys',
  },
  {
    key: PermissionKeys.SURVEYS_UPDATE,
    module: 'surveys',
    description: 'Update survey information',
  },
  {
    key: PermissionKeys.SURVEYS_DELETE,
    module: 'surveys',
    description: 'Delete surveys',
  },
  {
    key: PermissionKeys.SURVEYS_PUBLISH,
    module: 'surveys',
    description: 'Publish surveys to users',
  },
  {
    key: PermissionKeys.SURVEYS_MANAGE,
    module: 'surveys',
    description: 'Full survey management',
  },

  // ========== REWARDS ==========
  {
    key: PermissionKeys.REWARDS_READ,
    module: 'rewards',
    description: 'View rewards',
  },
  {
    key: PermissionKeys.REWARDS_CREATE,
    module: 'rewards',
    description: 'Create rewards',
  },
  {
    key: PermissionKeys.REWARDS_UPDATE,
    module: 'rewards',
    description: 'Update rewards',
  },
  {
    key: PermissionKeys.REWARDS_DELETE,
    module: 'rewards',
    description: 'Delete rewards',
  },
  {
    key: PermissionKeys.REWARDS_MANAGE,
    module: 'rewards',
    description: 'Full reward management',
  },

  // ========== WALLET ==========
  {
    key: PermissionKeys.WALLET_READ,
    module: 'wallet',
    description: 'View wallet balance and details',
  },
  {
    key: PermissionKeys.WALLET_UPDATE,
    module: 'wallet',
    description: 'Update wallet settings',
  },
  {
    key: PermissionKeys.TRANSACTIONS_READ,
    module: 'wallet',
    description: 'View transaction history',
  },
  {
    key: PermissionKeys.TRANSACTIONS_CREATE,
    module: 'wallet',
    description: 'Create transactions',
  },
  {
    key: PermissionKeys.TRANSACTIONS_MANAGE,
    module: 'wallet',
    description: 'Manage transactions',
  },

  // ========== WITHDRAWALS ==========
  {
    key: PermissionKeys.WITHDRAWALS_READ,
    module: 'withdrawals',
    description: 'View withdrawal requests',
  },
  {
    key: PermissionKeys.WITHDRAWALS_CREATE,
    module: 'withdrawals',
    description: 'Request withdrawal',
  },
  {
    key: PermissionKeys.WITHDRAWALS_APPROVE,
    module: 'withdrawals',
    description: 'Approve withdrawal requests',
  },
  {
    key: PermissionKeys.WITHDRAWALS_REJECT,
    module: 'withdrawals',
    description: 'Reject withdrawal requests',
  },
  {
    key: PermissionKeys.WITHDRAWALS_PROCESS,
    module: 'withdrawals',
    description: 'Process withdrawal payments',
  },
  {
    key: PermissionKeys.WITHDRAWALS_MANAGE,
    module: 'withdrawals',
    description: 'Full withdrawal management',
  },

  // ========== REFERRALS ==========
  {
    key: PermissionKeys.REFERRALS_READ,
    module: 'referrals',
    description: 'View referrals',
  },
  {
    key: PermissionKeys.REFERRALS_CREATE,
    module: 'referrals',
    description: 'Create referral codes',
  },
  {
    key: PermissionKeys.REFERRALS_UPDATE,
    module: 'referrals',
    description: 'Update referral information',
  },
  {
    key: PermissionKeys.REFERRALS_DELETE,
    module: 'referrals',
    description: 'Delete referral records',
  },
  {
    key: PermissionKeys.REFERRALS_MANAGE,
    module: 'referrals',
    description: 'Full referral management',
  },

  // ========== BADGES ==========
  {
    key: PermissionKeys.BADGES_READ,
    module: 'badges',
    description: 'View badges',
  },
  {
    key: PermissionKeys.BADGES_CREATE,
    module: 'badges',
    description: 'Create badges',
  },
  {
    key: PermissionKeys.BADGES_UPDATE,
    module: 'badges',
    description: 'Update badge information',
  },
  {
    key: PermissionKeys.BADGES_DELETE,
    module: 'badges',
    description: 'Delete badges',
  },
  {
    key: PermissionKeys.BADGES_MANAGE,
    module: 'badges',
    description: 'Full badge management',
  },

  // ========== SUBSCRIPTIONS ==========
  {
    key: PermissionKeys.SUBSCRIPTIONS_READ,
    module: 'subscriptions',
    description: 'View subscriptions',
  },
  {
    key: PermissionKeys.SUBSCRIPTIONS_CREATE,
    module: 'subscriptions',
    description: 'Create subscriptions',
  },
  {
    key: PermissionKeys.SUBSCRIPTIONS_UPDATE,
    module: 'subscriptions',
    description: 'Update subscription information',
  },
  {
    key: PermissionKeys.SUBSCRIPTIONS_DELETE,
    module: 'subscriptions',
    description: 'Delete subscriptions',
  },
  {
    key: PermissionKeys.SUBSCRIPTIONS_MANAGE,
    module: 'subscriptions',
    description: 'Full subscription management',
  },

  // ========== CRYPTO ==========
  {
    key: PermissionKeys.CRYPTO_CURRENCIES_READ,
    module: 'crypto',
    description: 'View crypto currencies',
  },
  {
    key: PermissionKeys.CRYPTO_CURRENCIES_CREATE,
    module: 'crypto',
    description: 'Create crypto currencies',
  },
  {
    key: PermissionKeys.CRYPTO_CURRENCIES_UPDATE,
    module: 'crypto',
    description: 'Update crypto currencies',
  },
  {
    key: PermissionKeys.CRYPTO_CURRENCIES_DELETE,
    module: 'crypto',
    description: 'Delete crypto currencies',
  },
  {
    key: PermissionKeys.CRYPTO_WALLET_READ,
    module: 'crypto',
    description: 'View crypto wallet',
  },
  {
    key: PermissionKeys.CRYPTO_WALLET_CREATE,
    module: 'crypto',
    description: 'Create crypto wallet',
  },
  {
    key: PermissionKeys.CRYPTO_WALLET_UPDATE,
    module: 'crypto',
    description: 'Update crypto wallet',
  },
  {
    key: PermissionKeys.CRYPTO_DEPOSITS_READ,
    module: 'crypto',
    description: 'View crypto deposits',
  },
  {
    key: PermissionKeys.CRYPTO_DEPOSITS_CREATE,
    module: 'crypto',
    description: 'Create crypto deposits',
  },
  {
    key: PermissionKeys.CRYPTO_DEPOSITS_UPDATE,
    module: 'crypto',
    description: 'Update crypto deposits',
  },
  {
    key: PermissionKeys.CRYPTO_DEPOSITS_APPROVE,
    module: 'crypto',
    description: 'Approve crypto deposits',
  },
  {
    key: PermissionKeys.CRYPTO_DEPOSITS_REJECT,
    module: 'crypto',
    description: 'Reject crypto deposits',
  },
  {
    key: PermissionKeys.CRYPTO_DEPOSITS_PROCESS,
    module: 'crypto',
    description: 'Process crypto deposits',
  },
  {
    key: PermissionKeys.CRYPTO_WITHDRAWALS_READ,
    module: 'crypto',
    description: 'View crypto withdrawals',
  },
  {
    key: PermissionKeys.CRYPTO_WITHDRAWALS_CREATE,
    module: 'crypto',
    description: 'Create crypto withdrawals',
  },
  {
    key: PermissionKeys.CRYPTO_WITHDRAWALS_UPDATE,
    module: 'crypto',
    description: 'Update crypto withdrawals',
  },
  {
    key: PermissionKeys.CRYPTO_WITHDRAWALS_APPROVE,
    module: 'crypto',
    description: 'Approve crypto withdrawals',
  },
  {
    key: PermissionKeys.CRYPTO_WITHDRAWALS_REJECT,
    module: 'crypto',
    description: 'Reject crypto withdrawals',
  },
  {
    key: PermissionKeys.CRYPTO_WITHDRAWALS_PROCESS,
    module: 'crypto',
    description: 'Process crypto withdrawals',
  },
  {
    key: PermissionKeys.CRYPTO_RATES_READ,
    module: 'crypto',
    description: 'View crypto rates',
  },
  {
    key: PermissionKeys.CRYPTO_RATES_UPDATE,
    module: 'crypto',
    description: 'Update crypto rates',
  },

  // ========== USERS ==========
  {
    key: PermissionKeys.USERS_READ,
    module: 'users',
    description: 'View user details',
  },
  {
    key: PermissionKeys.USERS_CREATE,
    module: 'users',
    description: 'Create users',
  },
  {
    key: PermissionKeys.USERS_UPDATE,
    module: 'users',
    description: 'Update user details',
  },
  {
    key: PermissionKeys.USERS_DELETE,
    module: 'users',
    description: 'Delete user accounts',
  },
  {
    key: PermissionKeys.USERS_MANAGE_ROLES,
    module: 'users',
    description: 'Manage user roles',
  },
  {
    key: PermissionKeys.USERS_MANAGE,
    module: 'users',
    description: 'Full user management',
  },

  // ========== ADMIN ==========
  {
    key: PermissionKeys.ADMIN_DASHBOARD,
    module: 'admin',
    description: 'Access admin dashboard',
  },
  {
    key: PermissionKeys.ADMIN_ANALYTICS,
    module: 'admin',
    description: 'View analytics and statistics',
  },
  {
    key: PermissionKeys.ADMIN_SETTINGS,
    module: 'admin',
    description: 'Manage system settings',
  },
  {
    key: PermissionKeys.ADMIN_LOGS,
    module: 'admin',
    description: 'View system logs',
  },

  // ========== ROLES ==========
  {
    key: PermissionKeys.ROLES_MANAGE,
    module: 'roles',
    description: 'Create, edit and assign permissions to roles',
  },

  // ========== SYSTEM ==========
  {
    key: PermissionKeys.SYSTEM_CONFIG,
    module: 'system',
    description: 'Configure system settings',
  },
  {
    key: PermissionKeys.SYSTEM_LOGS,
    module: 'system',
    description: 'View system logs',
  },
  {
    key: PermissionKeys.SYSTEM_BACKUP,
    module: 'system',
    description: 'Manage system backups',
  },
  {
    key: PermissionKeys.SUDO_MANAGE,
    module: 'system',
    description: 'Manage sudo mode settings (session duration, code expiry)',
  },

  // ========== AUDIT ==========
  {
    key: PermissionKeys.AUDIT_READ,
    module: 'audit',
    description: 'View audit logs',
  },
  {
    key: PermissionKeys.AUDIT_EXPORT,
    module: 'audit',
    description: 'Export audit logs',
  },

  // ========== PROFILE ==========
  {
    key: PermissionKeys.PROFILE_READ,
    module: 'profile',
    description: 'View profile information',
  },
  {
    key: PermissionKeys.PROFILE_UPDATE,
    module: 'profile',
    description: 'Update profile information',
  },
  {
    key: PermissionKeys.PROFILE_DELETE,
    module: 'profile',
    description: 'Delete profile (account deletion)',
  },

  // ========== SECURITY ==========
  {
    key: PermissionKeys.SECURITY_READ,
    module: 'security',
    description: 'View security settings',
  },
  {
    key: PermissionKeys.SECURITY_UPDATE,
    module: 'security',
    description: 'Update security settings',
  },
  {
    key: PermissionKeys.SECURITY_CHANGE_PASSWORD,
    module: 'security',
    description: 'Change password',
  },
  {
    key: PermissionKeys.SECURITY_CHANGE_EMAIL,
    module: 'security',
    description: 'Change email address',
  },
  {
    key: PermissionKeys.TWOFA_READ,
    module: 'security',
    description: 'View 2FA settings',
  },
  {
    key: PermissionKeys.TWOFA_MANAGE,
    module: 'security',
    description: 'Manage 2FA settings',
  },

  // ========== DASHBOARD ==========
  {
    key: PermissionKeys.DASHBOARD_READ,
    module: 'dashboard',
    description: 'View dashboard',
  },

  // ========== NOTIFICATIONS ==========
  {
    key: PermissionKeys.NOTIFICATIONS_READ,
    module: 'notifications',
    description: 'View notifications',
  },
  {
    key: PermissionKeys.NOTIFICATIONS_MANAGE,
    module: 'notifications',
    description: 'Manage notifications',
  },

  // ========== DAILY BONUS ==========
  {
    key: PermissionKeys.DAILY_BONUS_READ,
    module: 'daily_bonus',
    description: 'View daily bonus information',
  },
  {
    key: PermissionKeys.DAILY_BONUS_CLAIM,
    module: 'daily_bonus',
    description: 'Claim daily bonus',
  },
  {
    key: PermissionKeys.DAILY_BONUS_MANAGE,
    module: 'daily_bonus',
    description: 'Manage daily bonus settings',
  },

  // ========== ADS ==========
  {
    key: PermissionKeys.ADS_READ,
    module: 'ads',
    description: 'View ads',
  },
  {
    key: PermissionKeys.ADS_WATCH,
    module: 'ads',
    description: 'Watch ads to earn rewards',
  },
  {
    key: PermissionKeys.ADS_CREATE,
    module: 'ads',
    description: 'Create ads',
  },
  {
    key: PermissionKeys.ADS_UPDATE,
    module: 'ads',
    description: 'Update ad information',
  },
  {
    key: PermissionKeys.ADS_DELETE,
    module: 'ads',
    description: 'Delete ads',
  },
  {
    key: PermissionKeys.ADS_MANAGE,
    module: 'ads',
    description: 'Full ad management',
  },
];

// ============================================
// DEFAULT ROLE PERMISSIONS
// ============================================
export const DEFAULT_ROLE_PERMISSIONS: Record<string, PermissionKey[]> = {
  SUPER_ADMIN: ALL_PERMISSIONS.map((p) => p.key),

  ADMIN: [
    // Content
    PermissionKeys.CONTENT_READ,
    PermissionKeys.CONTENT_CREATE,
    PermissionKeys.CONTENT_UPDATE,
    PermissionKeys.CONTENT_PUBLISH,
    PermissionKeys.CONTENT_APPROVE,
    PermissionKeys.CONTENT_MANAGE,

    // Videos
    PermissionKeys.VIDEOS_READ,
    PermissionKeys.VIDEOS_CREATE,
    PermissionKeys.VIDEOS_UPDATE,
    PermissionKeys.VIDEOS_PUBLISH,
    PermissionKeys.VIDEOS_MANAGE,

    // Games
    PermissionKeys.GAMES_READ,
    PermissionKeys.GAMES_CREATE,
    PermissionKeys.GAMES_UPDATE,
    PermissionKeys.GAMES_PUBLISH,
    PermissionKeys.GAMES_MANAGE,

    // Surveys
    PermissionKeys.SURVEYS_READ,
    PermissionKeys.SURVEYS_CREATE,
    PermissionKeys.SURVEYS_UPDATE,
    PermissionKeys.SURVEYS_PUBLISH,
    PermissionKeys.SURVEYS_MANAGE,

    // Rewards
    PermissionKeys.REWARDS_READ,
    PermissionKeys.REWARDS_CREATE,
    PermissionKeys.REWARDS_UPDATE,
    PermissionKeys.REWARDS_MANAGE,

    // Users
    PermissionKeys.USERS_READ,
    PermissionKeys.USERS_UPDATE,
    PermissionKeys.USERS_MANAGE_ROLES,

    // Withdrawals
    PermissionKeys.WITHDRAWALS_READ,
    PermissionKeys.WITHDRAWALS_APPROVE,
    PermissionKeys.WITHDRAWALS_REJECT,
    PermissionKeys.WITHDRAWALS_PROCESS,

    // Referrals
    PermissionKeys.REFERRALS_READ,
    PermissionKeys.REFERRALS_MANAGE,

    // Badges & Subscriptions
    PermissionKeys.BADGES_READ,
    PermissionKeys.BADGES_MANAGE,
    PermissionKeys.SUBSCRIPTIONS_READ,
    PermissionKeys.SUBSCRIPTIONS_MANAGE,

    // Crypto
    PermissionKeys.CRYPTO_CURRENCIES_READ,
    PermissionKeys.CRYPTO_CURRENCIES_CREATE,
    PermissionKeys.CRYPTO_CURRENCIES_UPDATE,
    PermissionKeys.CRYPTO_CURRENCIES_DELETE,
    PermissionKeys.CRYPTO_WALLET_READ,
    PermissionKeys.CRYPTO_DEPOSITS_READ,
    PermissionKeys.CRYPTO_DEPOSITS_APPROVE,
    PermissionKeys.CRYPTO_DEPOSITS_REJECT,
    PermissionKeys.CRYPTO_WITHDRAWALS_READ,
    PermissionKeys.CRYPTO_WITHDRAWALS_APPROVE,
    PermissionKeys.CRYPTO_WITHDRAWALS_REJECT,
    PermissionKeys.CRYPTO_DEPOSITS_PROCESS,
    PermissionKeys.CRYPTO_WITHDRAWALS_PROCESS,
    PermissionKeys.CRYPTO_RATES_READ,
    PermissionKeys.CRYPTO_RATES_UPDATE,

    // Admin
    PermissionKeys.ADMIN_DASHBOARD,
    PermissionKeys.ADMIN_ANALYTICS,
    PermissionKeys.ADMIN_LOGS,

    // Roles
    PermissionKeys.ROLES_MANAGE,

    // Audit
    PermissionKeys.AUDIT_READ,
    PermissionKeys.AUDIT_EXPORT,

    // Ads
    PermissionKeys.ADS_READ,
    PermissionKeys.ADS_CREATE,
    PermissionKeys.ADS_UPDATE,
    PermissionKeys.ADS_MANAGE,

    // Daily Bonus
    PermissionKeys.DAILY_BONUS_READ,
    PermissionKeys.DAILY_BONUS_MANAGE,

    // Notifications
    PermissionKeys.NOTIFICATIONS_READ,
    PermissionKeys.NOTIFICATIONS_MANAGE,

    // Dashboard
    PermissionKeys.DASHBOARD_READ,

    // Profile & Security (own)
    PermissionKeys.PROFILE_READ,
    PermissionKeys.PROFILE_UPDATE,
    PermissionKeys.SECURITY_READ,
    PermissionKeys.SECURITY_UPDATE,
    PermissionKeys.SECURITY_CHANGE_PASSWORD,
    PermissionKeys.SECURITY_CHANGE_EMAIL,
    PermissionKeys.TWOFA_READ,
    PermissionKeys.TWOFA_MANAGE,
  ],

  USER: [
    // Content - Read only
    PermissionKeys.CONTENT_READ,

    // Videos - Watch
    PermissionKeys.VIDEOS_READ,

    // Games - Play
    PermissionKeys.GAMES_READ,

    // Surveys - Complete
    PermissionKeys.SURVEYS_READ,

    // Rewards - View own
    PermissionKeys.REWARDS_READ,

    // Wallet
    PermissionKeys.WALLET_READ,
    PermissionKeys.TRANSACTIONS_READ,

    // Withdrawals - Request
    PermissionKeys.WITHDRAWALS_READ,
    PermissionKeys.WITHDRAWALS_CREATE,

    // Referrals
    PermissionKeys.REFERRALS_READ,
    PermissionKeys.REFERRALS_CREATE,

    // Badges - View and purchase
    PermissionKeys.BADGES_READ,

    // Subscriptions - View and subscribe
    PermissionKeys.SUBSCRIPTIONS_READ,
    PermissionKeys.SUBSCRIPTIONS_CREATE,

    // Ads - Watch
    PermissionKeys.ADS_READ,
    PermissionKeys.ADS_WATCH,

    // Daily Bonus - Claim
    PermissionKeys.DAILY_BONUS_READ,
    PermissionKeys.DAILY_BONUS_CLAIM,

    // Notifications
    PermissionKeys.NOTIFICATIONS_READ,

    // Dashboard
    PermissionKeys.DASHBOARD_READ,

    // Crypto - View only
    PermissionKeys.CRYPTO_CURRENCIES_READ,
    PermissionKeys.CRYPTO_WALLET_READ,
    PermissionKeys.CRYPTO_DEPOSITS_READ,
    PermissionKeys.CRYPTO_WITHDRAWALS_READ,
    PermissionKeys.CRYPTO_RATES_READ,

    // Profile & Security - Full access for own account
    PermissionKeys.PROFILE_READ,
    PermissionKeys.PROFILE_UPDATE,
    PermissionKeys.PROFILE_DELETE,
    PermissionKeys.SECURITY_READ,
    PermissionKeys.SECURITY_UPDATE,
    PermissionKeys.SECURITY_CHANGE_PASSWORD,
    PermissionKeys.SECURITY_CHANGE_EMAIL,
    PermissionKeys.TWOFA_READ,
    PermissionKeys.TWOFA_MANAGE,
  ],
};
