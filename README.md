# WidBar Website and Widget Showcase

Public website for WidBar and remote widget catalog used by the in-app Showcase page.

- Website: https://andelby.github.io/winbar-showcase/
- Catalog: https://andelby.github.io/winbar-showcase/catalog.json
- WidBar on Microsoft Store: https://apps.microsoft.com/detail/9pkldnm83tp9

This repository contains the public website, widget metadata and visual assets.
Widget packages are distributed through Microsoft Store.

## Structure

- `index.html` is the public website.
- `styles.css` contains the site layout and visual system.
- `app.js` loads `catalog.json` and renders the showcase.
- `catalog.json` is the data source used by both the website and WidBar.
- `assets/` contains widget icons and product screenshots.

## Add or update a widget

Add a category when needed, then append or update a widget entry in `catalog.json`.
Every entry requires:

- a unique catalog `id`;
- the WidBar AppExtension `pluginId`;
- the Microsoft Store `storeProductId`;
- category, publisher, name, summary and description;
- a public icon URL.

Keep `schemaVersion` at `1` until WidBar introduces a newer catalog contract.
