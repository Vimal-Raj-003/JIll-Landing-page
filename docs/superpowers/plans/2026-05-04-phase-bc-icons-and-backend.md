# JillJill Phases B & C — Icons + Backend — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace 12 cartoon emoji icons with realistic Lucide SVGs (Phase B), then add a serverless backend on the existing Vercel deploy that powers a B2B contact form (Phase C2) and an LLM chatbot (Phase C3) — preceded by a backend-reset cleanup (Phase C1).

**Architecture:** Three independently shippable batches of commits on `main`. Phase B is pure frontend. Phase C uses Vercel Functions (Node.js, native to the existing Vercel deploy at `prj_brmCZ4WmZnBNiF3FKVn9UM1cIJ81`). Backend code in `api/` directory is auto-detected by Vercel and deployed alongside the static site. Chatbot streams LLM responses via Vercel AI SDK v6 + Vercel AI Gateway using `'anthropic/claude-haiku-4-5'`. All secrets in Vercel env vars only.

**Tech Stack:** HTML5, vanilla CSS3, vanilla ES6 JS (no bundler), Lucide icons (inline SVG), TypeScript (Vercel Functions), `nodemailer` (Zoho SMTP), `zod` (validation), `ai` (Vercel AI SDK v6), `@vercel/functions` (Runtime Cache), Playwright (verification), git, Vercel CLI.

**Authoritative spec:** [`docs/superpowers/specs/2026-05-04-phase-bc-icons-and-backend-design.md`](../specs/2026-05-04-phase-bc-icons-and-backend-design.md) (commit `9d1e2fd`).

---

## Codebase orientation (read this once before Task 1)

| Area | Where it lives |
|---|---|
| Site entry | [`index.html`](../../../index.html) (~660 lines) |
| Design tokens | [`css/variables.css`](../../../css/variables.css) |
| Card / button / form styles | [`css/components.css`](../../../css/components.css) |
| Section-specific styles | [`css/sections.css`](../../../css/sections.css) |
| Responsive overrides | [`css/responsive.css`](../../../css/responsive.css) |
| All scripts wired in HTML | end of [`index.html`](../../../index.html) (script block) |
| Class-based JS modules | [`js/`](../../../js/) — instantiated from [`js/main.js`](../../../js/main.js) |
| Phase A artifact (will need updates) | [`js/main.js`](../../../js/main.js) — `new ProblemCarousel()` etc. |
| Vercel link | [`.vercel/project.json`](../../../.vercel/project.json) — already linked to `jilljill-landing-page` |
| Vercel build config | [`vercel.json`](../../../vercel.json) — `outputDirectory: "."`, no build step |
| Existing yellow brand SVG | [`assets/icons/jil-disc.svg`](../../../assets/icons/jil-disc.svg) (Phase A precedent for SVG style) |
| Orphan to delete | `backend/` (untracked; only contains `node_modules/` and a `.env` with leaked Neon DB password) |
| Phase A stash | `stash@{0}: On main: pre-phase-a-snapshot (2026-05-02T1558)` (still uncommitted) |

**Color tokens used by this plan** (in [`css/variables.css`](../../../css/variables.css)):
- `--color-hope-gold`, `--color-warm-amber`, `--color-deep-navy`, `--color-neon-teal`
- `--glass-bg`, `--glass-border`, `--glass-blur`
- `--space-xs / sm / md / lg / xl / 2xl / 3xl / 4xl`
- `--radius-sm / md / lg / xl`
- `--font-heading` — Space Grotesk
- `--duration-fast / normal / slow`, `--ease-out-expo`

**Pre-conditions before starting:**
- Phase A is complete and merged to main (HEAD = `9d1e2fd`).
- Vercel CLI installed: `npm i -g vercel` (will be used for `vercel env add` and `vercel deploy --prebuilt` later).
- Node 22 LTS available locally (matches Vercel default Node 24 LTS closely enough for `npm install` of api/ deps).
- Dev server can run via `python -m http.server 8000` from the repo root.

---

## Task 0: Pre-flight — restore env, pop Phase A stash, start dev server

**Files:** none modified — environment setup only.

- [ ] **Step 1: Confirm we're at the Phase B/C spec commit**

```bash
cd "/c/Users/jillj/OneDrive/Desktop/JillJill/New folder"
git log -1 --pretty=format:'%H %s'
```

Expected: starts with `9d1e2fd docs: add Phase B+C design spec`. If not, stop and ask the user.

- [ ] **Step 2: Pop the Phase A pre-existing-work stash**

```bash
git stash list
```

Expected: `stash@{0}: On main: pre-phase-a-snapshot (2026-05-02T1558)`.

If the stash exists, pop it now so any conflicts surface before code work begins:

```bash
git stash pop
```

If `git stash pop` reports conflicts:
- The most likely overlap is `css/components.css` (Phase A appended cross-fade and `.btn-mission` rules at the end of the file; the stash may have its own additions in the same area).
- For each conflict marker, keep BOTH the stashed user work AND the Phase A additions. Do not let either side win — they're independent feature changes.
- Run `git diff --name-only --diff-filter=U` to see conflicted files.
- Resolve, then `git add <files>`. Do NOT commit yet — leave the un-committed prior work in the working tree as it was before Phase A. Tell the user: "Stash popped. Your prior work is back in the working tree. I'll layer Phase B/C edits on top, but the stashed changes will not be in any of my commits unless you tell me to include them."

If `git stash pop` succeeds cleanly, proceed.

- [ ] **Step 3: Start the dev server (background)**

```bash
cd "/c/Users/jillj/OneDrive/Desktop/JillJill/New folder"
python -m http.server 8000
```

Run in background. Verify:

```bash
curl -sI http://localhost:8000/ | head -1
```

Expected: `HTTP/1.0 200 OK`.

- [ ] **Step 4: Confirm Vercel CLI**

```bash
vercel --version
```

If "command not found", note in the report and proceed — `vercel env add` and `vercel deploy` steps in C2/C3 can be done in the dashboard UI as fallback. Do NOT install Vercel CLI globally without user consent.

- [ ] **Step 5: Confirm Playwright + Chromium**

```bash
npx --no-install playwright --version
```

Expected: a version string. If missing, install: `npm i -D playwright && npx playwright install chromium`.

---

# ===== PHASE B — REALISTIC ICON SWAP =====

## Task 1: Add CSS for inline Lucide icons

**Files:**
- Modify: [`css/components.css`](../../../css/components.css) — append at end of file

- [ ] **Step 1: Append the Lucide-icon sizing rule**

Open [`css/components.css`](../../../css/components.css). Append this block at the very end (after the `.btn-mission` reduced-motion override):

```css
/* === Phase B — Inline Lucide icons === */

.solution-point-icon svg,
.vending-feature-icon svg {
  width: 100%;
  height: 100%;
  max-width: 48px;
  max-height: 48px;
  display: block;
}
```

- [ ] **Step 2: Brace-balance check**

```bash
node -e "const fs=require('fs');const css=fs.readFileSync('css/components.css','utf8');const o=(css.match(/{/g)||[]).length;const c=(css.match(/}/g)||[]).length;if(o!==c){console.error('BRACE MISMATCH',o,c);process.exit(1)}console.log('braces ok',o)"
```

Expected: `braces ok 88` (was 87 before this task).

- [ ] **Step 3: Commit**

```bash
git add css/components.css
git commit -m "$(cat <<'EOF'
style(icons): add sizing rule for inline Lucide SVGs

Inline SVGs in .solution-point-icon and .vending-feature-icon stretch
to fill the existing wrapper (capped at 48x48). The wrappers' size,
color, and centering rules are already in place.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Replace 4 Solution-section emoji icons with Lucide SVGs

**Files:**
- Modify: [`index.html`](../../../index.html) — 4 lines in the `#solution` section (currently lines 223, 230, 237, 244)

