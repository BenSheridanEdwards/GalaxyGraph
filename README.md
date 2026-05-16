# Galaxy Graph

Open-source backend visualization for test confidence, service intent, mutation coverage, and cross-service contracts.

Galaxy Graph turns a backend into an interactive 3D map:

- services as suns
- endpoints as orbiting capabilities
- tests as confidence satellites
- event topics and cross-service contracts as visible bonds
- Stryker mutation reports as risk/confidence overlays
- JSDoc/TSDoc annotations as semantic product intent

The core renderer is backend-agnostic. Backends plug in through adapters that emit the normalized `GalaxyGraphDataset` schema.

## Packages

- `@galaxy-graph/core` — React + Three.js/3d-force-graph renderer and normalized schema.
- `@galaxy-graph/adapters` — adapter interfaces plus initial Encore.dev, Stryker, and JSDoc/TSDoc extraction helpers.
- `@galaxy-graph/cli` — `galaxy-graph generate` command for producing graph JSON.

## Current adapter status

The first adapter targets Encore.dev TypeScript backends and optional Stryker mutation reports. It is intentionally split from the renderer so additional adapters can be added for Express, NestJS, Fastify, FastAPI, Django, Go, OpenAPI, GraphQL, or any custom backend.

## Semantic docs convention

Galaxy Graph understands these optional JSDoc/TSDoc tags:

- `@summary` — concise service/endpoint/contract purpose.
- `@why` — architectural reason or business intent.
- `@flow` — numbered flow through services/events.
- `@since` — lifecycle/version context.
- `@story` — test story in human language.
- `@category` — test/contract bucket such as `contract`, `edge-case`, `resilience`, `error`, `behaviour`.

Later, an AI-assisted CLI can propose or update these docs before graph generation.

## Usage sketch

```bash
npm install
npm run build
npx galaxy-graph generate --adapter encore --root ../Oneness-Platform --out graph.json
```

```tsx
import { GalaxyGraph, type GalaxyGraphDataset } from "@galaxy-graph/core";
import "@galaxy-graph/core/style.css";

export function BackendMap({ dataset }: { dataset: GalaxyGraphDataset }) {
  return <GalaxyGraph dataset={dataset} />;
}
```

## Extraction philosophy

The product boundary is:

1. adapters inspect backend code, tests, mutation reports, and docs;
2. adapters emit normalized `GalaxyGraphDataset` JSON;
3. `@galaxy-graph/core` renders that data without knowing the backend framework.

This keeps the IP in the graph model, visual system, semantic docs discipline, and adapter ecosystem — not in a single framework-specific implementation.
