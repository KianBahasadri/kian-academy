# Kian Academy

My learning resources and the work I create from them, published as a static portfolio. The interface follows Grakata's compact tables, IBM Plex typography, and muted dark and light palettes.

**Site:** https://bahasadri.com · **Repository:** https://github.com/KianBahasadri/kian-academy

## Publish learning updates

Edit [data/library.json](data/library.json), commit the change, and push to `main`:

```sh
git add data/library.json
git commit -m "Update my learning progress"
git push
```

GitHub Actions validates the data, builds and tests the site, and deploys `dist/` to GitHub Pages. Refresh the live page after the deployment completes to see the update. No deployment secrets are required.

- **Resources** are books, textbooks, courses, playlists, articles, and other material. Update `status`, `progress`, and `notes` as you learn.
- **Practice** is your own work: essays, videos, projects, and notes. Put writing in `content` or link published work in `url`. Set `resourceId` to a resource's `id`, or `null` for independent work.

See [the data guide](data/README.md) for complete examples. The initial eight resource links are marked **To learn**, with no claimed progress; replace them with your own learning history. Practice starts empty.

Visitors browse published content. Learning data comes exclusively from the committed JSON file. The site has no accounts, backend, browser storage, cookies, or editing controls. Every entry in that file is public. Searches, filters, and theme changes last only for the current page session.

## Develop

Requires Node.js 22.18+ and npm.

```sh
npm ci
npm run dev           # http://127.0.0.1:5174
npm run validate:data # Check published content before committing
npm run build         # Validate, type-check, and build dist/
npm run preview       # Preview the static build
npm test              # Read-only portfolio and publication tests
```

Tests use system Chromium at `/usr/bin/chromium`, or `CHROMIUM_PATH`. They run on port 5175, separately from the app. Fonts and icons are bundled locally. Relative asset paths and hash navigation support both GitHub project URLs and the custom domain.

## Source

- `data/library.json`: published resources, progress, notes, and practice.
- `src/model.ts`: the data contract and validation.
- `src/library.ts`: reads the committed data for the build.
- `src/App.tsx`, `src/components/`: read-only collections and detail panels.
- `src/styles.css`: design tokens, both themes, and phone layouts.
- `scripts/validate-data.mjs`: rejects invalid content before publication.
- `.github/workflows/deploy.yml`: deployment on pushes to `main`.
