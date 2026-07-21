// Temporary read-only verification — deleted after use
import { db } from './lib/db';
import { users, roles, permissions } from './lib/db/schema/users';
import { companySettings } from './lib/db/schema/company';
import { sql } from 'drizzle-orm';

async function main() {
  const counts: Record<string, number> = {};
  const tables: [string, any][] = [
    ['users', users],
    ['roles', roles],
    ['permissions', permissions],
    ['companySettings', companySettings],
  ];

  for (const [name, table] of tables) {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(table);
    counts[name] = Number(result[0]?.count ?? 0);
  }

  const admin = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.email, process.env.SUPER_ADMIN_EMAIL || ''),
  });

  console.log(JSON.stringify({ counts, adminExists: !!admin }, null, 2));
  process.exit(0);
}

main().catch((e) => {
  console.error('ERROR', e);
  process.exit(1);
});
