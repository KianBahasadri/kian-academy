# Cloudflare and Clerk

Production is **https://bahasadri.com**. The stack matches Grakata's core: React / TypeScript / Vite, Clerk, a Cloudflare Worker, D1, a Durable Object account coordinator, and Terraform with private R2 state. Account saving shares the same implementation with the local SQLite API.

## Resources

- Worker: `kian-academy`, with bundled static assets.
- D1: `kian-academy-accounts`. Numbered migrations live in `cloudflare/migrations/`.
- Clerk: the separate Kian Academy application; public instance IDs and CNAME targets are in `clerk.json`.
- State: private R2 bucket `kian-academy-terraform`, key `production/terraform.tfstate`, with locking enabled. Public bucket access is disabled.
- Routing: `bahasadri.com/*`. The existing proxied apex DNS record is retained. Other subdomains and their applications are outside this configuration.

`production.json` records the production state lineage and database/Worker/route identities after deployment. Deployment refuses missing or changed identities instead of recreating account storage. State and plans are private and ignored by Git.

## Configuration

Use `.env` or process environment for `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_ZONE_ID`, and `ACADEMY_HOSTNAME`. The Cloudflare token needs Workers Scripts, D1, and R2 edit access, plus zone read, DNS edit, and Workers Routes edit for this domain. R2 S3 credentials derive from that token, or use paired `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` overrides. Credentials are passed through the environment.

Production builds use `.env.production.local`. Pull production Clerk keys with `npx clerk env pull --instance prod --file .env.production.local`, then add `CLERK_ISSUER=https://clerk.bahasadri.com` and the matching PEM `CLERK_JWT_KEY`. Keep the file private (`chmod 600`). The Worker uses only the public key; it never receives the Clerk secret key. Development keys belong in `.env.local`.

Clerk's five DNS CNAME records are managed by Terraform and remain unproxied. Email and password sign-in are enabled. Google sign-in is disabled until custom production OAuth credentials are configured. Use `npx clerk deploy status --mode agent` to inspect DNS, certificates, and instance readiness.

## Deploy

Requires Node.js 22.18+, npm, Terraform 1.10+, and system Chromium (or `CHROMIUM_PATH`) for tests. The Cloudflare provider is pinned and its lock file is committed.

```sh
npm ci
npm run test:accounts
npm run test:cloudflare
npm test
npm run build:cloudflare
npm run infra -- validate
npm run deploy
npm run infra -- plan -detailed-exitcode
```

The deploy script verifies production Clerk DNS, the JWT public key, and the built frontend key; backs up current state privately in `.data/terraform-backups/`; checks state identities; reviews the plan for deletion/replacement; applies that exact plan; then checks the live release, frontend, and guest account endpoint. A final plan returning 0 confirms no drift. Keep the build unchanged between plan and apply.

The initial private state bucket was provisioned by `infra/bootstrap/` and adopted into the main remote state. Bootstrap state is not used for regular deployments. First-time account coordinator creation uses migration tag `v1`; later uploads retain that tag without replaying namespace creation.

## Recovery

Append SQL migrations; do not edit applied ones. D1 records have validated JSON, a digest, a revision, and bounded chunks so large essays remain below D1's row limit. Failed or malformed writes preserve the existing library. The 10 MB request limit applies to account saves.

If state is missing, stop deployment and restore a verified private backup or import existing resources. Never substitute an empty or stale state. Preserve database and account coordinator identities. Unlock state only after confirming its owning process has stopped. To roll back app code, build a known-good revision and review the new plan while retaining D1 and schema compatibility.

The included GitHub Actions workflow can deploy a public repository with the same checks. It is gated to public repositories. Configure the `CLOUDFLARE_API_TOKEN` repository secret and the public `VITE_CLERK_PUBLISHABLE_KEY` and `CLERK_JWT_KEY` repository variables before enabling it.
