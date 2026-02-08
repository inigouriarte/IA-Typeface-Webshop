# Folder consolidation – use this folder only

## Summary

| Folder | GitHub | Vercel | Latest code |
|--------|--------|--------|-------------|
| **`c:\Users\inigo\typeface-webshop`** (this folder) | ✅ inigouriarte/IA-Typeface-Webshop | ✅ linked (project: typeface-webshop) | ✅ Yes – admin, server, all changes |
| **`c:\Users\inigo\IA-Typeface-Webshop`** | Same repo (old clone) | ❌ No .vercel | ❌ No – missing admin, server, etc. |

**Use only:** `c:\Users\inigo\typeface-webshop`

## In GitHub Desktop

1. If **IA-Typeface-Webshop** is listed: **Repository** → **Remove** (removes it from the app only, not from disk).
2. **File** → **Add local repository…** → **Choose…** → go to **`c:\Users\inigo\typeface-webshop`**.
3. You should see the latest commits and **main** in sync with **origin/main**.

Deploys (Vercel, Railway) should be run from **typeface-webshop**; that folder is the one linked to Vercel.

## After consolidating

You can delete the old folder **`c:\Users\inigo\IA-Typeface-Webshop`** from your PC so you don’t use it by mistake. Close any app that has that folder open (e.g. GitHub Desktop, another Cursor window), then delete the folder.