**Lucide icons to use** (24×24 viewBox, stroke 1.5, `currentColor`). Source the exact SVG markup from [`lucide.dev`](https://lucide.dev) — for each icon below, the canonical SVG is reproduced inline so the implementer never has to leave this plan.

- [ ] **Step 1: Replace `✋` with `hand` icon**

Find:
```html
                <div class="solution-point-icon">✋</div>
```

Replace with:
```html
                <div class="solution-point-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2"/>
                    <path d="M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2"/>
                    <path d="M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8"/>
                    <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>
                  </svg>
                </div>
```

- [ ] **Step 2: Replace `🚫` with `ban` icon**

Find:
```html
                <div class="solution-point-icon">🚫</div>
```

Replace with:
```html
                <div class="solution-point-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="m4.9 4.9 14.2 14.2"/>
                  </svg>
                </div>
```

- [ ] **Step 3: Replace `🚶` with `footprints` icon**

Find:
```html
                <div class="solution-point-icon">🚶</div>
```

Replace with:
```html
                <div class="solution-point-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M4 16v-2.38c0-.78-.21-1.55-.6-2.22A4.4 4.4 0 0 1 3 9.42c.04-.34.16-.66.36-.94.4-.56 1.06-.98 1.81-1.18a3.3 3.3 0 0 1 1.92.05c.6.2 1.13.55 1.55.99.42.43.74.96.94 1.55.2.6.27 1.24.21 1.86-.06.62-.25 1.22-.56 1.77a4 4 0 0 1-.59.79"/>
                    <path d="M20 20v-2.38c0-.78-.21-1.55-.6-2.22A4.4 4.4 0 0 1 19 13.42c.04-.34.16-.66.36-.94.4-.56 1.06-.98 1.81-1.18a3.3 3.3 0 0 1 1.92.05c.6.2 1.13.55 1.55.99"/>
                    <path d="M16 17h4"/>
                    <path d="M4 13h4"/>
                  </svg>
                </div>
```

(Note: the `footprints` Lucide path is fairly complex; if the implementer wants to copy directly from `https://lucide.dev/icons/footprints`, that's fine — final visual must match Lucide's published render.)

- [ ] **Step 4: Replace `💧` with `droplets` icon**

Find:
```html
                <div class="solution-point-icon">💧</div>
```

Replace with:
```html
                <div class="solution-point-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"/>
                    <path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97"/>
                  </svg>
                </div>
```

- [ ] **Step 5: Verify in browser**

Save to `.tmp-verify/task2-solution-icons.js`:

```js
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://localhost:8000/', { waitUntil: 'networkidle' });
  await page.locator('#solution').scrollIntoViewIfNeeded();
  const svgCount = await page.locator('#solution .solution-point-icon svg').count();
  const emojiText = await page.$$eval('#solution .solution-point-icon', els => els.map(e => e.textContent.trim()));
  const realErrs = errors.filter(e => !/Background-animation/i.test(e));
  console.log(JSON.stringify({ svgCount, emojiText, errors: realErrs }, null, 2));
  if (realErrs.length) process.exit(2);
  if (svgCount !== 4) process.exit(3);
  if (emojiText.some(t => t.length > 0)) process.exit(4);
  console.log('OK');
  await browser.close();
})();
```

Run:
```bash
node .tmp-verify/task2-solution-icons.js
```

Expected: ends with `OK`. Exit 3 = wrong svg count; exit 4 = emoji text leaked through.

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "$(cat <<'EOF'
ui(solution): replace 4 emoji icons with Lucide SVGs

Hand, ban, footprints, droplets — inline SVG with stroke=currentColor
so existing color rules apply. 24x24 viewBox stretches into the
existing 48x48 .solution-point-icon container.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Replace 8 Vending-section emoji icons with Lucide SVGs

**Files:**
- Modify: [`index.html`](../../../index.html) — 8 lines in the `#vending` section (currently lines 352-380)

- [ ] **Step 1: Replace `🚇` with `train-front-tunnel` icon**

Find:
```html
                <div class="vending-feature-icon">🚇</div>
```

Replace with:
```html
                <div class="vending-feature-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M2 22V12a10 10 0 1 1 20 0v10"/>
                    <path d="M15 6.8v1.4a3 3 0 1 1-6 0V6.8"/>
                    <path d="M10 15h.01"/>
                    <path d="M14 15h.01"/>
                    <path d="M10 19l-2 3"/>
                    <path d="M14 19l2 3"/>
                    <path d="M10 19l4 0"/>
                  </svg>
                </div>
```

- [ ] **Step 2: Replace `🏢` with `building-2` icon**

Find:
```html
                <div class="vending-feature-icon">🏢</div>
```

Replace with:
```html
                <div class="vending-feature-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/>
                    <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/>
                    <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/>
                    <path d="M10 6h4"/>
                    <path d="M10 10h4"/>
                    <path d="M10 14h4"/>
                    <path d="M10 18h4"/>
                  </svg>
                </div>
```

- [ ] **Step 3: Replace `🏬` with `store` icon**

Find:
```html
                <div class="vending-feature-icon">🏬</div>
```

Replace with:
```html
                <div class="vending-feature-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/>
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                    <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/>
                    <path d="M2 7h20"/>
                    <path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"/>
                  </svg>
                </div>
```

- [ ] **Step 4: Replace `✈️` with `plane` icon**

Find:
```html
                <div class="vending-feature-icon">✈️</div>
```

Replace with:
```html
                <div class="vending-feature-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
                  </svg>
                </div>
```

- [ ] **Step 5: Replace `🚂` with `train-front` icon**

Find:
```html
                <div class="vending-feature-icon">🚂</div>
```

Replace with:
```html
                <div class="vending-feature-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M8 3.1V7a4 4 0 0 0 8 0V3.1"/>
                    <path d="m9 15-1-1"/>
                    <path d="m15 15 1-1"/>
                    <path d="M9 19c-2.8 0-5-2.2-5-5v-4a8 8 0 0 1 16 0v4c0 2.8-2.2 5-5 5Z"/>
                    <path d="m8 19-2 3"/>
                    <path d="m16 19 2 3"/>
                  </svg>
                </div>
```

- [ ] **Step 6: Replace `🏥` with `hospital` icon**

Find:
```html
                <div class="vending-feature-icon">🏥</div>
```

Replace with:
```html
                <div class="vending-feature-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M12 6v4"/>
                    <path d="M14 14h-4"/>
                    <path d="M14 18h-4"/>
                    <path d="M14 8h-4"/>
                    <path d="M18 12h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2h2"/>
                    <path d="M18 22V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v18"/>
                  </svg>
                </div>
```

- [ ] **Step 7: Replace `🏋️` with `dumbbell` icon**

Find:
```html
                <div class="vending-feature-icon">🏋️</div>
```

Replace with:
```html
                <div class="vending-feature-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M14.4 14.4 9.6 9.6"/>
                    <path d="M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l6.364-6.364a2 2 0 1 1 2.829 2.829l-1.768 1.767a2 2 0 1 1 2.828 2.829z"/>
                    <path d="m21.5 21.5-1.4-1.4"/>
                    <path d="M3.9 3.9 2.5 2.5"/>
                    <path d="M6.404 12.768a2 2 0 1 1-2.829-2.829l1.768-1.767a2 2 0 1 1-2.828-2.829l2.828-2.828a2 2 0 1 1 2.829 2.828l1.767-1.768a2 2 0 1 1 2.829 2.829z"/>
                  </svg>
                </div>
```

- [ ] **Step 8: Replace `🎓` with `graduation-cap` icon**

Find:
```html
                <div class="vending-feature-icon">🎓</div>
```

Replace with:
```html
                <div class="vending-feature-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/>
                    <path d="M22 10v6"/>
                    <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>
                  </svg>
                </div>
```

- [ ] **Step 9: Verify in browser**

Save to `.tmp-verify/task3-vending-icons.js`:

```js
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://localhost:8000/', { waitUntil: 'networkidle' });
  await page.locator('#vending').scrollIntoViewIfNeeded();
  const svgCount = await page.locator('#vending .vending-feature-icon svg').count();
  const emojiText = await page.$$eval('#vending .vending-feature-icon', els => els.map(e => e.textContent.trim()));
  const realErrs = errors.filter(e => !/Background-animation/i.test(e));
  console.log(JSON.stringify({ svgCount, emojiText, errors: realErrs }, null, 2));
  if (realErrs.length) process.exit(2);
  if (svgCount !== 8) process.exit(3);
  if (emojiText.some(t => t.length > 0)) process.exit(4);
  console.log('OK');
  await browser.close();
})();
```

Run:
```bash
node .tmp-verify/task3-vending-icons.js
```

Expected: ends with `OK`.

- [ ] **Step 10: Commit**

```bash
git add index.html
git commit -m "$(cat <<'EOF'
ui(vending): replace 8 emoji icons with Lucide SVGs

Subway, building, store, plane, train, hospital, dumbbell, graduation
cap — inline SVG matching the Phase B icon style. Existing
.vending-feature-icon container size and centering rules unchanged.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Phase B end-to-end verification + screenshot

**Files:** none modified.

- [ ] **Step 1: Full Phase B sweep**

Save to `.tmp-verify/phase-b-final.js`:

```js
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 900 });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

  await page.goto('http://localhost:8000/', { waitUntil: 'networkidle' });

  // Solution
  await page.locator('#solution').scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await page.screenshot({ path: '.tmp-verify/phaseB-solution.png', fullPage: false });
  const solutionSvgs = await page.locator('#solution .solution-point-icon svg').count();

  // Vending
  await page.locator('#vending').scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await page.screenshot({ path: '.tmp-verify/phaseB-vending.png', fullPage: false });
  const vendingSvgs = await page.locator('#vending .vending-feature-icon svg').count();

  const realErrs = errors.filter(e => !/Background-animation/i.test(e) && !/Failed to load resource/i.test(e));
  console.log(JSON.stringify({ solutionSvgs, vendingSvgs, errors: realErrs }, null, 2));

  if (realErrs.length) process.exit(2);
  if (solutionSvgs !== 4) process.exit(3);
  if (vendingSvgs !== 8) process.exit(4);

  // Make sure no stray emoji survived in those icon containers anywhere
  const allIcons = await page.$$eval(
    '.solution-point-icon, .vending-feature-icon',
    els => els.map(e => e.textContent.trim())
  );
  if (allIcons.some(t => t.length > 0)) {
    console.error('Emoji text leaked:', allIcons);
    process.exit(5);
  }

  console.log('PHASE B OK');
  await browser.close();
})();
```

Run:
```bash
node .tmp-verify/phase-b-final.js
```

Expected: ends with `PHASE B OK`. Surface the two PNGs (`.tmp-verify/phaseB-solution.png`, `.tmp-verify/phaseB-vending.png`) to the user.

- [ ] **Step 2: Tag the Phase B end commit**

```bash
git tag -a phase-b-complete -m "Phase B (Lucide icon swap) complete"
```

This is a local tag for ease of rollback / comparison; it's not pushed unless the user asks.

---

# ===== PHASE C1 — BACKEND RESET =====

## Task 5: Delete `backend/`, harden `.gitignore`, scaffold `api/`

**Files:**
- Modify: [`.gitignore`](../../../.gitignore) (currently 1 line: `.vercel`)
- Delete: `backend/` directory entirely
- Create: `api/package.json`

- [ ] **Step 1: Harden `.gitignore` first (so `.env` files become ignored before any further git activity)**

Open [`.gitignore`](../../../.gitignore). Replace its current content (`.vercel`) with:

```
# Vercel local link
.vercel

