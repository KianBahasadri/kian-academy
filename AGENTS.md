# Kian Academy

Read [README.md](README.md) for setup and [data/README.md](data/README.md) for the published data contract.

- This is Kian's public, read-only learning portfolio. Published content comes from `data/library.json`; updates are committed and pushed to GitHub.
- Keep the two entities distinct: resources are learning material; practice is Kian's own work. Never invent learning progress or authored work.
- Determine routine resource classifications from the catalog, published prerequisites, and available context; do not ask Kian to classify each resource. Keep prerequisite readiness separate from learning progress and resource tier.
- Use sourced, edition-specific bibliographic facts in resource panels. Do not add generated descriptions, audience commentary, study prompts, or invented notes to published resources.
- Show resource tiers as compact metadata tags, without explanatory panel sections.
- Do not add accounts, a backend, browser persistence, or visitor editing controls. UI filters and theme state are transient.
- Preserve the Grakata-derived visual style and compact controls in `src/styles.css`.
- Invalid learning data must fail the build. Do not silently replace or drop invalid entries or resource/practice relationships.
- When validating a batch before pushing, run `npm run build`; run `npm test` for changes to interactions or published data handling. Tests use system Chromium or `CHROMIUM_PATH` on port 5175. Do not run routine builds and tests after every small edit.
- GitHub Pages deploys through `.github/workflows/deploy.yml` on pushes to `main`. Keep the build fully static and assets compatible with project URL prefixes.
- Keep individual tasks quick and focused; make requested edits and commit promptly. Save broader reviews and other expensive checks for batches. Accumulate roughly five small commits before running routine validation, pushing, and checking deployment, unless Kian explicitly asks sooner. Batch testing and pushes across tasks; do not run a build, test suite, push, and deployment for every minor change. Include workflow instruction updates with the current edit. Publish through `main`, check the GitHub Actions deployment, and resolve failures before reporting the batch deployed.
- Development uses port 5174. Grakata in `~/warframe-toolkit` is a reference; do not modify it for this project.
