// Cloudflare Pages Function — GET /api/files
//
// Lists the .xlsx files currently in this repo's files/ folder. Runs server-side inside
// Cloudflare, using a GitHub token kept in an environment variable (GITHUB_TOKEN) that
// client-side JS never sees — that's the whole point: it lets the GitHub repo be
// *private* while the deployed site still lists/serves those files to anyone who has the
// site's URL. See README.md ("Choose from prepared Excel files") for the one-time setup
// (creating the token, adding it in the Cloudflare Pages dashboard).
//
// If you fork or rename this repo, update OWNER/REPO/BRANCH below to match.

const OWNER = "LycorisSystems";
const REPO = "lastwar_visualizer";
const BRANCH = "main";

export async function onRequestGet({ env }) {
  const token = env.GITHUB_TOKEN;
  if (!token) {
    return json({ error: "GITHUB_TOKEN is not configured on this Cloudflare Pages project" }, 500);
  }

  let ghRes;
  try {
    ghRes = await fetch(
      `https://api.github.com/repos/${OWNER}/${REPO}/contents/files?ref=${BRANCH}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "User-Agent": "lastwar-visualizer",
          Accept: "application/vnd.github+json",
        },
      }
    );
  } catch (err) {
    return json({ error: `Could not reach GitHub: ${err}` }, 502);
  }

  if (!ghRes.ok) {
    return json({ error: `GitHub API returned ${ghRes.status}` }, ghRes.status);
  }

  const entries = await ghRes.json();
  const files = (Array.isArray(entries) ? entries : [])
    .filter((e) => e.type === "file" && /\.xlsx$/i.test(e.name))
    .map((e) => ({ name: e.name, size: e.size }));

  return json(files);
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}
