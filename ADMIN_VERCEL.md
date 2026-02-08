# Admin panel on Vercel

The admin panel works on your Vercel deployment. After deploy, open **https://your-site.vercel.app/admin.html** and log in.

## One-command setup (recommended)

From the project folder (with Vercel CLI linked: `vercel link`):

```bash
npm run setup:vercel
```

This script will:
1. Create a Blob store named `admin-data` (if the CLI supports it).
2. Push your `.env` variables (SESSION_SECRET, ADMIN_PASSWORD_HASH, ALLOWED_ADMIN_EMAILS, etc.) to Vercel **production** and **preview**.

Then redeploy (e.g. `npm run deploy:prod` or push to main) and open **https://your-domain.vercel.app/admin.html**.

---

## Manual setup

### 1. Create a Blob store (one-time)

1. In [Vercel Dashboard](https://vercel.com/dashboard), open your project (**typeface-webshop** / IA-Typeface-Webshop).
2. Go to **Storage** → **Create Database** → **Blob** → **Continue**.
3. Name the store (e.g. `admin-data`) and create it.
4. The project gets a `BLOB_READ_WRITE_TOKEN` env var automatically.

## 2. Environment variables

In the project: **Settings** → **Environment Variables**. Add:

| Variable | Required | Notes |
|----------|----------|--------|
| `SESSION_SECRET` | Yes | Long random string (e.g. from `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`) |
| `ADMIN_PASSWORD_HASH` | Or Google | From `node scripts/hash-password.js "YourPassword"` |
| `GOOGLE_CLIENT_ID` | Or password | From [Google Cloud Console](https://console.cloud.google.com/apis/credentials) |
| `GOOGLE_CLIENT_SECRET` | For Google | From Google Cloud Console |
| `ALLOWED_ADMIN_EMAILS` | For Google | Comma-separated, e.g. `you@gmail.com` |
| `BASE_URL` | For Google | Your Vercel URL with **https**, e.g. `https://your-project.vercel.app` |

Use either password login or Google login (or both). For Google, set `ALLOWED_ADMIN_EMAILS` so only you can access.

## 3. Redeploy

After adding env vars and the Blob store, **redeploy** (e.g. push to main or **Deployments** → … → **Redeploy**).

## 4. Use the admin

- Open **https://your-domain.vercel.app/admin.html**.
- Log in with password or Google (depending on what you configured).
- Edit **Products** and **Typeface samples**; changes are stored in Vercel Blob and shown on the public site.

The public site loads products/samples from the API (Blob or static fallback), so edits in the admin appear on the live site.
