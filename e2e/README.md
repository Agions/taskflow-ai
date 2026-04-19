# E2E Test Framework

This directory contains the end-to-end (E2E) testing framework for TaskFlow AI's documentation site.

## Goal

Ensure documentation site is accessible, navigable, and free of broken links. Cover core user journeys.

## Setup

Dependencies are in the root `package.json`.

1. Install Playwright browsers (once):

   ```bash
   npx playwright install chromium
   ```

2. Ensure docs dev server works:
   ```bash
   npm run docs:dev
   ```

## Running Tests

```bash
npm run test:e2e        # headless
npm run test:e2e:ui     # with UI
npm run test:e2e:debug  # debug mode
```

The `webServer` config in `playwright.config.ts` will automatically start `npm run docs:dev` on port 3000 before tests, and shut it down after.

## Test Files

- `tests/documentation.spec.ts` - Site basics: title, nav, search, mobile
- `tests/cli-docs.spec.ts` - CLI command reference pages
- `tests/smoke.spec.ts` - Core user journeys (install, think, MCP, agents)

## Notes

- Tests target Vitepress default structure
- Broken link checks are limited to avoid excessive requests
- Mobile viewport set to 375x667
