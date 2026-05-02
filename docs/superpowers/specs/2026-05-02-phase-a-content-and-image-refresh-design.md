# Phase A — Content & Image Refresh — Design

**Date:** 2026-05-02
**Project:** JillJill landing page (`index.html`)
**Phase:** A of three (A: content+visuals, B: icon system, C: backend contact form + chatbot)
**Status:** Approved for implementation planning

---

## 1. Goal

Bring the JillJill B2B landing page in line with the founder's directives:
India-rooted positioning, professional B2B copy in a warm-missional tone,
honest stat presentation (no unbacked numbers), realistic imagery on the
Problem section, faster and larger Direct-to-Hand carousel, and minor
tier/copy fixes in Pricing, Bottle Portfolio, and Impact.

Phase A is **content + visual fixes only**. No backend changes. No icon
system changes (deferred to Phase B). No contact form or chatbot
(deferred to Phase C).

## 2. Non-goals

- Replacing emoji icons in the Solution and Vending sections (Phase B).
- Wiring `Start Advertising Now` to a real form or SMTP mailer (Phase C).
- Building the chatbot (Phase C).
- Touching authentication, modals, or the existing canvas/frame engine.
- Introducing build steps, bundlers, or new runtime dependencies.

## 3. Decisions captured during brainstorm

| # | Decision | Source |
|---|---|---|
| D1 | New images sourced from Unsplash / Pexels (royalty-free) | Q1 → A |
| D2 | Problem cards auto-swap, **staggered**, **2.3 s** per image | Q2 → B |
| D3 | Direct-to-Hand carousel: **6 s per image**, images **+25%** larger | Q3 → A + b |
| D4 | Pricing tiers: Starter 1,000 / Business 25,000 / Enterprise 50,000+ bottles; reach = single city / single city multi-location / nationwide | Q4 → confirm |
| D5 | Impact section: replace 💧 with yellow disc + "Jil" logo; remove 3 numeric stats; copy = "rural India" not "East Africa"; "Join Our Mission" CTA highlighted | Q5a → confirm |
| D6 | About section: remove the three unbacked stats (10 Lakh+, 50+, 5+) | Q5a → confirm |
| D7 | Copy tone: **Warm + missional** — story-led, India-rooted, social-impact heavy | Q5b → C |
| D8 | Image-swap implementation: small dedicated JS module (~40 lines) with stagger | Approach → B |

## 4. Files affected