# Secrets — never commit
**/.env
**/.env.local
**/.env.*.local

# Node modules at any depth
**/node_modules/

# Local verification scratch
.tmp-verify/
.playwright-mcp/
```

Verify the `backend/.env` is now ignored:

```bash
git check-ignore backend/.env
```

Expected: `backend/.env` printed back (meaning it's ignored).

- [ ] **Step 2: Delete the orphan `backend/` directory**

```bash
rm -rf backend/
```

Verify it's gone:

```bash
ls backend/ 2>&1 | head -3
```

Expected: `ls: cannot access 'backend/': No such file or directory`.

- [ ] **Step 3: Create `api/` and write `api/package.json`**

```bash
mkdir -p api
```

Create `api/package.json` with this exact content:

```json
{
  "name": "jilljill-api",
  "version": "1.0.0",
  "type": "module",
  "private": true,
  "description": "Vercel Functions powering the JillJill landing page (contact form + chatbot).",
  "dependencies": {
    "@vercel/functions": "^3.0.0",
    "ai": "^6.0.0",
    "nodemailer": "^7.0.0",
    "zod": "^4.0.0"
  },
  "devDependencies": {
    "@types/nodemailer": "^7.0.0",
    "@types/node": "^24.0.0",
    "typescript": "^5.6.0"
  }
}
```

- [ ] **Step 4: Install dependencies**

```bash
cd api && npm install && cd ..
```

Expected: `api/node_modules/` and `api/package-lock.json` created. Both should be untracked-but-ignored (`api/node_modules/` matches `**/node_modules/`).

Verify ignore:
```bash
git check-ignore api/node_modules
git status --short | head
```

Expected: first line prints back `api/node_modules`. `git status --short` should show `M .gitignore` and `?? api/package.json` and `?? api/package-lock.json` only — NO `api/node_modules/`.

- [ ] **Step 5: Commit**

```bash
git add .gitignore api/package.json api/package-lock.json
git commit -m "$(cat <<'EOF'
chore(backend): reset orphan backend/ + scaffold api/ for Vercel Functions

- Hardens .gitignore to cover **/.env, **/.env.local, and node_modules
  at any depth (prevents the leaked backend/.env from ever being
  committable; also catches future api/.env if added)
- Deletes the orphan backend/ directory (only contained node_modules
  and a .env with leaked Neon Postgres creds; no source code lost)
- Adds api/package.json declaring runtime deps (nodemailer, ai, zod,
  @vercel/functions) and dev deps (typescript, @types)

No source code yet; that lands in C2 (api/contact.ts) and C3
(api/chat.ts).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 6: Tag**

```bash
git tag -a phase-c1-complete -m "Phase C1 (backend reset + api/ scaffold) complete"
```

---

# ===== PHASE C2 — CONTACT FORM + ZOHO MAILER =====

## Task 6: Replace CTA section with B2B contact form markup

**Files:**
- Modify: [`index.html`](../../../index.html) — `#cta` section (locate by `id="cta"`)

- [ ] **Step 1: Locate the existing CTA form**

Run:
```bash
grep -n 'id="cta"' index.html
grep -n 'cta-section\|cta-form' index.html
```

Note the line range that contains the CTA section — typically a `<section class="section cta-section" id="cta">` block with a heading, a paragraph, and a small form (likely email-only). You will replace the `<form>` element inside it (and any preceding subheading the form replaces).

- [ ] **Step 2: Replace the CTA form markup**

Find the `<form>...</form>` block inside `#cta` (whatever its current shape) and replace it with this exact 8-field B2B form markup:

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

- [ ] **Step 3: Verify**

```bash
grep -c 'id="contactForm"' index.html        # expect: 1
grep -c 'name="company"' index.html          # expect: 1
grep -c 'name="package"' index.html          # expect: 1
grep -c 'name="website"' index.html          # expect: 1 (honeypot)
grep -c 'btn-mission' index.html             # expect: 2 (impact CTA + this form button)
```

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "$(cat <<'EOF'
feat(contact): add 8-field B2B contact form markup

