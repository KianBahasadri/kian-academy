# Kian Academy

A small learning library and practice workspace, built with React, TypeScript, and Vite. The interface follows the local Grakata project: IBM Plex typography, quiet dark and light palettes, compact tables, and details on demand.

## Run

Requires Node.js 22.18+ and npm.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:5174. The port is separate from Grakata's development server.

```sh
npm run build   # Type-check and build dist/
npm run preview
npm test        # Browser and account-saving interactions
npm run test:accounts    # Local SQLite account API
npm run test:cloudflare  # Worker / D1 account API
```

Tests use system Chromium at `/usr/bin/chromium`. Set `CHROMIUM_PATH` to use another Chromium executable. All fonts and icons are bundled locally. A built `dist/` can be served by a static host; navigation uses hash routes.

## Two entities

- **Resources:** playlists, courses, books, textbooks, articles, and other learning materials. Each has a subject, optional creator and URL, notes, status, and progress. Eight editable starter links are included with no claimed progress.
- **Practice:** work the user creates, including essays, videos, projects, and notes. Write in the editor or link to an existing artifact. Practice can be a draft or finished, and can optionally reference one resource. It starts empty. Removing a resource preserves its practice as independent work; removal can be undone.

Clerk manages sign-in. Signed-in libraries save to your account and work across devices; guests keep a separate library in the current browser. Account data uses SQLite locally and Cloudflare D1 in production, with a Worker and a Durable Object handling authenticated requests. Video and other externally hosted artifacts use links.

Use **This device** or your account name to download a JSON backup or review and restore one. The device library is preserved when you sign in; **Use device library** explicitly copies it into your account after review. Storage failures stay visible, damaged saves are not silently reset, and imports are validated before replacement. Concurrent edits are rejected rather than overwriting work saved on another device. Search works with `/` or `Ctrl/⌘ K`; `N` opens the add form and `Esc` closes a dialog.

## Clerk setup

The Academy has its own Clerk application, separate from Grakata. Development and production accounts and libraries are separate too. Copy `.env.example` for manual setup, or pull the linked development keys:

```sh
npx clerk link --app app_3LFHCMqMVC7JyhfQ6licFp81xxp
npx clerk env pull --instance dev --file .env.local
chmod 600 .env.local
```

The browser uses only `VITE_CLERK_PUBLISHABLE_KEY`. Local API verification uses `CLERK_JWT_KEY` or `CLERK_SECRET_KEY`; production uses the public JWT key and checks both issuer and authorized origin. Secrets and databases are ignored by Git. Without Clerk keys, local device libraries still work.

Production hosting at **https://bahasadri.com** uses Cloudflare Workers, D1, a private R2 Terraform state bucket, and Terraform-managed Clerk DNS. See [deployment and recovery](infra/cloudflare/README.md).

## Source

- `src/model.ts`: the two entities, progress rules, safe links, and backup validation.
- `src/seed.ts`: editable starter resource links.
- `src/useLibrary.ts`: browser storage, backup download, and cross-tab updates.
- `src/useAccountLibrary.ts`: account loading, queued saves, revision conflicts, and session isolation.
- `src/auth.tsx`: Clerk provider, sign-in, sign-up, account management, and sign-out.
- `src/App.tsx`: navigation, collections, filtering, and editing actions.
- `src/components/`: forms, details, dialogs, and library settings.
- `src/styles.css`: shared tokens, both themes, and responsive layouts.
- `tests/library.spec.ts`: resource and practice editing, persistence, relationships, backup restore, filtering, keyboard focus, and phone layout.
- `server/`: shared verified account API and local SQLite adapter.
- `cloudflare/`: Worker, account coordinator, and numbered SQL migrations.
- `infra/cloudflare/`: production Terraform configuration and public deployment identities.
