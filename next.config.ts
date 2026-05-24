import type { NextConfig } from "next";

/**
 * Security headers applied to every route.
 *
 * CSP notes:
 *  - `script-src 'unsafe-inline'` is required for Mantine's `ColorSchemeScript`
 *    (inline `<script>` in app/layout.tsx) and Next.js hydration data scripts.
 *  - `style-src 'unsafe-inline'` is required for Mantine's component-level
 *    inline styles (CSS-in-JS via emotion-style runtime).
 *  - No `fonts.googleapis.com` / `fonts.gstatic.com` needed: `next/font/google`
 *    self-hosts Geist + Geist Mono at build time, so fonts are served from `'self'`.
 *  - `connect-src` only allows `'self'` plus the API origin. In production behind
 *    a reverse proxy that fronts both app and api under the same origin, `'self'`
 *    covers the api fetch. In pure dev (`pnpm dev` on :3000 calling api at :8000),
 *    `'self'` resolves to `localhost:3000` only, so CSP itself blocks the request
 *    to `localhost:8000` (different port = different origin). Set
 *    `NEXT_PUBLIC_API_URL` to a same-origin proxied path, or temporarily relax
 *    `connect-src` in dev. Tracked as a follow-up to gate CSP on `NODE_ENV`.
 *  - No `img-src` `data:` / `blob:` removal: Mantine icons + drag/drop preview
 *    rely on both.
 */
const cspDirectives = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https://api.sleuthgraph.io",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  },
  { key: "Content-Security-Policy", value: cspDirectives },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
