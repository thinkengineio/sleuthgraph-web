# sleuthgraph-web

Frontend for [Sleuthgraph](https://sleuthgraph.io) — an OSINT investigation workbench with graph-based entity mapping.

## Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, standalone output) |
| Language | TypeScript 5 |
| UI library | Mantine v8 (dark theme by default) |
| Graph viz | Cytoscape.js + react-cytoscapejs |
| Styling | Tailwind CSS v4 |
| Testing | Vitest + Testing Library |

## Local development

Requirements: Node.js 22+, pnpm 10+.

```bash
pnpm install

# Create a local env file pointing at the API
# (API started via the meta repo's docker-compose)
echo 'NEXT_PUBLIC_API_URL=http://localhost:8000' > .env.local

pnpm dev
```

Open http://localhost:3000.

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | Base URL of the Sleuthgraph API (e.g. `http://localhost:8000`) |

All `NEXT_PUBLIC_*` variables are baked into the client bundle at build time. Do not put secrets in them.

## Tests

```bash
pnpm test          # one-shot (Vitest)
pnpm test:watch    # watch mode
```

## Lint + format

```bash
pnpm lint          # ESLint
pnpm format        # Prettier (write)
pnpm format:check  # Prettier (check only)
```

## Production build

```bash
pnpm build   # outputs to .next/standalone
pnpm start   # starts the standalone server
```

## Docker

Build and run the production image:

```bash
# Build
docker build -t sleuthgraph-web:latest .

# Run (pass the API URL at runtime)
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=https://api.sleuthgraph.io \
  sleuthgraph-web:latest
```

The image uses a multi-stage build (deps → builder → runner) and runs as a non-root `nextjs` user. Port 3000 is exposed.

Note: `NEXT_PUBLIC_API_URL` is a build-time variable baked into the bundle. If you need to target a different API endpoint without rebuilding, pass it as a build arg and rebuild, or use a runtime configuration approach.

## Key pages

| Route | Description |
|-------|-------------|
| `/` | Landing / home |
| `/login` | Email + SSO sign-in |
| `/register` | Account creation |
| `/cases` | Case list |
| `/cases/[caseId]` | Case detail + evidence |
| `/cases/[caseId]/graph` | Cytoscape graph view |

## License

Apache 2.0 — see [LICENSE](../sleuthgraph/LICENSE).
