# Rollback (if needed)

The repo was synced with a **merge commit** so nothing was deleted.

**To undo the sync and restore the previous GitHub state:**

```bash
# Revert the merge (creates a new commit that undoes it)
git revert -m 1 e98cf27
git push origin main
```

`-m 1` keeps the first parent (the old main); the revert removes the merged-in changes. All current data stays in history and can be restored later.
