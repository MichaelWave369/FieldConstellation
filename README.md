# Field Constellation · Edition 02

An interactive 3D atlas of [MichaelWave369’s public GitHub repositories](https://github.com/MichaelWave369?tab=repositories), combining Field Constellation with the user-supplied Grok Field Lattice.

**[Explore the constellation](https://michaelwave369.github.io/FieldConstellation/)** · [Deployment status](https://github.com/MichaelWave369/FieldConstellation/actions)

## Explore

- Five layouts: thematic constellation, Fibonacci sphere, chronological helix, language orbits, and golden-angle chronological spiral.
- Three color lenses: world, programming language, and recent code activity.
- Field green and Lattice gold themes; search, a quick repository index, a sortable directory, Pages-only and fork filters.
- Repository details with live-site and GitHub links, dates, stars, forks, license, branch, and Pages status.
- WebGL rendering with a perspective-correct Canvas fallback that shares the camera, layouts, selection, and OrbitControls.
- Responsive navigation, keyboard controls, reduced-motion support, and locally bundled fonts and rendering code.

Drag to orbit, scroll or pinch to zoom, and right-drag or Shift-drag to pan. Press `/` to search and `Esc` to clear a selection. Arrow keys rotate a focused map; outside the map, up/down arrows visit projects.

## Repository data

The checked-in snapshot contains **177 public repositories**, fetched on 21 October 2026, including FieldConstellation. It works immediately without a GitHub token. The refresh button checks every page of the anonymous public GitHub API and keeps the saved inventory if a refresh fails. GitHub rate limits can temporarily prevent refreshes.

The public build only loads public repository records. Positions, world categories, and association links are an artistic navigation aid. They are **not verified dependency relationships**. Helix/spiral links follow creation order; language links join peers. Activity colors use the last code push, not an inferred measure of project quality. Pages status means GitHub’s `has_pages` flag, which does not guarantee the linked site is currently reachable.

## Run locally

Requires Node.js 22 or later.

```sh
npm ci
npm run check
npm test
npm run build
npm run preview
```

Open `http://localhost:4173/FieldConstellation/`. The preview server accepts both the root and GitHub Pages subpath. All deployed assets use relative paths.

```sh
npm run refresh
```

This replaces `src/repos.json` only after the complete public inventory is fetched successfully. Commit that file to update the bundled snapshot. Browser refreshes are saved locally in that browser and do not change the repository.

## GitHub Pages

The workflow validates source, runs model tests, builds `dist/`, and deploys it on pushes to `main`. In **Settings → Pages → Build and deployment**, set **Source** to **GitHub Actions** once. Then run the workflow or push a commit. The live address is `https://michaelwave369.github.io/FieldConstellation/`.

Pull requests run validation and build without deploying. No GitHub token, environment secret, or external backend is required by the app. The workflow uses GitHub’s built-in deployment token.

## Project structure

- `src/`: application, renderer fallback, model, public snapshot, and local fonts.
- `scripts/`: reproducible build, checks, public refresh, and local preview.
- `tests/`: layout, ordering, filtering, metadata, and public-snapshot checks.
- `.github/workflows/pages.yml`: validation and Pages deployment.
- `dist/`: generated output, excluded from git. Three.js is pinned to `0.180.0` in the lockfile and copied into the build.

## Provenance and license

See [GROK-INTEGRATION.md](GROK-INTEGRATION.md) for the combined design and [VALIDATION.md](VALIDATION.md) for verification and limits. App code is MIT licensed; Three.js is MIT licensed, and DM Sans uses the SIL Open Font License. Their license texts are included with the built assets.
