/**
 * Generate a bcrypt hash for your admin password.
 * Run: node scripts/hash-password.js "YourSecurePassword"
 * Then put the output in .env as ADMIN_PASSWORD_HASH=...
 */

const bcrypt = require('bcryptjs');
const password = process.argv[2];
if (!password) {
  console.error('Usage: node scripts/hash-password.js "YourPassword"');
  process.exit(1);
}
const hash = bcrypt.hashSync(password, 10);
console.log('Add this to your .env file:\n');
console.log('ADMIN_PASSWORD_HASH=' + hash);
console.log('\nAlso set SESSION_SECRET to a long random string (e.g. run: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))")');
