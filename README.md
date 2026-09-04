# Get Ireland Active map concept

A modern React/Vite recreation of the Get Ireland Active explore page, powered by ArcGIS Maps SDK for JavaScript 5.1 components and the supplied ArcGIS Online web map.

## Run locally

```bash
npm install
npm run dev
```

The default map is `7f0c7b29b88b4e71afabe10c20ce79b6`. Its saved clustering and scale thresholds are used directly. Copy `.env.example` to `.env` to override the web map or portal URL.

The app discovers public feature layers in the web map, loads a sample of their records into the result panel, and supports text/category filtering and map navigation from result cards.

## Deployment

Pushes to `main` are automatically built and deployed through GitHub Pages.
