/**
 * One-time setup: push .env to Vercel for admin auth.
 * Run: node scripts/setup-vercel-admin.js
 * Requires: vercel CLI linked and logged in (vercel link).
 *
 * Pushes SESSION_SECRET, ADMIN_PASSWORD_HASH, ALLOWED_ADMIN_EMAILS (and optional GOOGLE_*, BASE_URL) to Vercel production + preview.
 */

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ENV_PATH = path.join(ROOT, '.env');
const ENV_KEYS = [
  'SESSION_SECRET',
  'ADMIN_PASSWORD_HASH',
  'ALLOWED_ADMIN_EMAILS',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'BASE_URL',
];

function parseEnv(content) {
  const out = {};
  for (const line of content.split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
  }
  return out;
}

const VERCEL_CMD = 'npx';
const VERCEL_ARGS = ['vercel'];

function run(cmd, opts = {}) {
  const r = spawnSync(cmd, [], {
    cwd: ROOT,
    stdio: opts.stdin !== undefined ? ['pipe', 'inherit', 'inherit'] : 'inherit',
    shell: true,
    ...opts,
  });
  if (r.status !== 0 && !opts.allowFail) process.exit(r.status || 1);
  return r;
}

function vercelEnvAdd(key, value, envName) {
  const r = spawnSync(VERCEL_CMD, [...VERCEL_ARGS, 'env', 'add', key, envName, '--force', '--yes'], {
    cwd: ROOT,
    input: value,
    stdio: ['pipe', 'inherit', 'inherit'],
  });
  return r.status === 0;
}

function main() {
  if (!fs.existsSync(ENV_PATH)) {
    console.error('No .env file. Copy .env.example to .env and fill SESSION_SECRET, ADMIN_PASSWORD_HASH or Google + ALLOWED_ADMIN_EMAILS.');
    process.exit(1);
  }

  const env = parseEnv(fs.readFileSync(ENV_PATH, 'utf8'));

  console.log('Pushing env vars to Vercel (production + preview)...');
  for (const key of ENV_KEYS) {
    const value = env[key];
    if (!value) continue;
    for (const envName of ['production', 'preview']) {
      vercelEnvAdd(key, value, envName);
    }
    console.log('   Set', key);
  }

  console.log('\nDone. Redeploy (e.g. push to main or run `vercel --prod`) so the new env vars are used.');
}

main();
