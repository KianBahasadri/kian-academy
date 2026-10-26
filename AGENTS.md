# Kian Academy

Read [README.md](README.md) for setup, product scope, and source locations.

- Keep the two entities distinct: resources are learning materials; practice is the user's own work. Do not generate fake practice or learning history.
- Follow the Grakata-derived design tokens and compact interface in `src/styles.css`. Keep copy, colors, and controls restrained.
- Preserve local data and resource/practice relationships. Validate backups before restoring, keep failures visible, and never silently reset a damaged library.
- Clerk authenticates account libraries. Verify server-side JWT signatures, issuer, and authorized origin; keep per-account data isolated. Device libraries are separate and only copied after explicit review.
- Account writes use revision checks and atomic chunk replacement. Preserve unsent changes on failure; never resolve conflicts by silently overwriting the saved version.
- Production at bahasadri.com uses Terraform-managed Workers, D1, Clerk DNS, and private R2 state. Follow `infra/cloudflare/README.md`; never use `wrangler deploy` or recreate account storage.
- Run `npm run build` after changes. Run `npm test` for changes to interactions, persistence, or data semantics; tests use system Chromium or `CHROMIUM_PATH`.
- Run `npm run test:accounts` and `npm run test:cloudflare` for server or persistence changes. Browser tests use port 5175 and generated test keys, separate from the user's running app.
- The development port is 5174. Grakata is a reference in `~/warframe-toolkit`; do not modify it as part of this project.
