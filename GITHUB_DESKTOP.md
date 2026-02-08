# Using this project with GitHub Desktop

This project is already a Git repo at:

**`c:\Users\inigo\typeface-webshop`**

You also have a folder **`c:\Users\inigo\IA-Typeface-Webshop`** which may be another clone. Here are two ways to align everything with GitHub Desktop.

---

## Option A: Use this folder in GitHub Desktop (recommended)

1. Open **GitHub Desktop**.
2. **File → Add local repository…**
3. Click **Choose…** and go to:  
   **`c:\Users\inigo\typeface-webshop`**
4. If it says “This directory does not appear to be a Git repository”, choose **create a repository** or pick the folder that already has a repo.  
   If it finds a repo, click **Add repository**. This folder will then show in GitHub Desktop.

After that, use GitHub Desktop to push/pull as usual. This folder stays where it is.

---

## Option B: Move this project into another folder (e.g. IA-Typeface-Webshop)

If you want the “main” copy to live somewhere else (e.g. **`c:\Users\inigo\IA-Typeface-Webshop`** or **Documents\GitHub\typeface-webshop**):

1. **Back up** the folder you’re moving (e.g. copy `typeface-webshop` somewhere safe).
2. If the target folder (e.g. `IA-Typeface-Webshop`) already has a Git repo:
   - Copy **all contents** of `c:\Users\inigo\typeface-webshop` into that folder (overwrite when asked), **except** the **`.git`** folder—do not overwrite `.git` so you keep the existing remote and history.
   - Or: copy everything except `.git`, then in the target folder run `git status` and commit the changes.
3. Open that target folder in GitHub Desktop (**File → Add local repository…** if it’s not already listed).

---

## Open this folder in Cursor after moving

If you move the project to a different path (e.g. `IA-Typeface-Webshop`):

- In Cursor: **File → Open folder…** and choose the new folder,  
  **or**
- Keep using **`c:\Users\inigo\typeface-webshop`** in Cursor and use GitHub Desktop only for the clone in the other location (then sync by copying or pushing from one repo and pulling in the other).

---

## Quick check

- **Repo location:** `c:\Users\inigo\typeface-webshop` (has `.git`).
- **Add it in GitHub Desktop:** File → Add local repository → select that path.
