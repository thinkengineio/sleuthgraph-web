# sleuthgraph-web

Frontend for [Sleuthgraph](https://github.com/francose/sleuthgraph) — Next.js + TypeScript + Tailwind.

## Local development

Requires Node.js 22+, pnpm 10+.

```bash
pnpm install

# Point at local API (started via meta repo's docker-compose)
echo 'NEXT_PUBLIC_API_URL=http://localhost:8000' > .env.local

pnpm dev
```

Open http://localhost:3000.

## Tests

```bash
pnpm test          # one-shot
pnpm test:watch    # watch mode
```

## Lint + format

```bash
pnpm lint
pnpm format
```

## Build

```bash
pnpm build
pnpm start
```

## License

Apache 2.0 — see [LICENSE](../sleuthgraph/LICENSE).
