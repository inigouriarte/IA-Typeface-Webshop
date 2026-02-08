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

## Not in Git (on purpose)

- `.env` – secrets (password hash, Google credentials). Use `.env.example` as a template.
- `node_modules/` – dependencies (reinstall with `npm install`).
