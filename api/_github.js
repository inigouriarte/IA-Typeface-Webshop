/**
 * Utility to commit multiple files to GitHub via the Git Trees/Commits API.
 * Requires GITHUB_TOKEN and GITHUB_REPO env vars.
 */

const GITHUB_API = 'https://api.github.com';

function headers() {
  return {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

function repo() {
  return process.env.GITHUB_REPO; // e.g. "inigouriarte/IA-Typeface-Webshop"
}

async function api(path, opts = {}) {
  const url = `${GITHUB_API}/repos/${repo()}${path}`;
  const res = await fetch(url, { headers: headers(), ...opts });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API ${res.status}: ${text}`);
  }
  return res.json();
}

/**
 * Get the SHA of the latest commit on a branch.
 */
async function getBranchSHA(branch = 'main') {
  const ref = await api(`/git/ref/heads/${branch}`);
  return ref.object.sha;
}

/**
 * Commit multiple files in a single commit.
 * @param {Array<{path: string, content: string|Buffer, encoding?: string}>} files
 *   - path: repo-relative path (e.g. "fonts/MyFont/file.woff2")
 *   - content: string (utf-8) or base64-encoded string
 *   - encoding: "utf-8" (default) or "base64"
 * @param {string} message - commit message
 * @param {string} branch - target branch (default "main")
 */
async function commitFiles(files, message, branch = 'main') {
  if (!process.env.GITHUB_TOKEN || !process.env.GITHUB_REPO) {
    throw new Error('GITHUB_TOKEN and GITHUB_REPO env vars are required');
  }

  // 1. Get the current commit SHA and tree SHA
  const commitSHA = await getBranchSHA(branch);
  const commit = await api(`/git/commits/${commitSHA}`);
  const baseTreeSHA = commit.tree.sha;

  // 2. Create blobs for each file
  const tree = [];
  for (const file of files) {
    const blob = await api('/git/blobs', {
      method: 'POST',
      body: JSON.stringify({
        content: file.content,
        encoding: file.encoding || 'utf-8',
      }),
    });
    tree.push({
      path: file.path,
      mode: '100644',
      type: 'blob',
      sha: blob.sha,
    });
  }

  // 3. Create a new tree
  const newTree = await api('/git/trees', {
    method: 'POST',
    body: JSON.stringify({ base_tree: baseTreeSHA, tree }),
  });

  // 4. Create a new commit
  const newCommit = await api('/git/commits', {
    method: 'POST',
    body: JSON.stringify({
      message,
      tree: newTree.sha,
      parents: [commitSHA],
    }),
  });

  // 5. Update the branch ref (force to handle concurrent pushes/deploys)
  try {
    await api(`/git/refs/heads/${branch}`, {
      method: 'PATCH',
      body: JSON.stringify({ sha: newCommit.sha, force: true }),
    });
  } catch (e) {
    // If ref update fails, it may be branch protection rules
    throw new Error(
      `Failed to update branch "${branch}": ${e.message}. ` +
      'If the branch has protection rules, disable "Require a pull request before merging" for API commits.'
    );
  }

  return { sha: newCommit.sha, url: newCommit.html_url };
}

/**
 * Read a file from the repo.
 * Returns { content, sha } where content is decoded UTF-8.
 */
async function readFile(path, branch = 'main') {
  const data = await api(`/contents/${path}?ref=${branch}`);
  const content = Buffer.from(data.content, 'base64').toString('utf-8');
  return { content, sha: data.sha };
}

module.exports = { commitFiles, readFile, getBranchSHA };
