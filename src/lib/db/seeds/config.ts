// src/lib/db/seeds/config.ts
export const SEED_CONFIG = {
  // Environment detection
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',

  // Number of items to seed
  counts: {
    videos: 10,
    games: 8,
    surveys: 5,
    users: 10,
    transactions: 5,
    rewards: 3,
    notifications: 15,
  },

  // Super admin credentials
  superAdmin: {
    email: process.env.SUPER_ADMIN_EMAIL || 'admin@boostly.buzz',
    password: process.env.SUPER_ADMIN_PASSWORD || 'BoostlyAdmin123!',
    name: 'Boostly System Administrator',
    phone: '+250788000000',
  },

  // Default user credentials
  defaultUser: {
    email: 'user@boostly.buzz',
    password: 'User123!',
    name: 'John Doe',
    phone: '+250788123456',
  },

  // Seed flags - control what gets seeded
  flags: {
    clearExisting: true,
    skipOnError: true,
    createDemoUsers: true,
    createDemoContent: true,
    createDemoTransactions: true,
  },
};
