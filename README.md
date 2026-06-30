# Sendy

A bulk email platform built for Huawei ICT Academy. Compose campaigns through a web UI, send personalized emails via SMTP, and track delivery — all in one place.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + Tailwind v4 |
| Auth & Database | Supabase (Postgres + Auth) |
| Email sending | Supabase Edge Functions + Nodemailer (SMTP) |
| Hosting | Vercel (frontend + API routes) |

---

## Getting started

### Prerequisites

- Node.js 18+
- A Supabase project
- SMTP credentials (Gmail App Password recommended)

### 1. Install dependencies

```bash
npm install
npm --prefix frontend install
```

### 2. Configure environment

Copy the example and fill in your values:

```bash
cp .env.example .env
```

Key variables:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key

# SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASS=your-app-password

# Sender identity
SENDER_NAME=HUAWEI ICT ACADEMY
SENDER_EMAIL=you@gmail.com
```

> Gmail requires an App Password, not your account password. Generate one at Google Account > Security > App Passwords.

### 3. Push secrets to Supabase

The Edge Function that sends emails reads secrets from Supabase, not from `.env`. Push them once:

```bash
npx supabase secrets set SMTP_HOST=smtp.gmail.com
npx supabase secrets set SMTP_PORT=587
npx supabase secrets set SMTP_USER=you@gmail.com
npx supabase secrets set SMTP_PASS=your-app-password
npx supabase secrets set SENDER_NAME="HUAWEI ICT ACADEMY"
npx supabase secrets set SENDER_EMAIL=you@gmail.com
```

Verify with:

```bash
npx supabase secrets list
```

### 4. Run locally

```bash
# Frontend dev server
npm run dev

# API server (if testing the Node backend)
npm run dev:api
```

---

## Project structure

```
sendy/
├── frontend/               # React app (Vite + Tailwind)
│   └── src/
│       ├── pages/          # Dashboard, NewCampaign, CampaignDetail, Login
│       ├── components/     # Layout, EmailEditor, ThemeToggle, DesktopGate, icons
│       └── lib/            # supabase client, useTheme, useLenis
│
├── src/                    # Node.js CLI / legacy email sender
│   ├── config/config.js
│   ├── services/emailService.js
│   └── utils/              # csvParser, logger, templateEngine
│
├── api/                    # Vercel serverless API routes
│   ├── campaigns/          # CRUD + send endpoints
│   └── health.js
│
├── supabase/
│   ├── functions/          # Edge Functions (campaigns-send, campaigns-list, etc.)
│   └── schema.sql          # Database schema
│
├── templates/
│   ├── email.html          # Full branded template
│   └── email-simple.html   # Minimal newsletter template
│
└── data/                   # CSV recipient files (not committed)
```

---

## Email templates

Two HTML templates live in `templates/`. Both use the same placeholder syntax:

| Placeholder | Resolves to |
|---|---|
| `{{Name}}` | Recipient name from CSV |
| `{{Email}}` | Recipient email |
| `{{Year}}` | Current year |

Inline images are embedded via `cid:inline-image`. Set `INLINE_IMAGE_URL` in `.env` to point at a local file or public URL.

---

## Sending limits

| Provider | Free daily limit | Recommended delay |
|---|---|---|
| Gmail | 500 | 2–3 s |
| Google Workspace | 2 000 | 2 s |
| Outlook (free) | 300 | 2 s |
| Office 365 | 10 000 | 1–2 s |

Configure in `.env`:

```env
EMAIL_DELAY=2000        # ms between sends
MAX_RETRY_ATTEMPTS=3
RETRY_DELAY=5000
```

---

## Deliverability checklist

- SPF, DKIM, and DMARC records configured on your sending domain
- Warm up a new domain gradually — start with small batches
- Always include an unsubscribe link in the email body
- Comply with CAN-SPAM / GDPR as applicable to your recipient list

---

## Security

- Never commit `.env` — it contains live credentials
- Use App Passwords instead of your main account password
- The `.env` file is in `.gitignore` by default

---

## License

MIT
