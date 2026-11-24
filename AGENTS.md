# AGENTS.md

Kian Academy is Kian's public, read-only learning portfolio.

## Rules

- **Keep this repo KISS as fuck: stupid easy to use and boring to maintain. Complexity alone is enough to veto an idea.**
  - **Push back before coding:** If a requested feature introduces disproportionate architectural complexity or state, flag it and propose the simplest viable alternative before writing code.
  - **No legacy support:** Replace old behavior cleanly—never keep fallback paths, shims, or backwards-compatibility layers. If compatibility is actually needed, ask me first.
  - **Prefer stdlib and existing dependencies:** Do not introduce a new package for something solvable in under 50 lines of straightforward code.
  - **Flat and explicit over clever:** Use plain functions, direct control flow, and concrete types. Do not create wrappers, factories, or interfaces that only have one implementation.
  - **No speculative extensibility:** Do not add config flags, plugin hooks, or abstraction layers for hypothetical future use cases.
- Commit learning updates to the [published catalog](docs/learning-data.md). Keep learning resources and Kian's authored practice distinct. Never invent learning progress or authored work.
- Determine routine resource classifications yourself using the catalog, published prerequisites, and available context. Classify resources using the published tier rules. Derive prerequisite readiness from catalog completions and record learning progress only from Kian’s updates.
- Use sourced, edition-specific bibliographic facts in resource panels. Do not add generated descriptions, audience commentary, study prompts, or invented notes. Show resource tiers as compact metadata tags without explanatory panel sections.
- Keep the portfolio static and read-only. Do not add accounts, a backend, browser persistence, or visitor editing controls. Keep filters and theme state transient.
- Preserve the Grakata-derived visual style and compact controls in `src/styles.css`. Use `~/warframe-toolkit` as a read-only reference.
- Invalid learning data must fail the build. Do not silently replace or drop invalid entries or relationships between resources and practice.
- Keep tasks quick and focused. Commit requested edits promptly and include any workflow instruction changes with the associated work. Batch broader reviews, routine validation, pushes, and deployment checks after roughly five small commits unless Kian asks sooner.
- Run `npm run build` when validating a batch before pushing. Also run `npm test` for changes to interactions or published data handling. Follow the [development guide](docs/development.md) for the local ports and Chromium settings.
- Publish through `main` and keep asset URLs compatible with project prefixes. Verify the GitHub Actions Pages deployment and resolve failures before reporting the batch deployed.

## Documentation (read/write)

- **Read first:** For how this repo works, start at `docs/README.md`, then
  open only the topic files you need. Do not re-derive behavior from
  filenames alone when a doc covers it.
- **Before non-trivial changes:** Check the relevant doc so you match
  existing patterns.
- **After behavior changes:** Update the **one** topic file under `docs/`
  that owns that fact. Do not copy the same detail into AGENTS.md,
  README.md, or multiple docs.
- **Regenerate vs patch:** `docs/README.md` records the commit it was
  generated from; `git diff <sha>..HEAD --stat` shows what changed since.
  Prefer the `generate_docs` skill when docs are broadly stale or many
  topics shifted; for small, targeted edits, patch the single topic file
  (and `docs/README.md` if you add/remove a topic).
- `CLAUDE.md` is a symlink to this file.

Do not put implementation detail in this file — it lives under `docs/`.
