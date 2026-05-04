# JillJill Phases B & C — Realistic Icons + Backend (Form, Mailer, Chatbot) — Design Spec

**Status:** Approved (2026-05-04)
**Author:** Claude Opus 4.7 (driving) + Vimal Raj (decisions)
**Builds on:** [Phase A spec](2026-05-02-phase-a-content-and-image-refresh-design.md) — committed `04e65b2`, executed in 18 commits ending `777c398`.

## 1. Goal

Take the JillJill B2B landing page from a polished but read-only marketing surface (post-Phase A) to a fully interactive lead-generation surface:

1. **Phase B** — replace 12 cartoon emoji icons with consistent realistic SVGs.
2. **Phase C1** — clean up the orphaned `backend/` directory and lay the groundwork for serverless functions on the existing Vercel deploy.
3. **Phase C2** — add a B2B contact form that sends qualified leads to vimal@vimsenterprise.com via Zoho SMTP, gated by anti-spam.
4. **Phase C3** — add an LLM chatbot that answers visitor questions in JillJill voice and nudges high-intent visitors toward the contact form.

Ship in three commits-of-commits, in that order, on `main`. Each phase is independently shippable.

## 2. Context

- Repo is a static HTML/CSS/vanilla-ES6 site (no bundler, no framework).
- Already linked to Vercel project `jilljill-landing-page` (`prj_brmCZ4WmZnBNiF3FKVn9UM1cIJ81`). [vercel.json](../../../vercel.json) sets `outputDirectory: "."` and disables a build step.
- An orphan `backend/` directory exists on disk (untracked) containing only `node_modules/` and a `.env` file. The `.env` carries a real Neon Postgres connection string and a placeholder JWT_SECRET. There is no `package.json`, no source code. Treat as garbage to delete.
- The user's Zoho SMTP password and Neon database password were both pasted in chat at various points. **Both are considered compromised and MUST be rotated before C2/C3 go live in production.** No code in this spec contains either credential; all secrets live in Vercel env vars.
- A Phase A pre-existing-work stash exists (`stash@{0}: pre-phase-a-snapshot (2026-05-02T1558)`). Phases B & C must not collide with it. Likely-overlap files: `index.html`, `css/components.css`, `js/main.js`. The stash should ideally be popped before Phase C2 starts so any conflicts are resolved while context is fresh.

## 3. Decisions made during brainstorming

| ID | Decision | Reason |
|---|---|---|
| **D1** | Icon library: **Lucide** outline, 1.5px stroke | Most popular, MIT, full coverage of needed icons (subway, building, plane, dumbbell, hand, ban, etc.), matches dark-glass aesthetic. |
| **D2** | Icon embedding: **inline SVG** with `stroke="currentColor"` | Zero HTTP requests, recolorable via existing CSS, same pattern as Jil-disc SVG already in repo. |
| **D3** | Icon size: 48×48px in a flex-centered container, stroke 1.5 | Matches the visual weight of the emojis being replaced (~3rem). |
| **D4** | Backend reset: **delete `backend/` entirely**, scaffold `api/` for Vercel Functions | Native to existing Vercel deploy, no separate hosting, no CORS, free tier. |
| **D5** | `.gitignore` additions: `**/.env`, `**/.env.local`, `node_modules/`, `api/node_modules/` | Prevent the leaked `backend/.env` (and any future `.env`) from being committable. |
| **D6** | Form fields: **8-field qualified-lead form** | Company, Name, Email, Phone, City, Package, Bottle quantity, Message. Matches the three pricing tiers exactly. |
| **D7** | Submission destination: **email-only via Zoho SMTP** | MVP — Vimal manages leads in his inbox. DB persistence is Phase D. |
| **D8** | Anti-spam: **honeypot + per-IP rate limit + Vercel BotID** | Honeypot is free, rate limit prevents flood, BotID catches sophisticated bots invisibly. |
| **D9** | Chatbot kind: **LLM via Vercel AI Gateway + Claude Haiku 4.5** | At ~50 chats/day, cost is ~$2-5/mo. Massive UX upgrade over rule-based. |
| **D10** | Chatbot UI: **floating bottom-right button → 380×560 panel** | Universal convention; mobile becomes full-screen takeover. |
| **D11** | Chatbot transport: **streaming SSE** via Vercel AI SDK v6 | Users see typing as it arrives. |
| **D12** | Chatbot grounding: **system prompt with the page content baked in** | Stateless backend, ~2,500-token system prompt every request. Gateway prompt-cache will absorb the cost. |
| **D13** | Cost guard: **daily budget cap in Vercel Runtime Cache** | If daily LLM spend exceeds threshold, chatbot returns "I'm taking a break — please use the contact form" instead of calling the model. |
| **D14** | Rollout: **B → C1+C2 → C3**, each as its own batch of commits | Each phase shippable independently; Phase B is zero-risk. |

