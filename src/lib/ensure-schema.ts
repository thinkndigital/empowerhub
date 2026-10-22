import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { sql, eq } from 'drizzle-orm';
import { db } from './db';
import { users } from './schema';
import { hashPassword } from './auth-server';

// Runs once per server process (cached promise, retried on failure so a
// transient DB outage at boot doesn't permanently disable this): creates
// every table from schema.sql if the database is empty, and seeds a real
// admin row from ADMIN_EMAIL/ADMIN_PASSWORD if one doesn't exist yet. This
// means a correctly-configured DB_* connection is the only manual step left
// on a fresh cPanel deploy — no phpMyAdmin import, no env-var login bypass.
let ensurePromise: Promise<void> | null = null;

async function doEnsure() {
  const [tables] = await db.execute(sql`SHOW TABLES LIKE 'users'`);
  const hasUsersTable = Array.isArray(tables) && tables.length > 0;

  if (!hasUsersTable) {
    const schemaPath = path.join(process.cwd(), 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`schema.sql not found at ${schemaPath} — cannot auto-create tables`);
    }
    const content = fs.readFileSync(schemaPath, 'utf-8');
    const statements = content
      .split(/;\s*\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    for (const statement of statements) {
      await db.execute(sql.raw(statement));
    }
    console.log(`[ensureSchema] Created ${statements.length} tables from schema.sql`);
  }

  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    const [existingAdmin] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, process.env.ADMIN_EMAIL))
      .limit(1);

    if (!existingAdmin) {
      const passwordHash = await hashPassword(process.env.ADMIN_PASSWORD);
      await db.insert(users).values({
        id: randomUUID(),
        name: 'Admin',
        email: process.env.ADMIN_EMAIL,
        passwordHash,
        role: 'admin',
        status: 'active',
      });
      console.log(`[ensureSchema] Seeded initial admin user: ${process.env.ADMIN_EMAIL}`);
    }
  }
}

export function ensureSchemaAndAdmin(): Promise<void> {
  if (!ensurePromise) {
    ensurePromise = doEnsure().catch((e) => {
      ensurePromise = null; // allow the next request to retry
      throw e;
    });
  }
  return ensurePromise;
}