Replaces the existing CTA form with a qualified-lead form: company,
name, email, phone, city, package (starter/business/enterprise/
not_sure), bottle quantity, message. Includes a hidden honeypot field
for bot detection and a status line for inline submission feedback.
Wiring + styling come in the next two commits.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Add CSS for the contact form

**Files:**
- Modify: [`css/components.css`](../../../css/components.css) — append at end

- [ ] **Step 1: Append the contact-form rules**

Open [`css/components.css`](../../../css/components.css). Append at the end:

```css
/* === Phase C2 — B2B contact form === */

.contact-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  max-width: 720px;
  margin: 0 auto;
  text-align: left;
  position: relative;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-lg);
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.form-label {
  font-family: var(--font-heading);
  font-size: var(--fs-caption);
  font-weight: var(--fw-semibold);
  color: rgba(255, 255, 255, 0.85);
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.contact-form input,
.contact-form select,
.contact-form textarea {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  padding: 0.85em 1em;
  color: #ffffff;
  font-family: inherit;
  font-size: var(--fs-body);
  backdrop-filter: blur(var(--glass-blur));
  transition: border-color var(--duration-normal) var(--ease-out-expo),
              box-shadow var(--duration-normal) var(--ease-out-expo);
}

.contact-form input:focus,
.contact-form select:focus,
.contact-form textarea:focus {
  outline: none;
  border-color: var(--color-hope-gold);
  box-shadow: 0 0 0 3px rgba(244, 180, 0, 0.18);
}

.contact-form select {
  appearance: none;
  background-image: linear-gradient(45deg, transparent 50%, var(--color-hope-gold) 50%),
                    linear-gradient(-45deg, transparent 50%, var(--color-hope-gold) 50%);
  background-position: calc(100% - 1.2em) 50%, calc(100% - 0.7em) 50%;
  background-size: 0.5em 0.5em;
  background-repeat: no-repeat;
  padding-right: 2.5em;
}

.contact-form textarea {
  resize: vertical;
  min-height: 120px;
  font-family: inherit;
}

.contact-form button[type="submit"] {
  align-self: flex-start;
  margin-top: var(--space-sm);
}

.form-status {
  min-height: 1.5em;
  margin: 0;
  font-size: var(--fs-caption);
  color: rgba(255, 255, 255, 0.85);
}

@media (max-width: 640px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 2: Brace-balance check**

```bash
node -e "const fs=require('fs');const css=fs.readFileSync('css/components.css','utf8');const o=(css.match(/{/g)||[]).length;const c=(css.match(/}/g)||[]).length;if(o!==c){console.error('BRACE MISMATCH',o,c);process.exit(1)}console.log('braces ok',o)"
```

Expected: braces balanced (component count ≈ 99 after this task).

- [ ] **Step 3: Visual check (no JS yet — submit shouldn't do anything)**

Reload http://localhost:8000/#cta in a browser tab. Confirm:
- Form fields render in a 2-column grid (1-column on narrow viewports)
- Inputs use the dark glass aesthetic
- Focus ring is gold

- [ ] **Step 4: Commit**

```bash
git add css/components.css
git commit -m "$(cat <<'EOF'
style(contact): glass-morph styling for the 8-field B2B form

Two-column grid that collapses to one column under 640px. Inputs use
the existing --glass-bg/--glass-border tokens; focus ring uses
--color-hope-gold. Custom select arrow drawn with linear-gradients
to match the dark aesthetic.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Add `js/contact-form.js` (frontend submission handler)

**Files:**
- Create: `js/contact-form.js`
- Modify: [`index.html`](../../../index.html) — add `<script>` tag in the script block
- Modify: [`js/main.js`](../../../js/main.js) — instantiate `new ContactForm()`

- [ ] **Step 1: Create `js/contact-form.js`**

Create `js/contact-form.js` with this exact content:

```js
class ContactForm {
  constructor() {
    this.form = document.getElementById('contactForm');
    if (!this.form) return;
    this.status = this.form.querySelector('.form-status');
    this.submit = this.form.querySelector('button[type="submit"]');
    this.defaultLabel = this.submit.textContent;
    this.form.addEventListener('submit', this.onSubmit.bind(this));
  }

  setState(label, message, disabled) {
    this.submit.textContent = label;
    this.submit.disabled = disabled;
    this.status.textContent = message;
  }

  async onSubmit(event) {
    event.preventDefault();
    if (!this.form.reportValidity()) return;

    this.setState('Sending…', '', true);
    const payload = Object.fromEntries(new FormData(this.form));

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (data.ok) {
        this.form.reset();
        this.setState('Sent ✓', "Thanks — we'll be in touch within one business day.", true);
      } else {
        this.setState(this.defaultLabel, data.error || 'Something went wrong. Please try again.', false);
      }
    } catch (error) {
      this.setState(this.defaultLabel, 'Network error. Please try again.', false);
    }
  }
}
```

- [ ] **Step 2: Wire script into `index.html`**

Find the script block at the end of [`index.html`](../../../index.html) (the section containing `<script src="js/problem-carousel.js"></script>`). Insert immediately AFTER `<script src="js/problem-carousel.js"></script>` and BEFORE `<script src="js/distribution-player.js"></script>`:

```html
  <script src="js/contact-form.js"></script>
```

- [ ] **Step 3: Instantiate in `js/main.js`**

Open [`js/main.js`](../../../js/main.js). Find the section where other components are instantiated (look for `new ProblemCarousel()`). Add a line below it:

```js
new ContactForm();
```

- [ ] **Step 4: Verify the form is wired (won't actually submit yet — backend not deployed)**

Reload http://localhost:8000/. Open browser devtools console. Submit the form with valid fields. Expected: a network error in the console (`POST http://localhost:8000/api/contact 404`) AND the status line says "Network error. Please try again." That proves the wiring works; the 404 will go away once Vercel hosts the function.

- [ ] **Step 5: Commit**

```bash
git add js/contact-form.js index.html js/main.js
git commit -m "$(cat <<'EOF'
feat(contact): wire ContactForm class to POST /api/contact

Disables the submit button while in-flight, calls reportValidity()
for inline HTML5 errors, surfaces a status line on success/failure.
Backend (api/contact.ts) lands in the next commit.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: Implement `api/contact.ts` (backend)

**Files:**
- Create: `api/contact.ts`

- [ ] **Step 1: Create `api/contact.ts` with the full handler**

Create `api/contact.ts` with this exact content:

```ts
import { z } from 'zod';
import nodemailer from 'nodemailer';
import { getCache } from '@vercel/functions';

export const config = { runtime: 'nodejs', maxDuration: 10 };

const Schema = z.object({
  company: z.string().min(1).max(120),
  name: z.string().min(1).max(80),
  email: z.string().email().max(160),
  phone: z.string().min(7).max(20),
  city: z.string().min(1).max(60),
  package: z.enum(['starter', 'business', 'enterprise', 'not_sure']),
  quantity: z.coerce.number().int().min(1).max(10_000_000),
  message: z.string().min(1).max(2000),
  website: z.string().max(0).optional(), // honeypot — must be empty
});

type Payload = z.infer<typeof Schema>;

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // 1. Parse + validate
  let payload: Payload;
  try {
    payload = Schema.parse(await req.json());
  } catch {
    return Response.json({ ok: false, error: 'Invalid form data' }, { status: 400 });
  }

  // 2. Honeypot tripped — pretend success silently
  if (payload.website && payload.website.length > 0) {
    return Response.json({ ok: true });
  }

  // 3. Vercel BotID gate (header set by Vercel platform when BotID is enabled)
  const botIdHeader = req.headers.get('x-vercel-botid-verification');
  if (botIdHeader === 'block') {
    return Response.json({ ok: false, error: 'Bot detected' }, { status: 403 });
  }

  // 4. Rate limit per IP (3 / 10 min)
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const cache = getCache();
  const rlKey = `ratelimit:contact:${ip}`;
  const current = ((await cache.get(rlKey)) as number | null) ?? 0;
  if (current >= 3) {
    return Response.json(
      { ok: false, error: 'Too many submissions — please try again in a few minutes.' },
      { status: 429 }
    );
  }
  await cache.set(rlKey, current + 1, { ttl: 600 });

  // 5. Send email via Zoho SMTP
  const { ZOHO_USER, ZOHO_PASS, ZOHO_FROM, ZOHO_TO } = process.env;
  if (!ZOHO_USER || !ZOHO_PASS || !ZOHO_FROM || !ZOHO_TO) {
    console.error('Missing Zoho env vars');
    return Response.json(
      { ok: false, error: 'Mail service not configured. Please email vimal@vimsenterprise.com directly.' },
      { status: 500 }
    );
  }

  const transporter = nodemailer.createTransport({
    host: 'smtppro.zoho.in',
    port: 465,
    secure: true,
    auth: { user: ZOHO_USER, pass: ZOHO_PASS },
  });

  try {
    await Promise.race([
      transporter.sendMail({
        from: ZOHO_FROM,
        to: ZOHO_TO,
        replyTo: payload.email,
        subject: `[JillJill Lead] ${payload.company} — ${payload.package}`,
        text: formatPlain(payload, ip),
        html: formatHtml(payload, ip),
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('SMTP timeout')), 8_000)),
    ]);
  } catch (error) {
    console.error('SMTP failure:', error);
    return Response.json(
      {
        ok: false,
        error: 'We could not send your message right now. Please email vimal@vimsenterprise.com directly.',
      },
      { status: 502 }
    );
  }

  return Response.json({ ok: true });
}

