# StudyGraph

**Tagline:** Visual learning maps for smarter studying.

StudyGraph is a GitHub-ready frontend project that helps students build topics as a graph, connect prerequisites, track mastery, and get intelligent suggestions on what to study next.

## What it does

- Create topics with category, difficulty, estimated hours, and mastery level
- Connect prerequisite relationships between topics
- Detect cycles before invalid dependencies are added
- Compute unlocked, blocked, in-progress, and mastered states
- Recommend the next best topic using graph-aware scoring
- Show dependency paths, blockers, category progress, and study signals
- Persist roadmap changes in `localStorage`
- Export the roadmap as JSON

## Tech profile

This repo is intentionally dependency-light so it is easy to understand, run, and publish.

- Static HTML/CSS/JavaScript frontend
- Custom graph engine in vanilla JavaScript
- Node-based local dev server script
- GitHub Pages deployment workflow

## Project structure

```text
studygraph/
|-- .github/
|   `-- workflows/
|       `-- deploy-pages.yml
|-- scripts/
|   |-- check.mjs
|   `-- dev.mjs
|-- src/
|   |-- js/
|   |   |-- app.js
|   |   |-- app-render.js
|   |   |-- app-state.js
|   |   `-- graph-engine.js
|   `-- styles/
|       `-- styles.css
|-- .gitignore
|-- .nojekyll
|-- index.html
|-- LICENSE
|-- package.json
`-- README.md
```

## Main files

- [index.html](D:/studygraph/index.html): application shell, layout, dialogs, and script loading
- [src/js/graph-engine.js](D:/studygraph/src/js/graph-engine.js): graph analysis, unlock logic, recommendation scoring, shortest paths, and cycle detection
- [src/js/app-state.js](D:/studygraph/src/js/app-state.js): demo data, persistence, filters, and mutation helpers
- [src/js/app-render.js](D:/studygraph/src/js/app-render.js): graph rendering, stats, sidebars, and analytics UI
- [src/js/app.js](D:/studygraph/src/js/app.js): DOM wiring, dialogs, drag behavior, and event handlers
- [src/styles/styles.css](D:/studygraph/src/styles/styles.css): premium responsive styling and graph visuals
- [scripts/dev.mjs](D:/studygraph/scripts/dev.mjs): local static server
- [scripts/check.mjs](D:/studygraph/scripts/check.mjs): repository sanity checks

## Run locally

No dependency install is required.

```bash
npm run dev
```

Then open `http://localhost:4173`.

To run project checks:

```bash
npm run check
```

## GitHub setup

1. Create a new GitHub repository named `studygraph`.
2. Push this folder to the `main` branch.
3. In GitHub, enable **Settings -> Pages -> Build and deployment -> GitHub Actions**.
4. Every push to `main` will run [deploy-pages.yml](D:/studygraph/.github/workflows/deploy-pages.yml) and publish the site.

## Why this is portfolio-worthy

StudyGraph is more than CRUD. The core of the project uses:

- graph data structures
- dependency resolution
- unlock logic
- cycle detection
- path explanation
- recommendation scoring

That makes it a solid first serious CSE portfolio project with both UI polish and real CS logic.
