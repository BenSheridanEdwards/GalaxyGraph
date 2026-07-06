# Contributing

Thanks for helping improve Galaxy Graph.

## Local setup

```bash
npm ci
npm run build
npm run typecheck
npm test
```

## Development rules

- Keep `@galaxy-graph/core` backend-agnostic. Framework-specific discovery belongs in adapters.
- Use sanitized fixtures only. Do not commit private product data, generated customer data, secrets, or proprietary reports.
- Add tests for adapter parsing and schema changes.
- Run `npm run pack:dry-run` before publish-related changes.

## Commit style

Use conventional commits such as `feat:`, `fix:`, `docs:`, `test:`, and `chore:`.

## Licensing of contributions

Unless you explicitly state otherwise, any contribution you intentionally
submit for inclusion in this project shall be licensed under the MIT
License (see the LICENSE file), without any additional terms or
conditions, and you confirm that you have the right to submit it under
that license.