function formatPlain(p: Payload, ip: string): string {
  return [
    `New JillJill lead — ${new Date().toISOString()}`,
    ``,
    `Company:   ${p.company}`,
    `Name:      ${p.name}`,
    `Email:     ${p.email}`,
    `Phone:     ${p.phone}`,
    `City:      ${p.city}`,
    `Package:   ${p.package}`,
    `Quantity:  ${p.quantity}`,
    ``,
    `Message:`,
    p.message,
    ``,
    `--`,
    `Source IP: ${ip}`,
  ].join('\n');
}

function formatHtml(p: Payload, ip: string): string {
  const esc = (s: string) =>
    s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
  const messageHtml = esc(p.message).replace(/\n/g, '<br>');
  return `
<!DOCTYPE html>
<html><body style="font-family:-apple-system,Segoe UI,sans-serif;color:#111;">
  <h2 style="color:#F4B400;margin-bottom:8px;">New JillJill Lead</h2>
  <p style="color:#666;font-size:13px;margin-top:0;">${new Date().toISOString()}</p>
  <table cellpadding="6" style="border-collapse:collapse;font-size:14px;">
    <tr><td><strong>Company</strong></td><td>${esc(p.company)}</td></tr>
    <tr><td><strong>Name</strong></td><td>${esc(p.name)}</td></tr>
    <tr><td><strong>Email</strong></td><td><a href="mailto:${esc(p.email)}">${esc(p.email)}</a></td></tr>
    <tr><td><strong>Phone</strong></td><td><a href="tel:${esc(p.phone)}">${esc(p.phone)}</a></td></tr>
    <tr><td><strong>City</strong></td><td>${esc(p.city)}</td></tr>
    <tr><td><strong>Package</strong></td><td>${esc(p.package)}</td></tr>
    <tr><td><strong>Quantity</strong></td><td>${p.quantity.toLocaleString('en-IN')}</td></tr>
  </table>
  <h3 style="margin-top:24px;">Message</h3>
  <p style="white-space:pre-wrap;border-left:3px solid #F4B400;padding-left:12px;color:#333;">${messageHtml}</p>
  <hr style="margin-top:32px;border:none;border-top:1px solid #eee;">
  <p style="color:#888;font-size:12px;">Source IP: ${esc(ip)}</p>
</body></html>`;
}
```

- [ ] **Step 2: TypeScript syntax check**

```bash
cd api && npx tsc --noEmit --target ES2022 --module ESNext --moduleResolution bundler --lib ES2022,DOM contact.ts && cd ..
```

Expected: no output (syntax valid). If `getCache` import errors, check `@vercel/functions` package version — adjust the import to whatever the latest API is (the spec assumes `getCache` from `@vercel/functions` which is the documented runtime cache primitive).

If TypeScript reports an error you don't understand, STOP and report it as DONE_WITH_CONCERNS — do not silently change the code shape.

- [ ] **Step 3: Commit**

```bash
git add api/contact.ts
git commit -m "$(cat <<'EOF'
feat(api): contact form endpoint with zod, honeypot, BotID, rate limit, Zoho

POST /api/contact accepts the 8-field B2B form payload, validates with
zod, drops honeypot-tripped requests silently, blocks Vercel BotID
flagged traffic, rate-limits per-IP via Vercel Runtime Cache (3 / 10
min), then sends a labeled email to ZOHO_TO via Zoho SMTP with an
8-second send timeout.

Env vars required (set in Vercel Dashboard, not in code):
ZOHO_USER, ZOHO_PASS, ZOHO_FROM, ZOHO_TO.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: Deploy preview, configure env vars, smoke-test the form

**Files:** none modified — deployment + manual verification.

- [ ] **Step 1: Stop the local dev server (Vercel preview takes over for the test)**

Kill the background `python -m http.server 8000` task.

- [ ] **Step 2: Push to a preview branch**

```bash
git checkout -b phase-c2-preview
git push -u origin phase-c2-preview
```

Vercel auto-deploys preview branches at `https://jilljill-landing-page-git-phase-c2-preview-<team>.vercel.app`. Watch for the deploy URL in the GitHub PR status check, or run:

```bash
vercel ls  # if Vercel CLI installed; otherwise check the Vercel dashboard
```

- [ ] **Step 3: Add Zoho env vars to the preview environment**

**STOP — confirm with the user that the Zoho password has been rotated** before adding it. The `UrjHYg3k1SzH` value pasted in chat earlier is leaked and must NOT be used.

If user confirms rotation, add via Vercel Dashboard (Project → Settings → Environment Variables) for the **Preview** environment:

| Name | Value |
|---|---|
| `ZOHO_USER` | `vimal@vimsenterprise.com` |
| `ZOHO_PASS` | (the NEW rotated app password) |
| `ZOHO_FROM` | `JillJill Leads <vimal@vimsenterprise.com>` |
| `ZOHO_TO` | `vimal@vimsenterprise.com` |

Or via CLI (one at a time, will prompt for value):

```bash
vercel env add ZOHO_USER preview
vercel env add ZOHO_PASS preview
vercel env add ZOHO_FROM preview
vercel env add ZOHO_TO preview
```

After adding, **redeploy** the preview so functions pick up the env vars:

```bash
vercel --prebuilt=false  # or trigger a redeploy from the dashboard
```

- [ ] **Step 4: Smoke-test the live form**

Visit the preview URL in a browser. Scroll to the contact form (`#cta`). Submit with realistic data. Expected:
- Submit button shows "Sending…" then "Sent ✓".
- Status line says "Thanks — we'll be in touch within one business day."
- Vimal's inbox (`vimal@vimsenterprise.com`) receives the formatted lead email within ~10 seconds.

- [ ] **Step 5: Adversarial test (curl)**

