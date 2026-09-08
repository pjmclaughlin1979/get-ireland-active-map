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

## ArcGIS Online sign-in

The application requires ArcGIS user authentication before mounting its pages or map. It uses the Maps SDK IdentityManager with OAuth authorization-code flow (PKCE); no client secret belongs in this browser application.

Register an ArcGIS OAuth application and add these redirect URLs:
Update to your own urls....

Set the public client ID as `VITE_ARCGIS_CLIENT_ID` in your local `.env` and as a GitHub Actions repository variable of the same name. Restart Vite after changing `.env`. 

Without a client ID the site shows a configuration message and does not load the map. End-to-end OAuth verification requires a registered client ID. Organisation/group admission rules remain pending the owner's access requirements; the current integration checks for an authenticated portal user only. Restrict private web maps and all underlying services using ArcGIS organisation/group sharing. The static frontend itself is publicly downloadable on GitHub Pages and cannot enforce data secrecy. Sign out clears this application's SDK credentials; it does not terminate an organisation-wide SSO session.
