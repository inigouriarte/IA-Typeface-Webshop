/**
 * Create an admin user for the admin panel.
 * Usage: node scripts/create-admin.mjs <email> <password>
 *
 * Requires BETTER_AUTH_SECRET (or SESSION_SECRET) in .env
 */

import 'dotenv/config';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

// Import auth to ensure DB tables are created
const { auth } = await import('../lib/auth.mjs');

// Sign up the user via Better Auth internal API
const ctx = await auth.api.signUpEmail({
  body: { email, password, name: 'Admin' },
});

if (!ctx || !ctx.user) {
  console.error('Failed to create user. The email may already be registered.');
  process.exit(1);
}

// Set role to admin directly in DB
const dbPath = path.join(__dirname, '..', 'data', 'auth.db');
const db = new Database(dbPath);
db.prepare('UPDATE user SET role = ? WHERE id = ?').run('admin', ctx.user.id);
db.close();

console.log(`Admin user created: ${email} (id: ${ctx.user.id})`);
