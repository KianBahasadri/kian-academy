# Publishing

Edit the [learning data](learning-data.md) in the checkout or through GitHub. Commit the content update and follow the repository's [validation and batching rules](../AGENTS.md#rules) when publishing through `main`.

## GitHub Pages

The **Deploy GitHub Pages** workflow starts on pushes to `main`. It also supports a manual run from Actions. [Deployment workflow](../.github/workflows/deploy.yml)

1. The build job installs the locked dependencies, runs the [build script](development.md), installs Playwright's Chromium, and runs the test suite with that browser.
2. After a successful build and test run, it uploads `dist/` as a Pages artifact.
3. The deployment job publishes the artifact to the `github-pages` environment. It uses the workflow's Pages and identity-token permissions.

The repository uses GitHub Actions as its Pages source. The workflow gets its credentials from GitHub and requires no repository deployment secrets. Validation, build, or test failures stop the new artifact from deploying. Check the run and open the [live site linked from the README](../README.md) after it succeeds.

Vite builds relative asset URLs with `base: './'`, including the favicon linked by `index.html`. [Hash navigation](interface.md) keeps both collections under the same project URL, `/kian-academy/`. [Vite configuration](../vite.config.ts) · [Page entry](../index.html)
