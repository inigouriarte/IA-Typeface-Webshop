/**
 * Create an admin user for the admin panel.
 * Usage: node scripts/create-admin.mjs <email> <password>
 *
 * Requires BETTER_AUTH_SECRET (or SESSION_SECRET) in .env
 * For production: set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN
 */

import 'dotenv/config';
import { createClient } from '@libsql/client';

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error('Usage: node scripts/create-admin.mjs <email> <password>');
  process.exit(1);
}

if (password.length < 8) {
  console.error('Password must be at least 8 characters.');
  process.exit(1);
}

// Import auth and run migrations to ensure DB tables exist
const { auth } = await import('../lib/auth.mjs');
const { getMigrations } = await import('better-auth/db/migration');
const { runMigrations } = await getMigrations(auth.options);
await runMigrations();

// Sign up the user via Better Auth internal API
const ctx = await auth.api.signUpEmail({
  body: { email, password, name: 'Admin' },
});

if (!ctx || !ctx.user) {
  console.error('Failed to create user. The email may already be registered.');
  process.exit(1);
}

// Set role to admin directly in DB via libsql
const client = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:data/auth.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
});
await client.execute({
  sql: 'UPDATE user SET role = ? WHERE id = ?',
  args: ['admin', ctx.user.id],
});

console.log(`Admin user created: ${email} (id: ${ctx.user.id})`);
