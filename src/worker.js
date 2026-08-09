// Cloudflare Worker (full-stack: static assets + a couple of API routes).
//
// This single script fields every request to the site. For the two /api/files* routes
// below, it does real work (reads this repo's files/ folder from GitHub, server-side).
// For everything else — index.html, app.js, styles.css, vendor/, etc. — it just hands
// the request to the ASSETS binding, which serves the public/ folder as a plain static
// site. See wrangler.jsonc for how `main` and `assets` are wired together.
//
// Why the GitHub calls happen here at all: this repo (and its files/ folder) is private,
// so listing/reading it needs a token — GITHUB_TOKEN, set as a Cloudflare secret (see
// README.md, "Choose from prepared Excel files"). Doing that server-side, inside this
// Worker, is what lets the token stay off the client entirely; the browser only ever
// talks to this site's own /api/files* URLs.
//
// If you fork or rename this repo, update OWNER/REPO/BRANCH below to match.

const OWNER = "LycorisSystems";
const REPO = "lastwar_visualizer";
const BRANCH = "main";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/api/files") {
      return listFiles(env);
    }

    const fileMatch = url.pathname.match(/^\/api\/files\/([^/]+)$/);
    if (request.method === "GET" && fileMatch) {
      return getFile(env, decodeURIComponent(fileMatch[1]));
    }

    return env.ASSETS.fetch(request);
  },
};

async function listFiles(env) {
  const token = env.GITHUB_TOKEN;
  if (!token) {
    return json({ error: "GITHUB_TOKEN is not configured on this Worker" }, 500);
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

async function getFile(env, name) {
  const token = env.GITHUB_TOKEN;
  if (!token) {
    return new Response("GITHUB_TOKEN is not configured on this Worker", { status: 500 });
  }

  // Only a plain "something.xlsx" filename (no slashes) is ever legitimate here — this
  // both rejects path-traversal attempts and keeps the GitHub request scoped to files/.
  if (typeof name !== "string" || !/^[^/\\]+\.xlsx$/i.test(name)) {
    return new Response("Not found", { status: 404 });
  }

  let ghRes;
  try {
    ghRes = await fetch(
      `https://api.github.com/repos/${OWNER}/${REPO}/contents/files/${encodeURIComponent(name)}?ref=${BRANCH}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "User-Agent": "lastwar-visualizer",
          // Files here run 1–2+ MB, over the Contents API's 1 MB plain-JSON limit — the
          // raw media type is required to get the actual bytes back instead of an error.
          Accept: "application/vnd.github.raw+json",
        },
      }
    );
  } catch (err) {
    return new Response(`Could not reach GitHub: ${err}`, { status: 502 });
  }

  if (!ghRes.ok) {
    return new Response(`GitHub API returned ${ghRes.status}`, { status: ghRes.status });
  }

  return new Response(ghRes.body, {
    headers: {
      "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "cache-control": "no-store",
      "content-disposition": `attachment; filename="${name.replace(/"/g, "")}"`,
    },
  });
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}