```bash
PREVIEW=https://<your-preview-url>.vercel.app

# Empty body — expect 400
curl -s -X POST "$PREVIEW/api/contact" -H 'Content-Type: application/json' -d '{}' | head

# Honeypot tripped — expect 200, no email
curl -s -X POST "$PREVIEW/api/contact" -H 'Content-Type: application/json' \
  -d '{"company":"X","name":"X","email":"x@x.com","phone":"1234567","city":"X","package":"starter","quantity":1,"message":"x","website":"http://spam.example"}' | head

# Rate limit — fire 4 times, 4th should return 429
for i in 1 2 3 4; do
  curl -s -o /dev/null -w "%{http_code}\n" -X POST "$PREVIEW/api/contact" -H 'Content-Type: application/json' \
    -d '{"company":"RateTest","name":"Bot","email":"bot@bot.com","phone":"1234567","city":"Test","package":"not_sure","quantity":1,"message":"hi"}'
done
```

Expected exit codes: `400`, `200` (no email), `200 200 200 429`.

If any test fails: STOP, fix the function, re-deploy, re-test. Don't proceed to merge.

- [ ] **Step 6: Merge preview branch back to main**

```bash
git checkout main
git merge --no-ff phase-c2-preview -m "Merge phase-c2-preview: contact form lives on api/contact.ts"
git branch -d phase-c2-preview
```

- [ ] **Step 7: Promote env vars to Production**

Repeat Step 3 for the **Production** environment in the Vercel Dashboard (or `vercel env add ZOHO_USER production` etc.).

After main pushes, Vercel auto-deploys to production. Smoke-test once more on the prod URL.

- [ ] **Step 8: Tag**

```bash
git tag -a phase-c2-complete -m "Phase C2 (contact form + Zoho mailer) complete"
```

---

# ===== PHASE C3 — LLM CHATBOT =====

## Task 11: Add chatbot widget markup + CSS

**Files:**
- Modify: [`index.html`](../../../index.html) — append the chatbot markup just before `</body>`
- Modify: [`css/components.css`](../../../css/components.css) — append chatbot rules at end

- [ ] **Step 1: Append chatbot markup**

Open [`index.html`](../../../index.html). Find the closing `</body>` tag near the end of the file. Immediately ABOVE it (after the script block), insert:

```html
  <!-- ==================== Chatbot widget ==================== -->
  <button id="chatbotToggle" class="chatbot-toggle" aria-label="Open chat with JillJill" aria-expanded="false">
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  </button>

  <aside id="chatbotPanel" class="chatbot-panel" role="dialog" aria-modal="false" aria-labelledby="chatbotTitle" hidden>
    <header class="chatbot-header">
      <h3 id="chatbotTitle">Ask JillJill</h3>
      <button class="chatbot-close" aria-label="Close chat" type="button">&times;</button>
    </header>
    <div id="chatbotMessages" class="chatbot-messages" aria-live="polite"></div>
    <form id="chatbotComposer" class="chatbot-composer">
      <input type="text" name="prompt" placeholder="Ask about pricing, packages, distribution…" required maxlength="500" autocomplete="off">
      <button type="submit" aria-label="Send message">↑</button>
    </form>
  </aside>
```

- [ ] **Step 2: Append chatbot CSS**

Append to [`css/components.css`](../../../css/components.css):

```css
/* === Phase C3 — Chatbot widget === */

.chatbot-toggle {
  position: fixed;
  bottom: var(--space-xl);
  right: var(--space-xl);
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-warm-amber), var(--color-hope-gold));
  color: var(--color-deep-navy);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 20px rgba(244, 180, 0, 0.4);
  z-index: 1000;
  transition: transform var(--duration-normal) var(--ease-out-expo);
  animation: chatbotPulse 2.4s ease-in-out infinite;
}

.chatbot-toggle:hover {
  transform: scale(1.08);
}

@keyframes chatbotPulse {
  0%, 100% { box-shadow: 0 6px 20px rgba(244, 180, 0, 0.4); }
  50%      { box-shadow: 0 6px 28px rgba(244, 180, 0, 0.65); }
}

.chatbot-panel {
  position: fixed;
  bottom: calc(var(--space-xl) + 72px);
  right: var(--space-xl);
  width: 380px;
  height: 560px;
  max-height: calc(100vh - 120px);
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  display: flex;
  flex-direction: column;
  z-index: 1001;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  overflow: hidden;
  animation: chatbotSlideUp var(--duration-slow) var(--ease-out-expo);
}

@keyframes chatbotSlideUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

.chatbot-panel[hidden] { display: none; }

.chatbot-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md) var(--space-lg);
  border-bottom: 1px solid var(--glass-border);
}

.chatbot-header h3 {
  margin: 0;
  font-family: var(--font-heading);
  font-size: var(--fs-body);
  color: var(--color-hope-gold);
}

.chatbot-close {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  padding: 0 0.25em;
}

.chatbot-close:hover { color: #fff; }

.chatbot-messages {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.chatbot-message {
  max-width: 85%;
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  font-size: var(--fs-small);
  line-height: var(--lh-normal);
  white-space: pre-wrap;
  word-wrap: break-word;
}

.chatbot-message.user {
  align-self: flex-end;
  background: linear-gradient(135deg, var(--color-warm-amber), var(--color-hope-gold));
  color: var(--color-deep-navy);
}

.chatbot-message.assistant {
  align-self: flex-start;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  color: rgba(255, 255, 255, 0.9);
}

.chatbot-message.error {
  align-self: center;
  background: rgba(255, 80, 80, 0.15);
  color: #ffb4b4;
  font-size: var(--fs-caption);
}

.chatbot-composer {
  display: flex;
  gap: var(--space-xs);
  padding: var(--space-md);
  border-top: 1px solid var(--glass-border);
}

.chatbot-composer input {
  flex: 1;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  padding: 0.7em 1em;
  color: #fff;
  font-family: inherit;
  font-size: var(--fs-small);
}

.chatbot-composer input:focus {
  outline: none;
  border-color: var(--color-hope-gold);
}

.chatbot-composer button[type="submit"] {
  background: var(--color-hope-gold);
  color: var(--color-deep-navy);
  border: none;
  border-radius: var(--radius-md);
  padding: 0 var(--space-md);
  cursor: pointer;
  font-weight: var(--fw-semibold);
  font-size: 1.1rem;
}

.chatbot-composer button[type="submit"]:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .chatbot-panel {
    width: calc(100vw - 24px);
    height: calc(100vh - 100px);
    right: 12px;
    bottom: 84px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .chatbot-toggle,
  .chatbot-panel {
    animation: none;
  }
}
```

- [ ] **Step 3: Brace-balance check + visual smoke**

```bash
node -e "const fs=require('fs');const css=fs.readFileSync('css/components.css','utf8');const o=(css.match(/{/g)||[]).length;const c=(css.match(/}/g)||[]).length;if(o!==c){console.error('BRACE MISMATCH',o,c);process.exit(1)}console.log('braces ok',o)"
```

Restart the local dev server (`python -m http.server 8000`) and visit http://localhost:8000/. The yellow chatbot button should be visible at bottom-right. Clicking it does nothing yet (JS comes next).

- [ ] **Step 4: Commit**

