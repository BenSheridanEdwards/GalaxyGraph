# Galaxy Graph Dataset Schema

Adapters emit `GalaxyGraphDataset` from `@galaxy-graph/core`.

Top-level fields:

- `services`: service/module nodes.
- `endpoints`: public or internal capabilities owned by a service.
- `tests`: tests that cover service endpoints or contracts.
- `contracts`: cross-service behaviour verified by tests.
- `topics`: event-bus topics or message channels.
- `mutation`: Stryker-compatible confidence data.
- `colors`: optional service color overrides.

The renderer does not require Encore, Stryker, or TypeScript. Those are only adapter inputs.
