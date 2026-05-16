# Security Policy

Galaxy Graph parses local source trees and test reports. Treat input repositories and reports as potentially sensitive.

## Supported versions

Pre-1.0 while the API stabilizes. Security fixes target the latest `main` branch until the first public release.

## Reporting a vulnerability

Please do not open public issues for vulnerabilities. Email the maintainer or use GitHub private vulnerability reporting once the public repository is created.

## Data handling expectations

- Do not commit private architecture exports, mutation reports, `.env` files, tokens, or production-generated graph JSON.
- Example fixtures must be small, synthetic, and safe to publish.
- The CLI writes only to the requested output path.
