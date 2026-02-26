# Admin panel on Vercel

The admin panel (login) works on your Vercel deployment. After deploy, open **https://your-site.vercel.app/admin.html** and log in.

**Note:** Content (index and typeface detail pages) is edited via the admin when running **locally** (`npm run dev`). After saving, run `npm run sync-admin` to update `typefaces-data.js` and `typeface-detail-data.js`, then commit and deploy. The Vercel deployment serves the static site; it does not run the admin API for editing content.

## Fix: "No login method configured"

If the live admin page shows this message, the **deployed** app has no login env vars.

**Option A – One command:**

```bash
npm run setup:vercel
```

Then in Vercel: **Deployments** → … → **Redeploy** (or push to main).

**Option B – Manual:** In [Vercel Dashboard](https://vercel.com/dashboard) → your project → **Settings** → **Environment Variables**, add **Production** (and Preview if you use it):

- `SESSION_SECRET` — copy from your local `.env`
- `ADMIN_PASSWORD_HASH` — from `node scripts/hash-password.js "YourPassword"`, or use Google login (see below)

Save, then **Redeploy**.

---

## One-command setup (recommended)

From the project folder (with Vercel CLI linked: `vercel link`):

```bash
npm run setup:vercel
```

This pushes your `.env` variables (SESSION_SECRET, ADMIN_PASSWORD_HASH, ALLOWED_ADMIN_EMAILS, GOOGLE_*, BASE_URL) to Vercel **production** and **preview**.

Then redeploy and open **https://your-domain.vercel.app/admin.html**.

---

## Manual setup: environment variables

In the project: **Settings** → **Environment Variables**. Add:

| Variable | Required | Notes |
|----------|----------|--------|
| `SESSION_SECRET` | Yes | Long random string (e.g. `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`) |
| `ADMIN_PASSWORD_HASH` | Or Google | From `node scripts/hash-password.js "YourPassword"` |
| `GOOGLE_CLIENT_ID` | Or password | From [Google Cloud Console](https://console.cloud.google.com/apis/credentials) |
| `GOOGLE_CLIENT_SECRET` | For Google | From Google Cloud Console |
| `ALLOWED_ADMIN_EMAILS` | For Google | Comma-separated, e.g. `you@gmail.com` |
| `BASE_URL` | For Google | Your Vercel URL with **https**, e.g. `https://your-project.vercel.app` |

Use either password login or Google login (or both). For Google, set `ALLOWED_ADMIN_EMAILS` so only you can access.

### Google login – redirect URI

In Google Cloud Console, add **Authorized redirect URI**:  
`https://your-domain.vercel.app/api/auth/google/callback`  
(and `http://localhost:3000/api/auth/google/callback` for local dev).

---

## Redeploy

After adding env vars, **redeploy** (push to main or **Deployments** → … → **Redeploy**).
