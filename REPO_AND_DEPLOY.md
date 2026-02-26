# Repo and deploy setup

## Current setup

| What | Where |
|------|--------|
| **GitHub repo** | [inigouriarte/IA-Typeface-Webshop](https://github.com/inigouriarte/IA-Typeface-Webshop) |
| **Local folder** | `c:\Users\inigo\typeface-webshop` (this folder) |
| **Default branch** | `main` |

This folder is the same repo as GitHub: `origin` points to `inigouriarte/IA-Typeface-Webshop`. You’re on the latest version after pull/push.

## Vercel

Deploys from this folder go to the project linked in `.vercel/` (project id is stored there). That project may appear in the Vercel dashboard as **typeface-webshop** or **IA-Typeface-Webshop** depending on how it was created.

- To see deployments: [Vercel Dashboard](https://vercel.com/dashboard) → open the project that’s linked to this repo.
- To link this folder to a different Vercel project (e.g. **IA-Typeface-Webshop**): run `vercel link` here and choose the project.

## Deploy latest to Vercel

```bash
npm run deploy        # preview
npm run deploy:prod   # production
```

## Keep local and GitHub in sync

```bash
git pull origin main   # get latest from GitHub
git push origin main   # send your commits to GitHub
```

## Test the admin panel online (Railway)

The admin panel needs a **Node server** (login, API, saving data). Vercel only serves the static site, so to test admin in the browser:

1. Go to [Railway](https://railway.app) and sign in (e.g. with GitHub).
2. **New Project** → **Deploy from GitHub repo** → select **inigouriarte/IA-Typeface-Webshop**.
3. Railway will build and run `npm start`. Add **Environment Variables** in the project:
   - `SESSION_SECRET` – random string (e.g. from `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`).
   - `ADMIN_PASSWORD_HASH` – from `node scripts/hash-password.js "YourPassword"`,  
     **or** set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` for Google login.
   - For **Google login**: set `ALLOWED_ADMIN_EMAILS=your@gmail.com` (comma-separated). Only these emails can access; no one can log in until this is set.
   - `BASE_URL` = your admin URL with **https** (e.g. `https://your-app.railway.app`). Required for Google OAuth redirect.
4. In the project, open **Settings** → **Networking** → **Generate Domain** to get a public URL.
5. Open **https://your-app.railway.app/admin.html** (use **https**, not http).

Edits to index and typeface detail content are stored on Railway’s disk; they can be reset on redeploy unless you add a persistent volume.

### Subdomain and ERR_SSL_PROTOCOL_ERROR

**ERR_SSL_PROTOCOL_ERROR** usually means the browser is using **https://** but the server is only speaking HTTP, or the subdomain is not set up for SSL.

- **Use the host HTTPS URL**  
  Use the URL your host gives you, e.g. **https://your-app.railway.app**. Railway provides HTTPS for `*.railway.app` automatically.

- **Custom subdomain (e.g. admin.yourdomain.com)**  
  1. In Railway: **Settings** → **Networking** → **Custom Domain** → add your subdomain.  
  2. In your DNS: add a **CNAME** for that subdomain pointing to the value Railway shows (e.g. `xxx.railway.app`).  
  3. Wait for DNS and for Railway to issue the certificate, then open **https://admin.yourdomain.com/admin.html**.  
  Do not use **http://** for the admin in production (cookies and OAuth expect HTTPS).

- **If you see the error on a custom URL**  
  Use **https://** and ensure the domain is added in the host dashboard and DNS is correct. If the host does not support your domain yet, use the default **https://xxx.railway.app** URL first.

## Not in Git (on purpose)

- `.env` – secrets (password hash, Google credentials). Use `.env.example` as a template.
- `node_modules/` – dependencies (reinstall with `npm install`).
