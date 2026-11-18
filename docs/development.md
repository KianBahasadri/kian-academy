# Development

Use Node.js 22.18 or later and npm. Run the commands from the repository root. [Package scripts](../package.json)

```sh
npm ci
npm run dev
```

Open [the local Vite server](http://127.0.0.1:5174/). The browser updates as source, style, and catalog files change. Vite binds to loopback, defaults to port 5174, and exits if the configured port is occupied. `ACADEMY_PORT` changes the dev port. [Vite configuration](../vite.config.ts)

| Command | Purpose |
| --- | --- |
| `npm ci` | Install dependencies from the committed lockfile. |
| `npm run dev` | Start the live-reloading dev server. |
| `npm run validate:data` | Check the [published data contract](learning-data.md) without building the site. Use `npm run validate:data -- path/to/library.json` to check another file. |
| `npm run build` | Validate the library, check TypeScript, and write the static build to `dist/`. |
| `npm run preview` | Serve the existing static build locally. |
| `npm test` | Run the Playwright suite. |

## Tests

Playwright starts a Vite server on port 5175 for the suite. Use `ACADEMY_TEST_PORT` to override that port and `CHROMIUM_PATH` to select a Chromium executable. The default executable is `/usr/bin/chromium`. Failed browser tests save screenshots in `test-results/`. [Playwright configuration](../playwright.config.ts)

- The library suite checks the committed catalog, data validation, and the public browsing experience. [Library tests](../tests/library.spec.ts)
- The table suite checks the shared table behavior by using representative resources and practice. [Table tests](../tests/table.spec.ts)

Browser fixtures replace the library module response in the test page. Validation tests write invalid examples to temporary files and invoke the command-line validator there. This lets tests exercise data changes and validation failures while the committed catalog remains available for the published-data check.