| File | Action |
|---|---|
| `index.html` | Edit — Hero, About, Problem markup (img → img-stack), Solution copy, Bottle Portfolio (remove labels), Impact, Pricing, CTA, Footer copy. Add `<script src="js/problem-carousel.js">` |
| `css/components.css` | Edit — `.card-img-stack` & `.card-text-stack` cross-fade rules, `.btn-mission` highlight style, `.products-grid .product-card` (drop spacing previously held by name/size) |
| `css/sections.css` | Edit — `.carousel-track img` width +25% (line 255 area); `.impact-visual` becomes `.impact-disc` with yellow circle + Jil logo SVG positioning |
| `js/carousel.js` | Edit — `this.interval = 3000` → `6000` (line 11 only) |
| `js/problem-carousel.js` | **New** — ~50 lines, staggered cross-fade for 4 cards (image + caption stacks in lockstep) |
| `assets/problem/billboard-1..3.jpg` | **New** — 3 royalty-free Indian-context billboard photos |
| `assets/problem/tv-1..3.jpg` | **New** — 3 royalty-free TV-screen / TV-ad photos |
| `assets/problem/online-1..3.jpg` | **New** — Samsung phone, iPhone, social-media ad on phone |
| `assets/problem/news-1..3.jpg` | **New** — Times of India / Hindi paper / newspaper stack |
| `assets/icons/jil-disc.svg` | **New** — yellow circle (#F4B400 family) with white "Jil" wordmark |

Existing single images (`assets/problem/billboard.jpg`, `tv-commercial.jpg`,
`online-ad.jpg`, `newspaper.jpg`) are kept on disk as the `-1.jpg` of each
set (renamed) so cached references do not break.

**Untouched:** `js/frame-engine.js`, `js/distribution-player.js`,
`js/vending-carousel.js`, `js/carousel.js`, `js/modal.js`,
`js/scroll-handler.js`, `js/intersection-observer.js`, `js/navigation.js`,
`js/main.js` (only adds a script reference if not done in HTML),
`js/product-showcase.js`, the entire `backend/` folder, `vercel.json`.

## 5. Component / change detail

### 5.1 `js/problem-carousel.js` (new)

Single small module. Public surface = none; auto-runs on
`DOMContentLoaded`. Behavior:

- Selects all `.card-img-stack` elements inside the `#problem` section.
- For each stack: collects its `<img>` children and the matching
  `<p>` children of the sibling `.card-text-stack`, marks index 0 as
  `.is-active` on both, and sets a `setInterval` that advances the
  active index of both stacks together every **2 300 ms**.
- Stack `n` starts its first advance after **`n × 575 ms`** (a quarter of
  the interval), producing a staggered visual rhythm across 4 cards.
- Cross-fade is CSS-driven (`opacity` transition, 600 ms ease).
- Respects `prefers-reduced-motion: reduce` — if set, leaves index 0
  visible permanently and does not start the interval.

### 5.2 Problem card markup pattern

Each of the 4 cards changes from:

```html
<img src="assets/problem/billboard.jpg" alt="..." class="card-img" loading="lazy">
```

to:

```html
<div class="card-img-stack">
  <img src="assets/problem/billboard-1.jpg" alt="..." class="is-active" loading="lazy">
  <img src="assets/problem/billboard-2.jpg" alt="..." loading="lazy">
  <img src="assets/problem/billboard-3.jpg" alt="..." loading="lazy">
</div>
```

Captions cycle in lockstep with images (per founder directive: "three
images for swapping, three content in there inside the card"). Markup
becomes:

```html
<div class="card">
  <div class="card-img-stack">
    <img src="assets/problem/billboard-1.jpg" alt="..." class="is-active" loading="lazy">
    <img src="assets/problem/billboard-2.jpg" alt="..." loading="lazy">
    <img src="assets/problem/billboard-3.jpg" alt="..." loading="lazy">
  </div>
  <h3 class="card-title">Billboards</h3>
  <div class="card-text-stack">
    <p class="is-active">A driver passes at 60 km/h. Your message is a blur.</p>
    <p>Crores spent. Glanced at for 2 seconds.</p>
    <p>The skyline forgets you the moment you leave it.</p>
  </div>
</div>
```

The same `problem-carousel.js` advances both the image stack and the
matching text stack on each tick — index `n` of the text stack is shown
when index `n` of the image stack is active. Cross-fade rules apply to
both stacks (`opacity` 600 ms ease).

**Caption sets per card:**

| Card | 1 | 2 | 3 |
|---|---|---|---|
| Billboards | "A driver passes at 60 km/h. Your message is a blur." | "Crores spent. Glanced at for 2 seconds." | "The skyline forgets you the moment you leave it." |
| TV Commercials | "Viewers mute, skip, or scroll the second your ad plays." | "30 seconds of airtime. 0 seconds of attention." | "The ₹50-lakh slot competes with a phone in their hand." |
| Online Ads | "Ad blockers and skip buttons quietly delete your reach." | "A scroll is faster than a brand impression." | "Most of your impressions never even loaded." |
| Newspaper | "Print readership in India falls every quarter." | "Page 5, bottom-right — and gone with tomorrow's paper." | "Headlines win the eye. Ads lose the page." |

### 5.3 Direct-to-Hand carousel

The bottle carousel is JS-driven, not CSS-keyframed. Two precise edits:

- `js/carousel.js:11` — `this.interval = 3000` → `this.interval = 6000`
  (per-slide dwell time becomes 6 s; the 0.8 s slide transition at line
  46 stays unchanged so motion still feels snappy).
- `css/sections.css:255` (`.carousel-track img`) — bump `width` /
  `max-width` by **+25%** over current values. If the rule uses a
  numeric `px` width, multiply by 1.25; if it uses `%`, increase to
  the rounded equivalent. Verify visually at 1280 px and 375 px
  viewports — adjust `.carousel-container` height/aspect if the larger
  bottles overflow vertically.

### 5.4 Bottle Portfolio (Section 6 — `#products`)

Inside each `.product-card`, delete the `<h3 class="product-name">` and
`<p class="product-size">` elements. The `<img>` and the `View Details`
button stay. Optionally adjust card padding for vertical balance
(verify visually).

### 5.5 Impact section (Section 9 — `#impact`)

Markup transforms:

- Heading copy unchanged (already gold-styled).
- Lead paragraph copy → "₹1 from every JillJill bottle funds clean water
  wells across rural India."
- `<div class="impact-visual">💧</div>` becomes
  `<div class="impact-disc"><img src="assets/icons/jil-disc.svg" alt="JillJill" /></div>`.
- The entire `<div class="impact-stats">…</div>` block is removed.
- `<a href="#cta" class="btn btn-primary">Join Our Mission</a>` gains
  the additional class `btn-mission` and uses the CTA copy "Join Our
  Mission to Contribute More".

CSS additions:

- `.impact-disc` — 220 px circle, background `#F4B400`, centered SVG
  (the SVG is the white "Jil" wordmark inside).
- `.btn-mission` — slightly larger padding, gold glow box-shadow, gentle
  pulse keyframe (2 s ease-in-out infinite alternate). Respects
  `prefers-reduced-motion`.

### 5.6 About section (Section 2 — `#about`)

Remove the entire `<div class="profile-stats">…</div>` block. The
founder card stays. Copy in the left column updated to the warm-missional
tone draft from Section 5.7.

### 5.7 Copy refresh (warm + missional, India-rooted)

Authoritative final copy for each affected location:

**Hero**
- H1: "We Place Your Brand in the One Place It Can't Be Ignored — Their Hands."
- Sub: "India's first ad-funded water bottle. Carried by every consumer, seen on every street."

**About**
- Para 1: "JillJill is India's first ad-funded beverage venture. We turn an everyday water bottle into a moving billboard — brands get seen, every Indian consumer gets clean water, and a small share of every bottle goes back into wells across rural India."
- Para 2: "We're a young team building this from the ground up — through authorized agents, smart vending machines, and partnerships in metros, tech parks, and street corners across India."

**Solution / Direct-to-Hand**
- Replace the "10 cents per bottle / East Africa" line in `solution-points` with: "₹1 from every bottle funds water wells across rural India."

**Pricing**
- Starter card sub-text: "1,000 bottles • Single city • Basic analytics"
- Business card sub-text: "25,000 bottles • Single city, multi-location • Full analytics"
- Enterprise card sub-text: "50,000+ bottles • Nationwide • Custom campaign"
- Feature bullets per tier kept structurally; "Multi-city distribution" → "Multi-location distribution" on Business; "National distribution" → "Nationwide distribution" on Enterprise; durations kept as 4-week / 8-week / Custom.

**Footer**
- Footer brand paragraph: "Building India's first ad-funded beverage ecosystem — every bottle, a brand in motion; every sip, a well closer to a village."
- "Building India's first ad-funded beverage ecosystem. Your brand, in their hands." → replaced by the line above.

## 6. Data flow

None. Pure static-page edits + one new client-side timer module. No
network requests added or removed. No state persistence.

## 7. Error handling / accessibility

- `problem-carousel.js` is a no-op if `.card-img-stack` has fewer than 2
  images, or if `prefers-reduced-motion: reduce` is set.
- All new images carry a meaningful `alt` attribute (described, not
  decorative).
- The Jil-disc SVG includes `<title>JillJill — wells for India</title>`
  for screen readers.
- The `.btn-mission` pulse animation is suppressed under
  `prefers-reduced-motion`.

## 8. Testing

Browser-only verification through Playwright. Golden-path checks:

1. Page loads with no console errors at `http://localhost:8000`.
2. After 3 s, each Problem card has advanced its image (verify by
   computed opacity of the second `<img>` in each stack).
3. Direct-to-Hand carousel images appear visibly larger than baseline
   screenshot and complete a slide in ≈ 6 s.
4. Pricing card sub-texts contain the new bottle counts.
5. Impact section contains no `<div class="impact-stats">` and the Jil
   disc SVG renders.
6. About section contains no `<div class="profile-stats">`.
7. Bottle Portfolio cards no longer render `.product-name` or
   `.product-size` elements.
8. Existing carousels (vending, distribution canvas, end-canvas) still
   animate without console errors.

A short Playwright script lives at `/tmp/jilljill-phase-a-verify.js` and
is run during the verification step before commit.

## 9. Out-of-scope reminders for later phases

- **Phase B** — Replace `vending-feature-icon` and `solution-point-icon`
  emojis with a unified professional SVG icon set.
- **Phase C** — Wire `Start Advertising Now` to a real B2B contact form
  with company / requirement / quantity / city dropdowns; add a
  `POST /api/contact` Express route that uses Nodemailer + Zoho SMTP
  (Zoho password must be rotated and stored only in `backend/.env`
  and Vercel env vars, never in git or chat); send a thank-you mail to
  the lead and an inquiry mail to the JillJill inbox; build a chatbot
  with predefined questions and button-driven replies.

## 10. Rollback

Each change is a discrete edit; a single `git revert` of the Phase A
commit cleanly restores the prior state. Image files are additive (the
old single-image files are renamed, not deleted destructively); revert
restores the original filenames.