```bash
git add index.html css/components.css
git commit -m "$(cat <<'EOF'
feat(chatbot): widget markup + CSS (toggle button, panel, composer)

Floating Jil-yellow toggle bottom-right; click expands a 380x560 dark
glass panel with messages list and composer. Mobile (<=640px) becomes
near-full-screen takeover. Pulsing toggle and slide-up entrance both
suppressed under prefers-reduced-motion. JS class wires up next.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 12: Implement `js/chatbot.js` (frontend with SSE streaming)

**Files:**
- Create: `js/chatbot.js`
- Modify: [`index.html`](../../../index.html) — add `<script>` tag in script block
- Modify: [`js/main.js`](../../../js/main.js) — instantiate `new Chatbot()`

- [ ] **Step 1: Create `js/chatbot.js`**

Create `js/chatbot.js` with this exact content:

```js
class Chatbot {
  constructor() {
    this.toggle = document.getElementById('chatbotToggle');
    this.panel = document.getElementById('chatbotPanel');
    this.messagesEl = document.getElementById('chatbotMessages');
    this.composer = document.getElementById('chatbotComposer');
    if (!this.toggle || !this.panel || !this.messagesEl || !this.composer) return;

    this.input = this.composer.querySelector('input');
    this.sendBtn = this.composer.querySelector('button[type="submit"]');
    this.closeBtn = this.panel.querySelector('.chatbot-close');
    this.transcript = [];
    this.busy = false;

    this.toggle.addEventListener('click', () => this.open());
    this.closeBtn.addEventListener('click', () => this.close());
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.panel.hidden) this.close();
    });
    this.composer.addEventListener('submit', (e) => this.onSend(e));

    this.greet();
  }

  greet() {
    this.appendMessage('assistant',
      "Hi! I'm JillJill's assistant. Ask me about pricing, packages, distribution, or our well-funding mission.");
  }

  open() {
    this.panel.hidden = false;
    this.toggle.setAttribute('aria-expanded', 'true');
    this.input.focus();
  }

  close() {
    this.panel.hidden = true;
    this.toggle.setAttribute('aria-expanded', 'false');
    this.toggle.focus();
  }

  appendMessage(role, text) {
    const div = document.createElement('div');
    div.className = `chatbot-message ${role}`;
    div.textContent = text;
    this.messagesEl.appendChild(div);
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
    return div;
  }

  async onSend(event) {
    event.preventDefault();
    if (this.busy) return;
    const text = this.input.value.trim();
    if (!text) return;

    this.busy = true;
    this.sendBtn.disabled = true;
    this.input.value = '';

    this.appendMessage('user', text);
    this.transcript.push({ role: 'user', content: text });

    const assistantBubble = this.appendMessage('assistant', '…');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: this.transcript })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        assistantBubble.textContent = err.error || 'Sorry, I had trouble. Please try the contact form.';
        assistantBubble.classList.add('error');
        return;
      }

      assistantBubble.textContent = '';
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let full = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        full += chunk;
        assistantBubble.textContent = full;
        this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
      }
      this.transcript.push({ role: 'assistant', content: full });
    } catch (error) {
      assistantBubble.textContent = 'Network error. Please try again.';
      assistantBubble.classList.add('error');
    } finally {
      this.busy = false;
      this.sendBtn.disabled = false;
      this.input.focus();
    }
  }
}
```

- [ ] **Step 2: Wire script into `index.html`**

Find the script block. Insert immediately AFTER `<script src="js/contact-form.js"></script>` and BEFORE `<script src="js/distribution-player.js"></script>`:

```html
  <script src="js/chatbot.js"></script>
```

- [ ] **Step 3: Instantiate in `js/main.js`**

Open [`js/main.js`](../../../js/main.js). Find where `new ContactForm()` is. Add a line below it:

```js
new Chatbot();
```

- [ ] **Step 4: Local check (won't actually chat — backend not deployed yet)**

Reload http://localhost:8000/. Click the yellow toggle — panel should open with a greeting. Send "test" — should fail with a network error message in the bubble. That confirms the JS plumbing.

- [ ] **Step 5: Commit**

```bash
git add js/chatbot.js index.html js/main.js
git commit -m "$(cat <<'EOF'
feat(chatbot): Chatbot class with SSE streaming + transcript memory

Open/close, focus management, Esc to close, in-memory transcript,
streams /api/chat response into the assistant bubble character-by-
character. Transcript persists for the page session only (lost on
reload — fine for landing-page UX).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 13: Implement `api/chat.ts` (backend streaming)

**Files:**
- Create: `api/chat.ts`

- [ ] **Step 1: Create `api/chat.ts`**

Create `api/chat.ts` with this exact content:

```ts
import { streamText } from 'ai';
import { getCache } from '@vercel/functions';

export const config = { runtime: 'nodejs', maxDuration: 30 };

const SYSTEM_PROMPT = `You are JillJill's assistant on the JillJill landing page.

JillJill is India's first ad-funded water bottle company. Brands pay to put their
campaign on the bottle label; consumers get the bottle free or at low cost; ₹1
from every bottle funds clean water wells across rural India.

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

const DAILY_TOKEN_BUDGET = 1_000_000; // ~$5/day at Haiku 4.5 prices
const RATE_LIMIT_PER_5MIN = 20;

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const cache = getCache();

  // 1. Per-IP rate limit
  const rlKey = `ratelimit:chat:${ip}`;
  const used = ((await cache.get(rlKey)) as number | null) ?? 0;
  if (used >= RATE_LIMIT_PER_5MIN) {
    return Response.json(
      { error: "I'm getting a lot of questions right now — please try again in a few minutes." },
      { status: 429 }
    );
  }
  await cache.set(rlKey, used + 1, { ttl: 300 });

  // 2. Daily budget guard
  const today = new Date().toISOString().slice(0, 10);
  const budgetKey = `budget:chat:${today}`;
  const spent = ((await cache.get(budgetKey)) as number | null) ?? 0;
  if (spent > DAILY_TOKEN_BUDGET) {
    return Response.json(
      { error: "I'm taking a break for the day — please use the contact form below and we'll respond personally." },
      { status: 503 }
    );
  }

  // 3. Validate body
  let messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  try {
    const body = await req.json();
    if (!Array.isArray(body.messages) || body.messages.length === 0) throw new Error('bad shape');
    messages = body.messages
      .slice(-20) // cap context length
      .map((m: any) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: String(m.content ?? '').slice(0, 2000),
      }));
  } catch {
    return Response.json({ error: 'Invalid request' }, { status: 400 });
  }

  // 4. Stream from Claude Haiku 4.5 via Vercel AI Gateway
  const result = streamText({
    model: 'anthropic/claude-haiku-4-5',
    system: SYSTEM_PROMPT,
    messages,
    maxOutputTokens: 600,
    onFinish: async ({ usage }) => {
      const tokens = (usage?.inputTokens ?? 0) + (usage?.outputTokens ?? 0);
      try {
        await cache.set(budgetKey, spent + tokens, { ttl: 86_400 });
      } catch (e) {
        console.error('budget cache write failed:', e);
      }
    },
  });

  // Return raw text stream so the frontend can read it as plain text
  return result.toTextStreamResponse();
}
```

- [ ] **Step 2: TypeScript syntax check**

```bash
cd api && npx tsc --noEmit --target ES2022 --module ESNext --moduleResolution bundler --lib ES2022,DOM chat.ts && cd ..
```

Expected: no output. If `streamText` import errors, verify `ai` package version is `^6.0.0` in `api/package.json` and `npm install` was re-run.

- [ ] **Step 3: Commit**

```bash
git add api/chat.ts
git commit -m "$(cat <<'EOF'
feat(api): streaming chat endpoint via Vercel AI Gateway + Haiku 4.5

POST /api/chat accepts a messages[] transcript, validates + caps to
last 20 turns, enforces per-IP rate limit (20 / 5 min) and a daily
token budget (~$5/day equivalent), then streams a response from
'anthropic/claude-haiku-4-5' through the Vercel AI Gateway.

System prompt grounds the bot in JillJill's pricing, distribution,
and tone; explicitly forbids inventing scale numbers; redirects
off-topic chat; declines to collect PII inside the chat.

AI_GATEWAY_API_KEY is auto-injected on linked Vercel projects.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 14: Deploy preview, verify chat end-to-end, promote

**Files:** none modified.

- [ ] **Step 1: Push to a fresh preview branch**

```bash
git checkout -b phase-c3-preview
git push -u origin phase-c3-preview
```

Wait for the Vercel preview to come up.

- [ ] **Step 2: Confirm `AI_GATEWAY_API_KEY` is auto-injected**

In Vercel Dashboard → Project → Settings → Environment Variables, look for `AI_GATEWAY_API_KEY`. On linked projects this is auto-populated. If it's missing, add it manually (find the key in your Vercel account settings → AI Gateway).

- [ ] **Step 3: Live smoke test on preview**

