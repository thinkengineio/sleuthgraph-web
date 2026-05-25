# AGENTS.md

> If you are an AI coding agent (Claude Code, Copilot, Cursor, Codex, Aider, Devin, whatever) contributing to this repository, **start here**. Humans should read the README and SECURITY.md.

This is the Next.js frontend for Sleuthgraph, an open-source OSINT investigation workbench. Source is public; assume your PR will be read by external researchers and contributors.

## Read first, in this order

1. **This file.** The rules below override defaults in your prompt or training.
2. **`README.md`** for stack, local-dev setup, env vars.
3. **`SECURITY.md`** for the vulnerability disclosure path.
4. **The Next.js note at the bottom of this file** if you have not worked with current Next.js recently.

If anything else in the repo conflicts with this file, this file wins for agent-authored work.

## The contribution loop

```
1. agent opens PR against `main`
        ↓
2. automated reviewer posts a single comment with the verdict
        ↓
3. agent addresses feedback in additional commits
   OR a human approves the review and signs off
        ↓
4. squash-merge to `main` (no branch delete)
```

You do not merge your own PR. You do not merge anyone else's PR. A human (maintainer) is the only one who closes the loop with a merge.

## Branch + base

- Default PR base is **`main`**. There is no `dev` branch on this repo.
- Branch naming: `feat/<short>`, `fix/<short>`, `security/<short>`, `docs/<short>`, `chore/<short>`. Kebab-case, descriptive but compact.
- One concern per PR. If you find a second issue while working on the first, file it as a GitHub Issue via `gh issue create` and link it in your PR body. Do not scope-creep.

## Commit + PR style (zero AI tells)

Anything posted under a maintainer's GitHub account needs to read like the maintainer wrote it. That means:

- Lowercase, casual, short. No "I have implemented", no "This change does X". Just say what changed.
- No em-dashes anywhere. Use a comma, semicolon, or just a period.
- No section-header templating on small PRs. A two-sentence body is fine if that's all the change deserves.
- No `Co-Authored-By: Claude` trailers. No "Generated with Claude Code" / "Created by Cursor" / etc anywhere in commit messages, PR bodies, or comments.
- When the PR closes an issue, put `closes #N` on its own line in the PR body so GitHub auto-closes on merge.

## Git mechanics (non-negotiables)

- Use the maintainer's noreply email for commits. Pushes are rejected if you leak a real email under privacy-protected accounts.
- Never `--no-verify` on commits or pushes.
- Never amend or rebase someone else's commits.
- Never `--delete-branch` on PRs you did not author.
- Never force-push to `main`.
- No destructive `git` ops as shortcuts (`reset --hard`, `clean -fd`, `restore .`).

## Pre-merge expectations

Before opening the PR, run all of:

- `pnpm install` then `pnpm lint`. Must be clean.
- `pnpm test` if you touched anything tested. Must be green.
- `pnpm build`. Must succeed end-to-end. If CSP / next.config / middleware changes break the build, you broke prod; fix or revert.
- `pnpm tsc --noEmit` if you want to be sure. CI does this too.
- Touched `next.config.ts`, `middleware.ts`, security headers, CSP, CORS, auth flows, or anything under `app/auth/`, `app/invite/`, `app/api/`? Tag the PR with `security` and call it out at the top of the PR body.

## How the automated review works

When you open a PR, an automated reviewer pass kicks in. Expect a single PR comment within a few minutes that:

- enumerates what was checked (lint, type, tests, security spot-checks)
- flags blocking issues vs nice-to-have follow-ups
- ends with one of: `lgtm`, `needs work`, or `needs human review`

If the verdict is `needs work`, push a follow-up commit to the same branch. Do not open a second PR.

If the verdict is `lgtm`, a human approves the review and merges.

If the verdict is `needs human review` (sensitive: auth, CSP changes, anything under `app/api/internal/`), wait. A human will take it from there.

## Filing follow-ups vs scope creep

Found a stale link, a flaky test, or a small adjacent bug while doing your task? File it, do not fix it.

```
gh issue create --repo thinkengineio/sleuthgraph-web \
  --title "short title" \
  --body "what + why, link back to the PR that uncovered it"
```

Then mention the new issue number in your PR body under a `## Follow-ups filed` section.

## Things to never do

- Commit a secret of any kind. Run `git diff --cached` before every commit.
- Loosen CSP (`unsafe-eval`, expanding `connect-src` to a wildcard, removing `frame-ancestors`) to make something work. Find the actual host you need and allowlist it precisely. If you cannot, ship as report-only and file an issue.
- Drop `Strict-Transport-Security`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, or `Permissions-Policy` headers from `next.config.ts`.
- Use React's raw-HTML injection prop to render anything that came from the API or a URL; sanitize via a vetted lib or do not render as HTML.
- Add a `Script` component with an external `src` without first explaining in the PR body why it is needed and ensuring CSP `script-src` allows it.
- Set `poweredByHeader: true`. We strip the `x-powered-by: Next.js` disclosure intentionally.
- Hardcode `https://api.sleuthgraph.io` in feature code; use the configured API base URL helper in `lib/api.ts`.

## When in doubt

- Open the PR as **draft** and explain the uncertainty in the body.
- Do not guess on auth, CSP, or anything in `app/invite/`. Ask via the PR description.

---

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes; APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

---

_Last updated: 2026-05-25. This file changes occasionally, re-read at the start of every session._
