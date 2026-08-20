---
name: review-security
description: Read-only security review of this workshop app. Reports BLOCKER / WARNING / PASS findings with file-level evidence, and states its own limits. Makes no changes.
---

# Review Security

You are performing a READ-ONLY security review of this workshop app. Do not edit any
file. Output a short report: each finding is BLOCKER, WARNING, or PASS, with the file
path (and line where useful) as evidence.

## Checklist

1. **Secrets** — Search the tracked files for secret-shaped strings: `sb_secret_`,
   `service_role`, `SUPABASE_SERVICE`, private keys, DB passwords.
   The publishable key and project URL in the browser bundle are PUBLIC BY DESIGN — not findings.
   Files that merely NAME these patterns as text to search for (this skill file itself) are not findings.
   `.env.local` must be git-ignored and untracked (`git status`, `.gitignore`).
2. **RLS** — `supabase/workshop-schema.sql` must enable row level security on every
   table in `public`. `orders` and `order_items` must be owner-scoped for select
   (`auth.uid() = user_id`, and for lines via their parent order) and must have NO
   client insert/update/delete policy — writes go through `place_order()` /
   `cancel_order()`. `favourites` is owner-scoped for select, insert and delete.
   The menu tables (`categories`, `menu_items`, `restaurant_settings`) are read-only
   to everyone: a `for select using (true)` policy and no write policy at all.
3. **Server-side protection** — `app/app/page.tsx`, `app/app/orders/[id]/page.tsx`,
   `app/app/orders/[id]/receipt/page.tsx`, `app/app/favourites/page.tsx` and
   `app/checkout/page.tsx` must verify the user on the server
   (`supabase.auth.getUser()`) and `redirect("/login")` when signed out.
   Hiding UI is not protection.
4. **Prices come from the database** — `place_order()` must look every `price_cents`
   up in `menu_items` itself and compute `subtotal`/`total`. If any price, fee or
   total in the JSON payload sent by `components/CheckoutClient.tsx` reaches an
   `insert`, that is a BLOCKER. Both functions must be `security definer` with
   `set search_path = ''`, and `execute` granted only to `authenticated`.
5. **Ownership on insert** — the favourite insert in `components/MenuClient.tsx` must
   set `user_id` from the verified session, never from a form field or URL.
6. **Open redirect** — the `?next=` handling (`lib/redirect.ts`) must reject anything
   that isn't a plain in-app path (`//host`, `https://host`).
7. **Untrusted content stays data** — no `dangerouslySetInnerHTML` (or similar raw-HTML
   rendering) on user-entered content (addresses, notes, phone) anywhere under `app/`
   or `components/`.
8. **Input validation** — phone/address/notes length limits and quantity bounds
   enforced in the UI (`components/CheckoutClient.tsx`, `lib/cart.tsx`) AND in the
   database (`check` constraints and the guards inside `place_order()`).
9. **Safe errors** — user-facing error messages must not leak stack traces, tokens,
   or SQL. The messages surfaced from `place_order()` / `cancel_order()` are
   deliberately written to be shown to customers — check they still are.
10. **Least-privilege MCP** — `.mcp.json` and `.codex/config.toml` list only github,
    supabase (with `read_only=true`), and vercel.

## Report format

- Start with a one-line verdict: "READY" (no BLOCKERs) or "NOT READY (n blockers)".
- List findings grouped by severity, each with evidence.
- End with **Limits of this review**: static reading only — it cannot prove RLS is
  enabled in the participant's actual Supabase project, so the live two-account test
  (Module 6) is still required.