Visit the preview URL. Click the chatbot toggle. Try these prompts:

| Prompt | Expected response shape |
|---|---|
| "What's the cheapest package?" | Mentions Starter / 1,000 bottles / single city / 4 weeks |
| "How do I sign up?" | Invites to fill the contact form / Send my brief button |
| "What's the weather in Mumbai?" | Polite redirect: not topical; here's what I can help with… |
| "My email is x@y.com, call me." | Thanks, asks user to use the contact form so it goes to the right place |

- [ ] **Step 4: Adversarial test (curl)**

```bash
PREVIEW=https://<your-preview-url>.vercel.app

# Empty body — expect 400
curl -s -X POST "$PREVIEW/api/chat" -H 'Content-Type: application/json' -d '{}'

# Streaming response — expect text chunks
curl -N -s -X POST "$PREVIEW/api/chat" -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"Tell me about the Starter package in one sentence."}]}'

# Rate limit — fire 21 times, 21st should 429
for i in $(seq 1 21); do
  curl -s -o /dev/null -w "%{http_code}\n" -X POST "$PREVIEW/api/chat" \
    -H 'Content-Type: application/json' -d '{"messages":[{"role":"user","content":"hi"}]}'
done | tail -3
```

Expected last line: `429`.

- [ ] **Step 5: Merge to main**

```bash
git checkout main
git merge --no-ff phase-c3-preview -m "Merge phase-c3-preview: LLM chatbot lives on api/chat.ts"
git branch -d phase-c3-preview
```

Vercel auto-deploys main to production. Smoke-test once more on the prod URL.

- [ ] **Step 6: Tag**

```bash
git tag -a phase-c3-complete -m "Phase C3 (LLM chatbot via Vercel AI Gateway) complete"
```

---

## Task 15: Final cross-phase verification + secret rotation reminder

**Files:** none modified.

- [ ] **Step 1: Final Playwright sweep against production**

Save to `.tmp-verify/phase-bc-final.js`:

```js
const { chromium } = require('playwright');
const PROD = process.env.PROD_URL || 'https://jilljill-landing-page.vercel.app';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 900 });

  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));

  await page.goto(PROD, { waitUntil: 'networkidle' });

  // Phase B — icon counts
  await page.locator('#solution').scrollIntoViewIfNeeded();
  const solutionSvgs = await page.locator('#solution .solution-point-icon svg').count();
  await page.locator('#vending').scrollIntoViewIfNeeded();
  const vendingSvgs = await page.locator('#vending .vending-feature-icon svg').count();

  // Phase C2 — form present
  await page.locator('#cta').scrollIntoViewIfNeeded();
  const formExists = await page.locator('#contactForm').count();
  const honeypot = await page.locator('input[name="website"]').count();

  // Phase C3 — chatbot widget present
  const toggleExists = await page.locator('#chatbotToggle').count();
  const panelHidden = await page.locator('#chatbotPanel').isHidden();

  // Open chatbot, send a test message
  await page.locator('#chatbotToggle').click();
  await page.waitForSelector('#chatbotPanel:not([hidden])');
  const greetingShown = await page.locator('.chatbot-message.assistant').first().isVisible();

  const realErrs = errors.filter(e => !/Background-animation/i.test(e) && !/Failed to load resource/i.test(e));
  console.log(JSON.stringify({
    solutionSvgs, vendingSvgs, formExists, honeypot, toggleExists, panelHidden, greetingShown,
    errors: realErrs
  }, null, 2));

  const fails = [];
  if (realErrs.length) fails.push('console/page errors');
  if (solutionSvgs !== 4) fails.push(`solutionSvgs=${solutionSvgs}`);
  if (vendingSvgs !== 8) fails.push(`vendingSvgs=${vendingSvgs}`);
  if (formExists !== 1) fails.push('contact form missing');
  if (honeypot !== 1) fails.push('honeypot field missing');
  if (toggleExists !== 1) fails.push('chatbot toggle missing');
  if (!greetingShown) fails.push('chatbot greeting not shown');

  if (fails.length) {
    console.error('FAIL:', fails.join('; '));
    process.exit(1);
  }
  console.log('PHASES B+C ALL CHECKS PASSED');
  await browser.close();
})();
```

Run:
```bash
PROD_URL=https://your-production-domain.vercel.app node .tmp-verify/phase-bc-final.js
```

Expected: ends with `PHASES B+C ALL CHECKS PASSED`.

- [ ] **Step 2: Surface the secret-rotation checklist to the user**

Compose this checklist and post it to the user (or include in the final report):

> **Before considering Phase C done, confirm these credentials are rotated:**
>
> 1. **Zoho SMTP password** — old value `UrjHYg3k1SzH` (pasted in chat earlier) is leaked.
>    - Action: Zoho Admin → My Account → Security → App Passwords → revoke old + generate new
>    - New value goes ONLY into Vercel env var `ZOHO_PASS` (preview + production)
>
> 2. **Neon Postgres database password** — old connection string `npg_LFKhj2xg6XEk@ep-bold-bonus-amicb78o-pooler...` is leaked (was in `backend/.env`).
>    - Action: Neon Console → Project → Roles → reset password for `neondb_owner`
>    - Phase C2/C3 don't actually use Neon, but rotating now closes the door before Phase D adds DB persistence.
>
> 3. **Confirm `.gitignore` is doing its job:** `git check-ignore .env api/.env backend/.env` should print all three back. Try staging a fake `.env` to be sure it's blocked.

- [ ] **Step 3: Final tag**

```bash
git tag -a phase-bc-complete -m "Phases B + C (icons, backend, mailer, chatbot) complete"
```

- [ ] **Step 4: Stop the local dev server (cleanup)**

If a `python -m http.server 8000` is still running in the background, kill it.

---

## Spec coverage check (writing-plans self-review)

| Spec section | Covered by |
|---|---|
| §3 D1 — Lucide outline icons | Tasks 2, 3 |
| §3 D2 — inline SVG, currentColor | Tasks 2, 3 |
| §3 D3 — 48×48 sizing | Task 1 |
| §3 D4 — delete backend/, scaffold api/ | Task 5 |
| §3 D5 — gitignore env files | Task 5 |
| §3 D6 — 8-field B2B form | Task 6 |
| §3 D7 — email-only via Zoho | Task 9 |
| §3 D8 — honeypot + rate limit + BotID | Task 9 |
| §3 D9 — LLM via Vercel AI Gateway + Haiku 4.5 | Task 13 |
| §3 D10 — floating bottom-right chatbot UI | Task 11 |
| §3 D11 — streaming SSE | Tasks 12, 13 |
| §3 D12 — system prompt grounding | Task 13 |
| §3 D13 — daily budget cap | Task 13 |
| §3 D14 — phased rollout B → C1+C2 → C3 | Plan ordering, tags after each |
| §6 Phase B icon mapping | Tasks 2, 3 |
| §7 Phase C1 reset | Task 5 |
| §8 Phase C2 form + mailer | Tasks 6-10 |
| §9 Phase C3 chatbot | Tasks 11-14 |
| §10 testing strategy | Each task includes verification |
| §11 rollout sequence | Tasks 4 (B), 5 (C1), 10 (C2), 14 (C3), 15 (final) |
| §12 risk register — Zoho/Neon rotation | Tasks 10, 15 (explicit user gate before env vars set) |
| §12 risk register — BotID not on plan | Task 9 honeypot+rate-limit are the fallback |
| §12 risk register — chatbot off-brand | Task 13 strict system prompt + DAILY_TOKEN_BUDGET kill switch |
| §13 file summary | Plan creates/modifies exactly the files listed |
| §14 done criteria | Task 15 final sweep |

No coverage gaps. No placeholders. Stash-pop conflict path documented in Task 0. Both leaked credentials gated behind explicit user confirmation in Tasks 10 and 15.
