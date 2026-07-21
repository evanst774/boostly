// src/lib/db/index.ts
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

const client = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DB_AUTH_TOKEN,
});

// Enable FK enforcement - must be set per connection in SQLite
client.execute('PRAGMA foreign_keys = ON');

// Pass the schema to drizzle for type safety
export const db = drizzle(client, { schema });
export { client };

// Export the Transaction type from drizzle
export type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
