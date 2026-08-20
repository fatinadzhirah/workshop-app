# FoodFat — Workshop Starter App

The starter app for **Build with AI: Zero to Shipped** (TimeTec, 1-day workshop).
A small food ordering system for a single kitchen: browse the menu, build a cart,
check out for pickup or delivery, then track and reorder past orders. Each user
sees only their own orders — enforced by the database, not just the UI.

## Run it (no setup needed)

```bash
npm ci
npm run dev
```

Open http://localhost:3000. The homepage, menu, login, signup and `/app` pages all
render **before** any backend exists — pages that need Supabase show a friendly
"Backend not connected yet" note until Module 5.

## The seams (where each module plugs in)

| Module | What you touch |
|---|---|
| 1 — GitHub | `workshop-profile.md` (your first commit) |
| 3 — MCP & skills | `.mcp.json`, `.codex/config.toml`, `.claude/skills/` |
| 4 — Customize | `lib/config/brand.ts` (branding, currency, badge toggle), `app/page.tsx` (copy + `SECTION_ORDER`) |
| 5 — Supabase | run `supabase/workshop-schema.sql`, then create `.env.local` from `.env.example` |
| 6 — Security | `/review-security` skill + the two-account test |
| 7 — Deploy | `/prepare-deployment` skill + Vercel |

## Connecting Supabase (Module 5)

1. Create a Supabase project.
2. SQL editor → paste and run `supabase/workshop-schema.sql` (once). It creates the
   tables, the policies, the two checkout functions **and seeds a starting menu**.
3. Copy `.env.example` to `.env.local` and fill in your project's URL and
   publishable key (Project Settings → API). Both values are browser-safe.
4. Restart the dev server. Browse `/menu`, sign up, place an order.

The file is safe to re-run: every statement is guarded and the seed rows use
`on conflict do nothing`. It contains no `drop`, `truncate` or `delete`.

**Email confirmation is OFF** in the workshop Supabase template — sign-up signs you
straight in. (If your project has it ON, sign-up shows "check your email" instead;
the app handles both.)

## How an order flows

```
/menu  →  cart (browser)  →  /checkout  →  place_order()  →  receipt  →  /app/orders/[id]
```

- **The menu** (`categories`, `menu_items`, `restaurant_settings`) is readable by
  anyone and writable by nobody, so `/menu` works signed out.
- **The cart lives in the browser** — React context in `lib/cart.tsx`, saved to
  `localStorage`. There is no cart table.
- **Checkout goes through `place_order()`**, a Postgres function. The browser sends
  dish ids and quantities; the function looks the prices up itself and computes the
  totals. `orders` has no client insert policy at all, so this is the only way an
  order can exist — a tampered cart cannot buy a burger for 1 sen.
- **The receipt** at `/app/orders/[id]/receipt` is where a successful checkout
  lands. It prints what the *database* charged — line prices, subtotal, delivery fee
  and total read back out of `orders` / `order_items`, never the numbers the
  browser had in the cart. "Print receipt" uses the browser's own print dialog.
- **Cancelling** goes through `cancel_order()`, which only works while the order is
  still `pending`. That's why `orders` needs no update policy either.
- **Favourites and reorder**: heart a dish on the menu (`/app/favourites`), or hit
  "Order again" on a past order. Reorder re-reads today's menu rather than trusting
  the old receipt, so it uses current prices and skips anything sold out.

## The tables

| Table | Holds | Who can read it |
|---|---|---|
| `restaurant_settings` | delivery fee, minimum order, open/closed | everyone |
| `categories`, `menu_items` | the menu | everyone |
| `orders` | one row per checkout | its owner only |
| `order_items` | the lines, with name/price snapshotted at order time | the owner of the parent order |
| `favourites` | your hearted dishes | its owner only |

## Environment variables

Only three, all public (see `.env.example`): `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SITE_URL`.
No secret key is used anywhere — there is nothing here that must be hidden,
and `.env.local` is git-ignored anyway.

## Security model (the short version)

- `/app`, `/app/orders/[id]`, its `/receipt`, `/app/favourites` and `/checkout`
  verify your identity **on the server** and redirect signed-out visitors.
- Row Level Security in Postgres is the real access control: another user cannot
  read your orders even by calling the API directly.
- Money is never computed in the browser. `place_order()` is the single source of
  truth for what an order costs.
- Everything you type is rendered as plain text — never as HTML.

## Deploying (Module 7)

Deploys to Vercel Hobby from a GitHub fork. Set the three env vars in Vercel
(`NEXT_PUBLIC_SITE_URL` = your `*.vercel.app` URL), deploy, then set the same URL
as the Site URL in Supabase Auth settings. The `/prepare-deployment` skill walks
the whole checklist.
