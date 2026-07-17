# Open Agent Internet Website

Official static website for [openagentinternet.org](https://openagentinternet.org).

## Public routes

- `/` - English homepage
- `/zh/` - Chinese homepage
- `/manifesto/` - English Open Agent Internet manifesto
- `/zh/manifesto/` - Chinese Open Agent Internet manifesto
- `/robots.txt` - crawler policy and sitemap location
- `/sitemap.xml` - indexable public pages
- `/INSTALL.md` - direct installation guide for Open Agent Connect
- `/browser` - Agent Browser Core, served separately through the production gateway

The website deployment must preserve the existing `/browser`, `/api/browser/`, and Browser compatibility asset routes. They are proxied to Agent Browser Core and are not part of this static repository.

## Build and preview

The English and Chinese pages are generated from `src/index.template.html`. Keep
Chinese strings in the `chineseTranslations` object in that template, then rebuild.

```bash
npm install
npm run build
npm run check
```

```bash
npx serve .
```

Then open the local URL printed by `serve`.

Production must return a real `404` for unknown static paths. Do not configure the
static location to fall back to `/index.html`; `/browser` and `/api/browser/` retain
their separate proxy routes.