## 4. Out of scope (Phase D candidates)

- Lead persistence to Neon Postgres + admin dashboard.
- Multilingual chatbot (Hindi, regional languages).
- File uploads in the contact form (logo, brief PDF).
- Calendar booking integration (Cal.com / Calendly).
- Payment processing.
- Soft-launch A/B copy testing.
- Email autoresponder to the lead (in addition to the alert to Vimal).

## 5. Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  STATIC FRONTEND (index.html + css + js)                    │
│                                                             │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐ │
│  │ Lucide SVGs │  │ Contact form │  │ Chatbot widget     │ │
│  │ (Phase B)   │  │ (Phase C2)   │  │ (Phase C3)         │ │
│  │             │  │              │  │  - floating button │ │
│  │ inline      │  │ POST JSON    │  │  - panel           │ │
│  │             │  │ to /api/...  │  │  - streams SSE     │ │
│  └─────────────┘  └──────┬───────┘  └─────────┬──────────┘ │
└─────────────────────────────────────────────│──────────────┘
                                  │           │
                                  ▼           ▼
┌─────────────────────────────────────────────────────────────┐
│  VERCEL FUNCTIONS  (api/)                                   │
│                                                             │
│  ┌────────────────────┐    ┌────────────────────────────┐  │
│  │ POST /api/contact  │    │ POST /api/chat (SSE)       │  │
│  │  - zod validate    │    │  - Vercel AI SDK v6        │  │
│  │  - honeypot check  │    │  - Gateway: anthropic/     │  │
│  │  - BotID check     │    │      claude-haiku-4-5      │  │
│  │  - rate limit      │    │  - rate limit              │  │
│  │  - nodemailer →    │    │  - daily budget cap        │  │
│  │      Zoho SMTP     │    │  - JillJill system prompt  │  │
│  └────────────────────┘    └────────────────────────────┘  │
│                                                             │
│  ENV: ZOHO_USER  ZOHO_PASS  ZOHO_FROM  ZOHO_TO              │
│       AI_GATEWAY_API_KEY (auto)                             │
└─────────────────────────────────────────────────────────────┘
```

## 6. Phase B — icon swap

### 6.1 Icon mapping

| HTML location | Class | Old emoji | Lucide name |
|---|---|---|---|
| Solution `#solution`, line 223 | `solution-point-icon` | ✋ | `hand` |
| Solution `#solution`, line 230 | `solution-point-icon` | 🚫 | `ban` |
| Solution `#solution`, line 237 | `solution-point-icon` | 🚶 | `footprints` |
| Solution `#solution`, line 244 | `solution-point-icon` | 💧 | `droplets` |
| Vending `#vending`, line 352 | `vending-feature-icon` | 🚇 | `train-front-tunnel` |
| Vending `#vending`, line 356 | `vending-feature-icon` | 🏢 | `building-2` |
| Vending `#vending`, line 360 | `vending-feature-icon` | 🏬 | `store` |
| Vending `#vending`, line 364 | `vending-feature-icon` | ✈️ | `plane` |
| Vending `#vending`, line 368 | `vending-feature-icon` | 🚂 | `train-front` |
| Vending `#vending`, line 372 | `vending-feature-icon` | 🏥 | `hospital` |
| Vending `#vending`, line 376 | `vending-feature-icon` | 🏋️ | `dumbbell` |
| Vending `#vending`, line 380 | `vending-feature-icon` | 🎓 | `graduation-cap` |

