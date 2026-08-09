Put .xlsx SVS log files directly in this folder (no subfolders).

Once committed and pushed to the GitHub repo, they automatically show up as clickable
buttons on the tool's upload screen. This works even with the GitHub repo set to
private — a Cloudflare Pages Function (functions/api/files/) reads this folder
server-side using a GitHub token, so the deployed site can list/serve these files
without the repo (or the token) ever being publicly browsable on GitHub.

Note: this only works once a file is actually pushed to the repo, not just saved
locally, and only after the one-time Cloudflare setup described in the main
README.md ("Choose from prepared Excel files").

See the main README.md for full details and setup steps.
