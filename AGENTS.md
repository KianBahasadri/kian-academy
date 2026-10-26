# Kian Academy

Read [README.md](README.md) for setup and [data/README.md](data/README.md) for the published data contract.

- This is Kian's public, read-only learning portfolio. Published content comes from `data/library.json`; updates are committed and pushed to GitHub.
- Keep the two entities distinct: resources are learning material; practice is Kian's own work. Never invent learning progress or authored work.
- Do not add accounts, a backend, browser persistence, or visitor editing controls. UI filters and theme state are transient.
- Preserve the Grakata-derived visual style and compact controls in `src/styles.css`.
- Invalid learning data must fail the build. Do not silently replace or drop invalid entries or resource/practice relationships.
- Run `npm run build`; run `npm test` for changes to interactions or published data handling. Tests use system Chromium or `CHROMIUM_PATH` on port 5175.
- GitHub Pages deploys through `.github/workflows/deploy.yml` on pushes to `main`. Keep the build fully static and assets compatible with project URL prefixes.
- Batch related small changes into cohesive commits and push completed, validated batches without waiting for a separate request. Avoid a separate push and GitHub Actions deployment for every minor edit; include small instruction updates in the next batch. Publish through `main`, check the GitHub Actions deployment, and resolve failures before reporting the work deployed.
- Development uses port 5174. Grakata in `~/warframe-toolkit` is a reference; do not modify it for this project.