(Line numbers may shift slightly by the time the implementer runs; locate by class + emoji.)

### 6.2 SVG inline pattern

Each emoji is replaced with the Lucide SVG (24×24 viewBox, stroke 1.5) wrapped to render at 48px in the existing icon container. The SVG carries `stroke="currentColor"` so the section's existing color rules continue to apply.

```html
<div class="solution-point-icon">
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
       fill="none" stroke="currentColor" stroke-width="1.5"
       stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <!-- Lucide path data for the chosen icon -->
  </svg>
</div>
```

### 6.3 CSS adjustments

In [css/components.css](../../../css/components.css), add a small block ensuring the inline SVG fills the container correctly and inherits the right size:

```css
/* === Phase B — Inline Lucide icons === */
.solution-point-icon svg,
.vending-feature-icon svg {
  width: 100%;
  height: 100%;
  max-width: 48px;
  max-height: 48px;
}
```

The existing `.solution-point-icon` and `.vending-feature-icon` rules already set the wrapper size, color, and centering — those stay as-is.

### 6.4 Acceptance

- All 12 emojis replaced; `grep -E "[\u{1F300}-\u{1FAFF}]" index.html` returns no matches in those two sections.
- Icons render at the same visual weight as the emojis.
- Hover states (existing) still apply via `currentColor`.
- Playwright snapshot of Solution and Vending sections looks consistent.

## 7. Phase C1 — Backend reset

### 7.1 Cleanup

1. Delete entire `backend/` directory (`rm -rf backend/`). Confirms no source code is lost (it has none).
2. Add to [.gitignore](../../../.gitignore):
   ```
   # Secrets
   **/.env
   **/.env.local
   **/.env.*.local

   # Node modules (any depth)
   **/node_modules/
   ```

### 7.2 Scaffold

3. Create `api/` directory.
4. Create `api/package.json`:
   ```json
   {
     "name": "jilljill-api",
     "version": "1.0.0",
     "type": "module",
     "private": true,
     "dependencies": {
       "ai": "^6.0.0",
       "nodemailer": "^7.0.0",
       "zod": "^4.0.0"
     }
   }
   ```
5. Run `cd api && npm install` to populate `api/node_modules/` (gitignored).

No source code in this phase; that comes in C2 and C3.

### 7.3 Acceptance

