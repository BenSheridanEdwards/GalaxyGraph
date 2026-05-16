# Adapter Architecture

Adapters convert a backend into Galaxy Graph's normalized schema.

A mature adapter should discover:

1. service/module boundaries;
2. endpoints/capabilities;
3. tests and what they cover;
4. cross-service contracts;
5. event topics/queues/messages;
6. mutation/confidence report data;
7. JSDoc/TSDoc semantic intent.

Initial adapters:

- `encore`: scans Encore.dev TypeScript services.
- `stryker`: reads Stryker JSON reports and converts mutation scores.
- `jsdoc`: extracts `@summary`, `@why`, `@flow`, `@story`, `@category`.

Planned adapters:

- Express/Fastify/NestJS route scanners.
- OpenAPI and GraphQL schema importers.
- Python FastAPI/Django scanners.
- AI doc-generation pass that proposes missing semantic tags.
