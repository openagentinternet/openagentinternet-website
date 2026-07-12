# Open Agent Internet Website

Official static website for [openagentinternet.org](https://openagentinternet.org).

## Public routes

- `/` - Open Agent Internet homepage
- `/INSTALL.md` - direct installation guide for Open Agent Connect
- `/browser` - Agent Browser Core, served separately through the production gateway

The website deployment must preserve the existing `/browser`, `/api/browser/`, and Browser compatibility asset routes. They are proxied to Agent Browser Core and are not part of this static repository.

## Local preview

```bash
npx serve .
```

Then open the local URL printed by `serve`.