- `backend/` is gone.
- `git status` shows `.gitignore` modified, `api/package.json` and `api/package-lock.json` untracked but not ignored.
- `git check-ignore backend/.env` returns the file (it's ignored), but the file no longer exists anyway.

## 8. Phase C2 — Contact form + Zoho mailer

### 8.1 Frontend — replace existing CTA form

Current [index.html](../../../index.html) has a CTA section (`#cta`) with a simple newsletter-style form. Replace its inner form markup with the 8-field B2B form.

#### 8.1.1 Markup

```html
<form id="contactForm" class="contact-form" novalidate>
  <div class="form-row">
    <label class="form-field">
      <span class="form-label">Company name</span>
      <input type="text" name="company" required maxlength="120" autocomplete="organization">
    </label>
    <label class="form-field">
      <span class="form-label">Your name</span>
      <input type="text" name="name" required maxlength="80" autocomplete="name">
    </label>
  </div>
  <div class="form-row">
    <label class="form-field">
      <span class="form-label">Work email</span>
      <input type="email" name="email" required maxlength="160" autocomplete="email">
    </label>
    <label class="form-field">
      <span class="form-label">Phone</span>
      <input type="tel" name="phone" required maxlength="20" autocomplete="tel">
    </label>
  </div>
  <div class="form-row">
    <label class="form-field">
      <span class="form-label">City</span>
      <input type="text" name="city" required maxlength="60" autocomplete="address-level2">
    </label>
    <label class="form-field">
      <span class="form-label">Interested package</span>
      <select name="package" required>
        <option value="">Choose one…</option>
        <option value="starter">Starter — 1,000 bottles</option>
        <option value="business">Business — 25,000 bottles</option>
        <option value="enterprise">Enterprise — 50,000+ bottles</option>
        <option value="not_sure">Not sure yet</option>
      </select>
    </label>
  </div>
  <label class="form-field">
    <span class="form-label">Estimated bottle quantity</span>
    <input type="number" name="quantity" required min="1" max="10000000" step="1" inputmode="numeric">
  </label>
  <label class="form-field">
    <span class="form-label">Tell us about your campaign</span>
    <textarea name="message" required maxlength="2000" rows="5"></textarea>
  </label>

  <!-- Honeypot — humans never see, bots fill -->
  <input type="text" name="website" tabindex="-1" autocomplete="off"
         style="position:absolute;left:-9999px;opacity:0;height:0;width:0;" aria-hidden="true">

  <button type="submit" class="btn btn-primary btn-mission">Send my brief</button>
  <p class="form-status" role="status" aria-live="polite"></p>
</form>
```

#### 8.1.2 JS (`js/contact-form.js`, new ES6 class wired in `js/main.js`)

```js
class ContactForm {
  constructor() {
    this.form = document.getElementById('contactForm');
    if (!this.form) return;
    this.status = this.form.querySelector('.form-status');
    this.submit = this.form.querySelector('button[type="submit"]');
    this.form.addEventListener('submit', this.onSubmit.bind(this));
  }

  setState(label, message, disabled) {
    this.submit.textContent = label;
    this.submit.disabled = disabled;
    this.status.textContent = message;
  }

  async onSubmit(e) {
    e.preventDefault();
    this.setState('Sending…', '', true);
    const payload = Object.fromEntries(new FormData(this.form));
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.ok) {
        this.form.reset();
        this.setState('Sent ✓', "Thanks — we'll be in touch within one business day.", true);
      } else {
        this.setState('Send my brief', data.error || 'Something went wrong. Please try again.', false);
      }
    } catch (err) {
      this.setState('Send my brief', 'Network error. Please try again.', false);
    }
  }
}
```

#### 8.1.3 CSS (in [css/components.css](../../../css/components.css))

A small block of `.contact-form`, `.form-row`, `.form-field`, `.form-label`, `.form-status` rules using existing design tokens. Inputs use `var(--glass-bg)` background, `var(--glass-border)` border, `var(--radius-md)` corners. Focus ring uses `var(--color-hope-gold)`.

### 8.2 Backend — `api/contact.ts`

```ts
import { z } from 'zod';
import nodemailer from 'nodemailer';

const Schema = z.object({
  company: z.string().min(1).max(120),
  name: z.string().min(1).max(80),
  email: z.string().email().max(160),
  phone: z.string().min(7).max(20),
  city: z.string().min(1).max(60),
  package: z.enum(['starter', 'business', 'enterprise', 'not_sure']),
  quantity: z.coerce.number().int().min(1).max(10_000_000),
  message: z.string().min(1).max(2000),
  website: z.string().max(0).optional(), // honeypot must be empty
});

export const config = { maxDuration: 10 };

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // 1. Parse + validate
  let payload;
  try {
    payload = Schema.parse(await req.json());
  } catch (err) {
    return Response.json({ ok: false, error: 'Invalid form data' }, { status: 400 });
  }

  // 2. Honeypot tripped — pretend success, drop the lead
  if (payload.website && payload.website.length > 0) {
    return Response.json({ ok: true });
  }

  // 3. Vercel BotID gate
  const botIdHeader = req.headers.get('x-vercel-botid-verification');
  if (botIdHeader === 'block') {
    return Response.json({ ok: false, error: 'Bot detected' }, { status: 403 });
  }

  // 4. Rate limit (per IP, 3 / 10 min) — uses Vercel Runtime Cache
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
  const rateLimitKey = `ratelimit:contact:${ip}`;
  const cache = await getRuntimeCache();
  const count = ((await cache.get<number>(rateLimitKey)) ?? 0) + 1;
  if (count > 3) {
    return Response.json({ ok: false, error: 'Too many submissions — please try again later.' }, { status: 429 });
  }
  await cache.set(rateLimitKey, count, { ttl: 600 });

  // 5. Send email via Zoho SMTP
  const transporter = nodemailer.createTransport({
    host: 'smtppro.zoho.in',
    port: 465,
    secure: true,
    auth: { user: process.env.ZOHO_USER!, pass: process.env.ZOHO_PASS! },
  });
  try {
    await Promise.race([
      transporter.sendMail({
        from: process.env.ZOHO_FROM!,
        to: process.env.ZOHO_TO!,
        replyTo: payload.email,
        subject: `[JillJill Lead] ${payload.company} — ${payload.package}`,
        text: formatPlain(payload, ip),
        html: formatHtml(payload, ip),
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('SMTP timeout')), 8_000)),
    ]);
  } catch (err) {
    console.error('SMTP failure:', err);
    return Response.json({ ok: false, error: 'We could not send your message right now. Please email us directly at vimal@vimsenterprise.com.' }, { status: 502 });
  }

  return Response.json({ ok: true });
}

function formatPlain(p: any, ip: string) { /* labelled fields, ISO timestamp, IP */ }
function formatHtml(p: any, ip: string)  { /* HTML version */ }
async function getRuntimeCache() { /* import from @vercel/functions */ }
```

### 8.3 Environment variables (Vercel Dashboard, NOT in code)

| Var | Value | Set after |
|---|---|---|
| `ZOHO_USER` | `vimal@vimsenterprise.com` | Always |
| `ZOHO_PASS` | (the rotated Zoho app password — NOT the leaked one) | After Zoho password rotation |
| `ZOHO_FROM` | `JillJill Leads <vimal@vimsenterprise.com>` | Always |
| `ZOHO_TO` | `vimal@vimsenterprise.com` | Always |

Add via `vercel env add` (CLI not currently installed — install with `npm i -g vercel` or use the Vercel dashboard UI).

### 8.4 Acceptance

- Submitting the form with valid data triggers an email visible in Vimal's inbox within ~5 seconds.
- Submitting with empty required fields shows inline validation errors (HTML5).
- Submitting with the honeypot filled returns 200 OK silently and no email arrives.
- Submitting >3 times in 10 minutes from the same IP returns 429.
- A Playwright test simulates a successful submission and asserts on the success message.

## 9. Phase C3 — LLM chatbot

### 9.1 Frontend — `js/chatbot.js` and markup append in `index.html`

Markup (appended just before the closing `</body>`):

```html
<button id="chatbotToggle" class="chatbot-toggle" aria-label="Open chat" aria-expanded="false">
  <svg><!-- Lucide message-circle --></svg>
</button>

<aside id="chatbotPanel" class="chatbot-panel" role="dialog" aria-modal="false"
       aria-labelledby="chatbotTitle" hidden>
  <header class="chatbot-header">
    <h3 id="chatbotTitle">Ask JillJill</h3>
    <button class="chatbot-close" aria-label="Close chat">×</button>
  </header>
  <div id="chatbotMessages" class="chatbot-messages" aria-live="polite"></div>
  <form id="chatbotComposer" class="chatbot-composer">
    <input type="text" name="prompt" placeholder="Ask about pricing, packages, distribution…" required maxlength="500">
    <button type="submit" aria-label="Send">↑</button>
  </form>
</aside>
```

JS class `Chatbot` (in `js/chatbot.js`, ~120 LOC) handles:
- Click toggle → show/hide panel, focus the input.
- Submit → append user message to thread, POST `{ messages: [...] }` to `/api/chat`, stream the assistant's response into a new bubble.
- Esc closes the panel; focus trap inside panel when open.
- Stores transcript in memory only (lost on page reload — acceptable for a landing page).
- Respects `prefers-reduced-motion` (no slide animation; instant show/hide).
- On detection of buying-intent phrases in the assistant's response (e.g., "want to talk to our team", "fill the contact form"), highlights the contact form and offers a "Jump to form" link in the panel.

### 9.2 CSS

A new file `css/chatbot.css` (or appended to [css/components.css](../../../css/components.css)) with:
- `.chatbot-toggle` — fixed bottom-right, 56×56px, Jil-yellow background, drop-shadow, pulsing ring (subtle; suppressed under reduced-motion).
- `.chatbot-panel` — fixed bottom-right, 380×560px on desktop, full-screen on mobile (≤640px), dark glass background, slide-up transition.
- `.chatbot-messages` — scroll container, user/assistant bubbles styled distinctly, max-width 85%.
- `.chatbot-composer` — sticky bottom of panel, input + send button.

### 9.3 Backend — `api/chat.ts`

```ts
import { streamText } from 'ai';

export const config = { maxDuration: 30 };

const SYSTEM_PROMPT = `You are JillJill's assistant on the JillJill landing page.

JillJill is India's first ad-funded water bottle company. Brands pay to put their
campaign on the bottle label; consumers get the bottle free or at low cost; ₹1
from every bottle funds water wells across rural India.

Pricing tiers:
- Starter: 1,000 bottles, single city, basic analytics, 4-week campaign
- Business: 25,000 bottles, single city + multi-location, full analytics, 8-week
- Enterprise: 50,000+ bottles, nationwide, custom campaign

Distribution channels: smart vending machines, authorized agents, partnerships
in metros, tech parks, transit hubs, gyms, hospitals, colleges across India.

YOUR JOB:
- Answer prospect questions warmly and concretely.
- Use the pricing tiers above. Never invent numbers.
- This is a pre-launch venture — do NOT claim "10 lakh bottles distributed" or
  any other historical scale; we're a young team building from the ground up.
- When the visitor shows buying interest (asks "how do I buy", "what's next",
  mentions a budget, or asks for a quote), invite them to fill the contact form
  on the page (you can mention "the contact form below" or "the Send my brief
  button").
- Stay on-topic: JillJill, ad-funded bottles, B2B campaigns, the social-impact
  mission. Politely redirect off-topic chat back to JillJill.
- Never collect PII inside the chat. If the visitor offers their email/phone,
  thank them and ask them to use the contact form so it goes to the right place.
- Keep responses under 100 words unless the question genuinely needs more.`;

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // Rate limit (per IP, 20 / 5 min)
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
  const cache = await getRuntimeCache();
  const rlKey = `ratelimit:chat:${ip}`;
  const count = ((await cache.get<number>(rlKey)) ?? 0) + 1;
  if (count > 20) {
    return Response.json({ error: 'Rate limited' }, { status: 429 });
  }
  await cache.set(rlKey, count, { ttl: 300 });

  // Daily budget guard
  const today = new Date().toISOString().slice(0, 10);
  const budgetKey = `budget:chat:${today}`;
  const spentTokens = (await cache.get<number>(budgetKey)) ?? 0;
  if (spentTokens > 1_000_000) { // ~$5/day at Haiku 4.5 prices
    return Response.json({ error: 'Daily budget exceeded — please use the contact form.' }, { status: 503 });
  }

  const { messages } = await req.json();

  const result = await streamText({
    model: 'anthropic/claude-haiku-4-5', // Vercel AI Gateway provider/model string
    system: SYSTEM_PROMPT,
    messages,
    maxOutputTokens: 600,
    onFinish: async ({ usage }) => {
      const used = (usage.inputTokens ?? 0) + (usage.outputTokens ?? 0);
      await cache.set(budgetKey, spentTokens + used, { ttl: 86_400 });
    },
  });

  return result.toTextStreamResponse();
}

async function getRuntimeCache() { /* import from @vercel/functions */ }
```

### 9.4 Acceptance

- Floating button visible on every section.
- Click opens panel, focus moves to input, Esc closes.
- Sending "what's the cheapest package?" returns a coherent answer mentioning Starter / 1,000 bottles within a few seconds, streaming.
- Sending an off-topic question ("what's the weather in Mumbai?") gets a polite redirect.
- Sending high-intent ("how do I sign up?") nudges toward the contact form.
- Network throttle test: streams partial response if user closes panel mid-stream.
- 21st request from the same IP within 5 min returns 429.
- A `prefers-reduced-motion` browser shows the panel without slide animation.

## 10. Testing strategy

| Phase | What | How |
|---|---|---|
| B | All 12 icons render at correct size, no console errors | Playwright: `expect(page.locator('#solution svg').count()).toBe(4)` etc. |
| C1 | `backend/` gone, `.gitignore` covers `.env`, `api/` exists | `git status` + `git check-ignore` assertions in shell |
| C2 (frontend) | Form submits valid data, shows success | Playwright fill + submit, mock `/api/contact` |
| C2 (backend) | Validation, honeypot, rate limit work | `curl` against deployed preview URL with crafted payloads |
| C2 (e2e) | Real submission to a test inbox | Manual: deploy to preview, fill form, check Zoho inbox |
| C3 (frontend) | Open panel, send, receive streaming reply | Playwright with mocked `/api/chat` returning canned SSE |
| C3 (backend) | Streaming works, rate limit triggers, budget guard triggers | `curl -N` test against preview with synthetic payloads |
| C3 (e2e) | Real chat against the LLM | Manual: deploy preview, ask 3 questions, verify tone + accuracy |

## 11. Rollout sequence

1. **Phase B** — single feature commit, push to main, Vercel auto-deploys, verify live.
2. Stop here; user confirms icons look right.
3. **Phase C1** — single chore commit (delete backend, gitignore, scaffold api/), push to main.
4. **Phase C2** — implement, commit, deploy to preview branch first, run e2e against preview, then merge to main.
5. **Add env vars** to Vercel after Zoho password rotation.
6. **Phase C3** — implement, commit, deploy to preview, smoke-test, merge to main.
7. **Daily monitoring window** — first week: Vercel dashboard for function errors, Zoho inbox for form leads, AI Gateway dashboard for chat usage. Roll back any phase that misbehaves.

## 12. Risk register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Leaked Zoho/Neon passwords used by attacker | High if not rotated | High (spam from Vimal's domain, DB exfil) | Rotate before C2 ships; document in spec; add gitignore in C1 |
| Form spam exceeds Zoho daily send quota | Medium | Medium (Zoho throttles legitimate emails) | Honeypot + BotID + rate limit; Zoho alerts on high volume |
| Chatbot generates harmful or off-brand response | Low | Medium (brand damage) | Strict system prompt, Haiku is highly steerable; monitor first week of transcripts |
| Chatbot daily spend overshoots budget | Low | Low ($) | Daily budget guard in cache; cap at ~$5/day equivalent |
| Vercel BotID not available on current plan | Medium | Low | Fallback to honeypot + rate limit only; Cloudflare Turnstile as Plan B |
| AI Gateway provider outage | Low | Medium (chatbot down) | Fail gracefully — show "I'm temporarily unavailable; use the contact form" |
| Stash pop conflicts with Phase B/C edits | Medium | Low | Pop stash before Phase C2 begins; resolve conflicts manually |

## 13. File summary

**New:**
- `api/package.json`, `api/contact.ts`, `api/chat.ts`
- `js/contact-form.js`, `js/chatbot.js`
- `css/chatbot.css` (or appended into `components.css`)

**Modified:**
- `index.html` — 12 icon swaps (Phase B), CTA-section form replacement (C2), chatbot widget markup (C3), 2 new `<script>` tags
- `css/components.css` — Lucide-icon sizing (B), `.contact-form` rules (C2), maybe `.chatbot-*` rules (C3)
- `js/main.js` — instantiate `new ContactForm()` and `new Chatbot()`
- `.gitignore` — env + node_modules patterns (C1)
- `vercel.json` — possibly add `functions: { "api/*.ts": { ... } }` runtime config; otherwise unchanged

**Deleted:**
- `backend/` (entire directory)

## 14. Done criteria

- All checklist items in §10 pass.
- Manual smoke test on production: Vimal receives a test lead within 1 minute of submission; chatbot answers a pricing question correctly.
- Vercel function logs show no 5xx errors for 24 hours after C2 ships and 24 hours after C3 ships.
- Both leaked passwords have been rotated and the new values exist only in Vercel env vars.
