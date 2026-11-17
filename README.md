# C/D Spec Panel Builder

A local-first Vue application for entering vehicle specifications and generating Car and Driver-style specification-panel HTML.

## Run locally

Requirements: Node.js `^22.18.0` or `>=24.12.0` and npm.

```sh
npm install
npm run dev
```

Vite prints the local address. The editor runs in the browser and currently keeps its panel data in memory; refreshing the page clears the draft.

## What it supports today

- First Drive, Tested Specs, and Long-Term Test output modes.
- One required vehicle and one optional second vehicle.
- Vehicle identity, vehicle type, section controls, specifications, and repeatable First Drive trim prices.
- Ordered engine and powertrain variants, including combustion, hybrid, and electric options.
- Generated HTML, rendered preview, and copy-to-clipboard.

The HTML textarea is read-only. Two-vehicle output is currently generated per vehicle and joined with a horizontal rule, so headings and testing links are repeated. See `docs/TECH-HANDOFF.md` for current limitations and next steps.

## Useful commands

```sh
npm run dev
npm run type-check
npm run test:unit
npm run build
```

The current test suite has a single app-mount smoke test. The configured lint scripts use autofix; inspect their effects before running them on a working tree with changes.
