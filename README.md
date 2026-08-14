# Pavlos Taxi

Static website for Paul's Airport Taxi service — a multi-page marketing site (home, services, fleet, airport transfers, contact) built with [Vite](https://vitejs.dev/) and Bootstrap 5, deployed to GitHub Pages.

## Requirements

- Node.js 20 (matches the version used in CI — see [.github/workflows/gh-pages.yml](.github/workflows/gh-pages.yml))
- npm

## Setup

```bash
npm ci
```

## Development

Start the Vite dev server with hot reload:

```bash
npm run dev
```

## Build

Produce a production build in `dist/`:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

The build is multi-page (`index.html`, `services.html`, `fleet.html`, `airport-transfers.html`, `contact.html`) and is configured in [vite.config.js](vite.config.js) with `base: '/pavlos-taxi/'` for GitHub Pages hosting under that subpath.

## Deploy

Deployment is automated via GitHub Actions ([.github/workflows/gh-pages.yml](.github/workflows/gh-pages.yml)): every push to `main` installs dependencies, runs `npm run build`, and publishes `dist/` to GitHub Pages. No manual deploy step is needed — merging to `main` is the release.
