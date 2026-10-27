# Kian Academy

My learning resources and the work I create from them, published as a static portfolio. The interface follows Grakata's compact tables, IBM Plex typography, and muted dark and light palettes.

**Site:** https://kianbahasadri.github.io/kian-academy/ · **Repository:** https://github.com/KianBahasadri/kian-academy

## Publish learning updates

Edit [data/library.json](data/library.json), commit the change, and push to `main`:

```sh
git add data/library.json
git commit -m "Update my learning progress"
git push
```

GitHub Actions validates the data, builds and tests the site, and deploys `dist/` to GitHub Pages. Refresh the live page after the deployment completes to see the update. No deployment secrets are required.

- **Resources** are books, textbooks, courses, playlists, articles, and other material. Each has a list of `subjects` and a tier from 1 to 5, describing its intended audience and assumed knowledge. Update `status`, `progress`, and `notes` as you learn.
- **Practice** is your own work: essays, videos, projects, and notes. Put writing in `content` or link published work in `url`. Set `resourceId` to a resource's `id`, or `null` for independent work.

See [the data guide](data/README.md) for complete examples. The seven resources were restored from `js/curriculum.js` in commit `7642e74`, preserving their IDs, titles, authors, links, and tiers. Book panels show edition-specific publication records with ISBNs and source links. The historical catalog contained no saved learning progress or authored practice, so progress is zero and practice is empty. Resources ready to start are marked **To learn**; those set aside for foundational study are marked **Prerequisites needed**. Creation timestamps record when resources were restored into the published library; update timestamps record subsequent edits.

Visitors browse published content. Learning data comes exclusively from the committed JSON file. The site has no accounts, backend, browser storage, cookies, or editing controls. Every entry in that file is public. Searches, filters, themes, column layouts, widths, and sort priorities last only for the current page session. Resource and practice views keep separate settings.

Both collections share Grakata-style column controls: show/hide fields, drag headers or use Move left/right, resize columns, sort by multiple columns with adjustable priorities, and apply text, numeric, or include/exclude filters. Right-click or touch and hold a heading, or focus it and press Shift+F10, to open its column options. Hidden-column filters remain visible as removable chips. CSV exports matching rows and the visible columns in their current order. Select a title to open details; arrow keys move between rows. The Columns menu resets the layout, and Reset filters clears searches and filters.

Help below View source explains the current collection and its table controls. Every dropdown uses a styled, searchable list: type to narrow the choices, use arrow keys and Enter to select, or Escape to restore the current selection. Filters accept only listed values.

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

Tests use system Chromium at `/usr/bin/chromium`, or `CHROMIUM_PATH`. They run on port 5175, separately from the app. Fonts and icons are bundled locally. Relative asset paths and hash navigation support the GitHub Pages project URL prefix.

## Source

- `data/library.json`: published resources, progress, notes, and practice.
- `src/model.ts`: the data contract and validation.
- `src/library.ts`: reads the committed data for the build.
- `src/App.tsx`, `src/components/`: read-only collections and detail panels.
- `src/table.ts`, `src/collections.tsx`, `src/components/CollectionTable.tsx`: shared column behavior, portfolio field definitions, and table rendering. Column menus, popovers, and animated dragging follow the current [Grakata collection table](https://github.com/KianBahasadri/warframe-toolkit/blob/5f35efbfb9e93950930fa484b1060c8ebd954d7d/src/components/CollectionTable.tsx), adapted to this read-only portfolio without browser persistence.
- `src/styles.css`: design tokens, both themes, and phone layouts.
- `scripts/validate-data.mjs`: rejects invalid content before publication.
- `.github/workflows/deploy.yml`: deployment on pushes to `main`.
