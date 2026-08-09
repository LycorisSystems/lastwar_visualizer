// Cloudflare Pages Function — GET /api/files/:name
//
// Streams one .xlsx file's raw bytes from the (private) repo's files/ folder, using the
// same server-side GITHUB_TOKEN as index.js in this folder — see that file for context.
//
// If you fork or rename this repo, update OWNER/REPO/BRANCH below to match.

const OWNER = "LycorisSystems";
const REPO = "lastwar_visualizer";
const BRANCH = "main";

export async function onRequestGet({ env, params }) {
  const token = env.GITHUB_TOKEN;
  if (!token) {
    return new Response("GITHUB_TOKEN is not configured on this Cloudflare Pages project", { status: 500 });
  }

  const name = params.name;
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
