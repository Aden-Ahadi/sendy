# CLAUDE.md

Guidance for working in this codebase. Read this before making changes.

---

## What this project is

Sendy is a bulk email platform for Huawei ICT Academy. Users log in, create campaigns through a rich-text editor, upload a CSV of recipients, and send personalized emails via SMTP. Campaigns and delivery logs are stored in Supabase.

---

## Architecture

Email sending does **not** go through the Node.js backend in production. It runs inside a Supabase Edge Function (`supabase/functions/campaigns-send/index.ts`). The Node `src/` tree is a legacy CLI tool kept for local batch sending.

```
Browser → Supabase Auth
Browser → Supabase Edge Functions (campaign CRUD, send)
Edge Function → SMTP (Nodemailer inside Deno)
Frontend hosted on Vercel
```

---

## Environment variables

Two separate sets of env vars exist:

**`.env`** — used by the local Node API server and the frontend dev proxy. Not read by Edge Functions.

**Supabase secrets** — read by Edge Functions via `Deno.env.get(...)`. Must be pushed separately:

```bash
npx supabase secrets set KEY=value
npx supabase secrets list   # verify
```

If you change a sender name, SMTP credential, or any variable that the Edge Function reads, update both `.env` **and** Supabase secrets.

---

## Frontend

- Framework: React 19 + Vite + Tailwind v4
- Location: `frontend/`
- Dev server: `npm run dev` (runs `npm --prefix frontend run dev`)

### Tailwind dark mode

Dark mode is toggled by adding `.dark` to `document.documentElement`. Tailwind is configured with:

```css
@custom-variant dark (&:is(.dark *));
```

Use `dark:` prefixes throughout. Never hardcode dark colors without the `dark:` counterpart.

### Theme

Warm dark palette — do not introduce cool grays or pure blacks/whites without reason:

| Token | Light | Dark |
|---|---|---|
| Canvas | `#f9f7f3` | `#141412` |
| Card | white | `#1c1b19` |
| Sidebar | `#202020` | `#0f0e0c` |
| Foreground | `#202020` | `#edeae4` |
| Muted | `#8d8d8d` | `#8a8680` |
| Brand | `#ea2804` | `#ea2804` |

### Key components

| File | Purpose |
|---|---|
| `Layout.jsx` | Fixed sidebar + scrollable main. Calls `useLenis()`. |
| `EmailEditor.jsx` | Tiptap rich-text editor for email body |
| `ThemeToggle.jsx` | Fixed top-right toggle; accepts `className` to reposition |
| `DesktopGate.jsx` | Blocks access on viewports < 1024px, shows sign-out |
| `icons.jsx` | Custom SVG icons: `EnvelopeIcon`, `UserBadgeIcon`, `BroadcastIcon` |
| `useTheme.js` | Reads/writes `localStorage('theme')`, syncs `.dark` class |
| `useLenis.js` | Smooth scroll via Lenis; targets window (not an element) |

### Sidebar layout

The sidebar is `position: fixed`. The main content uses `marginLeft: sidebarWidth` so the **body** scrolls (required for Lenis to work). Do not add `overflow-y: auto` to the main element.

---

## Supabase Edge Functions

Located in `supabase/functions/`. Each function is a Deno TypeScript module.

- `campaigns-send` — the most important one. Reads SMTP config from `Deno.env`, sends emails via Nodemailer-for-Deno, updates campaign status in Postgres.
- `campaigns-list`, `campaign-detail`, `campaign-logs`, `campaign-delete` — CRUD wrappers.

To redeploy a function after changes:

```bash
npx supabase functions deploy <function-name>
```

---

## Email templates

`templates/email.html` and `templates/email-simple.html`.

Placeholders: `{{Name}}`, `{{Email}}`, `{{Year}}`.

Inline image: `<img src="cid:inline-image">` — the Edge Function attaches the image from `INLINE_IMAGE_URL`.

Keep templates email-client safe: inline CSS only, no external stylesheets, media queries are fine for modern clients (Gmail app, Apple Mail).

---

## Common tasks

### Change sender name

1. Edit `SENDER_NAME` in `.env`
2. Push to Supabase: `npx supabase secrets set SENDER_NAME="New Name"`

### Add a new page

1. Create `frontend/src/pages/MyPage.jsx`
2. Add a `<Route>` in `App.jsx` inside the `ProtectedRoute` block
3. Add a `NavItem` in `Layout.jsx` if it needs sidebar navigation

### Add a new Edge Function

1. Create `supabase/functions/<name>/index.ts`
2. Deploy: `npx supabase functions deploy <name>`
3. Call it from the frontend via `supabase.functions.invoke('<name>', { body })`

---

## Things to avoid

- Do not use `overflow-y: auto` on the main content element — it breaks Lenis smooth scroll.
- Do not hardcode colors without dark mode counterparts.
- Do not update only `.env` for SMTP/sender changes — the Edge Function won't see them.
- The Phosphor icon `size` prop does not work on custom SVG icons in `icons.jsx` — use `className="w-5 h-5"` instead.
- Do not run `npx vite build` on Windows in this project — it crashes due to native memory limits. Use the dev server instead and verify via HTTP.
