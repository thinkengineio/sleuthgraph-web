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
 *  - `connect-src` only allows `'self'` plus the API origin. The same-origin
 *    `localhost:8000` dev fallback in `lib/api.ts` is covered by `'self'` when
 *    behind a reverse proxy; in pure dev (`pnpm dev` on :3000 → :8000) browsers
 *    will block the cross-origin call regardless of CSP because the API host
 *    isn't `'self'`. Override `NEXT_PUBLIC_API_URL` for dev work that needs it.
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
