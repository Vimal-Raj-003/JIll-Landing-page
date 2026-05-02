# JillJill Phase A — Content & Image Refresh — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refresh the JillJill landing-page Problem section with rotating realistic imagery + matching captions, retune the Direct-to-Hand carousel (faster + larger), strip unbacked stats, and rewrite copy in a warm-missional, India-rooted tone — all without breaking existing carousels, modals, frame engines, or auth flows.

**Architecture:** Pure static-page edits. One new ~50-line vanilla-JS module (`js/problem-carousel.js`) drives staggered cross-fades on the four Problem cards. One new SVG asset (`jil-disc.svg`). Twelve new royalty-free JPG images. All other changes are HTML markup, CSS rules, or single-line JS edits. No build step, no new runtime dependencies, no backend touch.

**Tech Stack:** HTML5, vanilla CSS3 (custom-property based design system in `css/variables.css`), vanilla ES6 JavaScript (no bundler), Playwright (browser verification), git.

**Authoritative spec:** [`docs/superpowers/specs/2026-05-02-phase-a-content-and-image-refresh-design.md`](../specs/2026-05-02-phase-a-content-and-image-refresh-design.md) (commit `04e65b2`).

---

## Codebase orientation (read this once before Task 1)

| Area | Where it lives |
|---|---|
| Site entry | `index.html` (single page, ~660 lines) |
| Design tokens (colors, fonts, spacing) | `css/variables.css` |
| Card / button / pricing styles | `css/components.css` |
| Section-specific styles (hero, about, impact, products, carousel, vending) | `css/sections.css` |
| Bottle (Direct-to-Hand) carousel JS | `js/carousel.js` (class-based, runs on `DOMContentLoaded` via `js/main.js`) |
| Vending sliding carousel JS | `js/vending-carousel.js` |
| Distribution canvas (frame animation) | `js/distribution-player.js`, `js/frame-engine.js` |
| Modal / login | `js/modal.js` |
| All scripts wired in HTML | `index.html` lines 650–659 |
| Static assets | `assets/` (logo.webp, problem/, products/, carousel/, icons/, videos/) |
| Existing problem images | `assets/problem/billboard.jpg`, `tv-commercial.jpg`, `online-ad.jpg`, `newspaper.jpg` |

**Color tokens used by this plan** (defined in `css/variables.css`):

- `--color-hope-gold` — yellow used by Impact heading and disc background
- `--color-warm-amber` — companion yellow
- `--color-deep-navy` — dark background
- `--space-xs / sm / md / lg / xl / 2xl / 3xl / 4xl` — spacing scale
- `--radius-sm / md / lg / xl` — corner radii
- `--font-heading` — Space Grotesk (matches the JillJill wordmark)

**Existing working-tree state at plan time** (from `git status`):

```
 M .gitignore
 M css/components.css
 M css/responsive.css
 M index.html
 M js/modal.js
 M js/navigation.js
?? backend/
```

These pre-existing modifications are **unrelated to Phase A** and must not be reverted. Task 0 covers handling them safely.

---

## Task 0: Pre-flight — secure working tree, start dev server

**Files:** none modified — verification only.

- [ ] **Step 1: Verify you are at the right commit**

Run:

```bash
cd "/c/Users/jillj/OneDrive/Desktop/JillJill/New folder"
git log -1 --pretty=format:'%H %s'
```

Expected: starts with `04e65b2 docs: add Phase A content + image refresh design spec`. If it doesn't, stop and ask the user — the spec hasn't been committed.

- [ ] **Step 2: Resolve the pre-existing uncommitted work BEFORE editing anything**

The working tree has changes that pre-date Phase A:

```
 M .gitignore
 M css/components.css
 M css/responsive.css
 M index.html
 M js/modal.js
 M js/navigation.js
?? backend/
```

Several of these files (`index.html`, `css/components.css`) are touched by later tasks. If left mixed in, my staged `git add` commands would scoop the user's prior work into Phase A commits — making clean revert impossible. **You must isolate the prior work first.** Run:

```bash
git status --short
git diff --stat
```

Then stash everything as a labelled snapshot:

```bash
git stash push --include-untracked -m "pre-phase-a-snapshot ($(date +%Y-%m-%dT%H%M))" -- \
  .gitignore css/components.css css/responsive.css index.html js/modal.js js/navigation.js backend/
git status --short
```

Expected after stash: `git status --short` is empty (clean tree). Confirm the stash exists:

```bash
git stash list | head -1
```

Expected: a `stash@{0}: On main: pre-phase-a-snapshot ...` entry. **Tell the user**: "Stashed your prior work as `stash@{0}` — restore with `git stash pop` after Phase A is complete (and resolve any conflict by hand; most likely there will be none in `index.html` because Phase A rewrites different sections, but `css/components.css` overlaps and may need a 3-way merge)."

If the user wants their prior work committed first instead of stashed, stop and ask before continuing.

- [ ] **Step 3: Start the static dev server in the background**

Run (background):

```bash
cd "/c/Users/jillj/OneDrive/Desktop/JillJill/New folder"
python -m http.server 8000
```

Verify it's reachable:

```bash
curl -sI http://localhost:8000/ | head -1
```

Expected: `HTTP/1.0 200 OK`. If `python` isn't on PATH, use `python3 -m http.server 8000` or `npx http-server -p 8000`.

- [ ] **Step 4: Confirm Playwright is installed**

Run:

```bash
npx --no-install playwright --version
```

Expected: a version string (e.g. `Version 1.4x.x`). If it fails, install with `npm i -D playwright && npx playwright install chromium`. The verification scripts in later tasks depend on Playwright + Chromium being available.

---

## Task 1: Acquire 12 royalty-free Problem images + create Jil-disc SVG

**Files:**
- Create: `assets/problem/billboard-1.jpg`, `billboard-2.jpg`, `billboard-3.jpg`
- Create: `assets/problem/tv-1.jpg`, `tv-2.jpg`, `tv-3.jpg`
- Create: `assets/problem/online-1.jpg`, `online-2.jpg`, `online-3.jpg`
- Create: `assets/problem/news-1.jpg`, `news-2.jpg`, `news-3.jpg`
- Create: `assets/icons/jil-disc.svg`
- (Existing files `billboard.jpg`, `tv-commercial.jpg`, `online-ad.jpg`, `newspaper.jpg` stay where they are — Task 3 stops referencing them but does not delete them.)

**Sourcing:** Use Unsplash (`https://unsplash.com/s/photos/<query>`) and Pexels (`https://www.pexels.com/search/<query>/`). Both allow free commercial use without attribution. Pick photos that read well at ~480×200 px (the card image is cropped to that size).

- [ ] **Step 1: Source 3 billboard photos**

Search queries (try in order until each yields a usable Indian-context shot — fall back to generic urban billboard if needed):

| Filename | Search query | Visual target |
|---|---|---|
| `billboard-1.jpg` | `india highway billboard` | Daytime hoarding beside an Indian highway, large frame |
| `billboard-2.jpg` | `urban billboard intersection` | City billboard at a street intersection, advertising visible |
| `billboard-3.jpg` | `night billboard highway` | Backlit night hoarding on a flyover or overpass |

Download each at the **medium** Unsplash size (~1080 px wide). Save into `assets/problem/`. Confirm dimensions:

```bash
ls -la "assets/problem/" | grep billboard
```

Expected: 4 files (`billboard.jpg` from before + 3 new). Each new file should be 100–500 KB.

- [ ] **Step 2: Source 3 TV-commercial photos**

| Filename | Search query | Visual target |
|---|---|---|
| `tv-1.jpg` | `living room television evening` | TV screen visible in a domestic living-room scene |
| `tv-2.jpg` | `tv wall electronics store` | Multi-screen TV wall (electronics shop) |
| `tv-3.jpg` | `person watching tv dim room` | Person silhouetted in front of a TV in dim lighting |

- [ ] **Step 3: Source 3 online-ad / phone photos**

| Filename | Search query | Visual target |
|---|---|---|
| `online-1.jpg` | `samsung galaxy phone hand` | Hand holding a Samsung Galaxy showing a banner / app screen |
| `online-2.jpg` | `iphone instagram hand` | Hand holding an iPhone with an Instagram-style feed visible |
| `online-3.jpg` | `phone social media feed scrolling` | Close-up of a phone screen with a sponsored social-media post |

- [ ] **Step 4: Source 3 newspaper photos**

| Filename | Search query | Visual target |
|---|---|---|
| `news-1.jpg` | `times of india newspaper` (fallback: `english newspaper india`) | English-language Indian daily, front-page legible |
| `news-2.jpg` | `dainik jagran` (fallback: `hindi newspaper`) | Hindi-language Indian newspaper |
| `news-3.jpg` | `stack of newspapers` | Folded stack of newsprint, generic |

- [ ] **Step 5: Create `assets/icons/jil-disc.svg`**

Create the file with this exact content:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 220" role="img" aria-labelledby="jilDiscTitle">
  <title id="jilDiscTitle">JillJill — wells for India</title>
  <defs>
    <radialGradient id="jilDiscGrad" cx="50%" cy="40%" r="65%">
      <stop offset="0%" stop-color="#FFD060"/>
      <stop offset="100%" stop-color="#F4B400"/>
    </radialGradient>
  </defs>
  <circle cx="110" cy="110" r="104" fill="url(#jilDiscGrad)"/>
  <circle cx="110" cy="110" r="104" fill="none" stroke="#ffffff" stroke-opacity="0.35" stroke-width="3"/>
  <text x="110" y="135" text-anchor="middle"
        font-family="'Space Grotesk', system-ui, -apple-system, sans-serif"
        font-weight="800" font-size="92" fill="#ffffff"
        letter-spacing="-2">Jil</text>
</svg>
```

- [ ] **Step 6: Verify all 13 assets exist**

```bash
ls -la "assets/problem/" "assets/icons/"
```

Expected: `assets/problem/` contains the 4 originals + 12 new files; `assets/icons/` contains `jil-disc.svg`. None should be 0 bytes.

- [ ] **Step 7: Stage and commit assets only**

```bash
git add "assets/problem/billboard-1.jpg" "assets/problem/billboard-2.jpg" "assets/problem/billboard-3.jpg" \
        "assets/problem/tv-1.jpg" "assets/problem/tv-2.jpg" "assets/problem/tv-3.jpg" \
        "assets/problem/online-1.jpg" "assets/problem/online-2.jpg" "assets/problem/online-3.jpg" \
        "assets/problem/news-1.jpg" "assets/problem/news-2.jpg" "assets/problem/news-3.jpg" \
        "assets/icons/jil-disc.svg"
git commit -m "$(cat <<'EOF'
feat(assets): add Phase A imagery — 12 problem-section photos + Jil disc SVG

Royalty-free Unsplash/Pexels imagery in India-relevant contexts for
the four Problem cards (billboard, TV, online, newspaper) — three per
card to support staggered cross-fade. New jil-disc.svg replaces the
droplet emoji in the Impact section.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Confirm:

```bash
git log -1 --pretty=format:'%h %s'
```

Expected: a new commit hash with the message above.

---

## Task 2: Add CSS for image / text cross-fade stacks

**Files:**
- Modify: `css/components.css` — append new rules at end of file

- [ ] **Step 1: Append the cross-fade stack rules**

Open `css/components.css`. Append this block at the end of the file (after the final existing rule):

```css
/* === Phase A — Problem-card image + caption cross-fade stacks === */

.card-img-stack {
  position: relative;
  width: calc(100% + 64px);
  margin: calc(-1 * var(--space-xl)) calc(-1 * var(--space-xl)) var(--space-sm) calc(-1 * var(--space-xl));
  height: 200px;
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  overflow: hidden;
}

.card-img-stack img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 600ms ease;
}

.card-img-stack img.active {
  opacity: 0.9;
}

.card:hover .card-img-stack img.active {
  opacity: 1;
}

.card-text-stack {
  position: relative;
  min-height: 4.5em; /* reserve space for the longest caption */
}

.card-text-stack p {
  position: absolute;
  inset: 0;
  margin: 0;
  color: rgba(255, 255, 255, 0.8);
  line-height: var(--lh-normal);
  opacity: 0;
  transition: opacity 600ms ease;
}

.card-text-stack p.active {
  opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
  .card-img-stack img,
  .card-text-stack p {
    transition: none;
  }
}
```

- [ ] **Step 2: Verify the file still parses (syntax sanity)**

```bash
node -e "const fs=require('fs');const css=fs.readFileSync('css/components.css','utf8');const open=(css.match(/{/g)||[]).length;const close=(css.match(/}/g)||[]).length;if(open!==close){console.error('BRACE MISMATCH',open,close);process.exit(1)}console.log('braces ok',open)"
```

Expected: `braces ok <number>`. If mismatch reported, re-check the appended block.

- [ ] **Step 3: Commit**

```bash
git add css/components.css
git commit -m "$(cat <<'EOF'
style(problem): add cross-fade rules for image and caption stacks

New .card-img-stack / .card-text-stack pair allows three stacked
images and three stacked captions to opacity-cross-fade in lockstep,
driven by problem-carousel.js (added in next commit). Honors
prefers-reduced-motion.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Replace Problem-section markup in `index.html`

**Files:**
- Modify: `index.html:192-213` — the `.problem-grid` block (4 `.card` divs)

- [ ] **Step 1: Replace the four cards**

Open `index.html`. Find the block that currently spans lines 192–213 (the `<div class="problem-grid">`). Replace those four `<div class="card">` blocks (and only those — leave the surrounding heading, subheading, and `problem-stat` block untouched) with:

```html
        <div class="problem-grid">
          <div class="card" data-reveal data-reveal-delay="0">
            <div class="card-img-stack">
              <img src="assets/problem/billboard-1.jpg" alt="Highway billboard in India" class="active" loading="lazy">
              <img src="assets/problem/billboard-2.jpg" alt="City intersection billboard" loading="lazy">
              <img src="assets/problem/billboard-3.jpg" alt="Backlit night billboard" loading="lazy">
            </div>
            <h3 class="card-title">Billboards</h3>
            <div class="card-text-stack">
              <p class="active">A driver passes at 60 km/h. Your message is a blur.</p>
              <p>Crores spent. Glanced at for 2 seconds.</p>
              <p>The skyline forgets you the moment you leave it.</p>
            </div>
          </div>
          <div class="card" data-reveal data-reveal-delay="150">
            <div class="card-img-stack">
              <img src="assets/problem/tv-1.jpg" alt="Television showing a commercial" class="active" loading="lazy">
              <img src="assets/problem/tv-2.jpg" alt="Wall of televisions in an electronics store" loading="lazy">
              <img src="assets/problem/tv-3.jpg" alt="Person watching TV in dim light" loading="lazy">
            </div>
            <h3 class="card-title">TV Commercials</h3>
            <div class="card-text-stack">
              <p class="active">Viewers mute, skip, or scroll the second your ad plays.</p>
              <p>30 seconds of airtime. 0 seconds of attention.</p>
              <p>The ₹50-lakh slot competes with a phone in their hand.</p>
            </div>
          </div>
          <div class="card" data-reveal data-reveal-delay="300">
            <div class="card-img-stack">
              <img src="assets/problem/online-1.jpg" alt="Samsung phone showing a banner ad" class="active" loading="lazy">
              <img src="assets/problem/online-2.jpg" alt="iPhone showing a sponsored Instagram post" loading="lazy">
              <img src="assets/problem/online-3.jpg" alt="Hand scrolling a social-media feed on a phone" loading="lazy">
            </div>
            <h3 class="card-title">Online Ads</h3>
            <div class="card-text-stack">
              <p class="active">Ad blockers and skip buttons quietly delete your reach.</p>
              <p>A scroll is faster than a brand impression.</p>
              <p>Most of your impressions never even loaded.</p>
            </div>
          </div>
          <div class="card" data-reveal data-reveal-delay="450">
            <div class="card-img-stack">
              <img src="assets/problem/news-1.jpg" alt="English-language Indian newspaper front page" class="active" loading="lazy">
              <img src="assets/problem/news-2.jpg" alt="Hindi-language Indian newspaper" loading="lazy">
              <img src="assets/problem/news-3.jpg" alt="Stack of folded newspapers" loading="lazy">
            </div>
            <h3 class="card-title">Newspaper</h3>
            <div class="card-text-stack">
              <p class="active">Print readership in India falls every quarter.</p>
              <p>Page 5, bottom-right — and gone with tomorrow's paper.</p>
              <p>Headlines win the eye. Ads lose the page.</p>
            </div>
          </div>
        </div>
```

- [ ] **Step 2: Confirm the 12 image references resolve**

```bash
for f in billboard-1 billboard-2 billboard-3 tv-1 tv-2 tv-3 online-1 online-2 online-3 news-1 news-2 news-3; do
  test -s "assets/problem/${f}.jpg" || echo "MISSING: $f"
done
echo "done"
```

Expected: just `done` (no `MISSING` lines).

- [ ] **Step 3: Quick browser smoke check (no JS yet — images should appear stacked)**

Save the following to `/tmp/jilljill-task3-smoke.js`:

```js
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://localhost:8000/', { waitUntil: 'networkidle' });
  const stackCount = await page.locator('#problem .card-img-stack').count();
  const imgCount = await page.locator('#problem .card-img-stack img').count();
  const textCount = await page.locator('#problem .card-text-stack p').count();
  console.log(JSON.stringify({ stackCount, imgCount, textCount, errors }, null, 2));
  await browser.close();
})();
```

Run:

```bash
node /tmp/jilljill-task3-smoke.js
```

Expected: `stackCount: 4`, `imgCount: 12`, `textCount: 12`, `errors: []`. (Only the first image of each card will be visible because no JS is animating them yet — the others will be hidden by `opacity: 0`. That's correct.)

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "$(cat <<'EOF'
feat(problem): replace single-image cards with 3-up image+caption stacks

Each of the four Problem cards now has a .card-img-stack of three
photos and a matching .card-text-stack of three captions. The first
of each is marked .active so the page renders correctly even
before problem-carousel.js loads.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Create `js/problem-carousel.js` and wire it in

**Files:**
- Create: `js/problem-carousel.js` (new)
- Modify: `index.html:649-659` — script block, add one new `<script>` tag

- [ ] **Step 1: Create the module**

Create `js/problem-carousel.js` with this exact content:

```js
(function () {
  'use strict';

  var INTERVAL_MS = 2300;
  var STAGGER_MS = 575;

  function activate(nodes, index) {
    for (var i = 0; i < nodes.length; i++) {
      if (i === index) {
        nodes[i].classList.add('active');
        nodes[i].removeAttribute('aria-hidden');
      } else {
        nodes[i].classList.remove('active');
        nodes[i].setAttribute('aria-hidden', 'true');
      }
    }
  }

  function startCard(card, offsetMs) {
    var imgStack = card.querySelector('.card-img-stack');
    var txtStack = card.querySelector('.card-text-stack');
    if (!imgStack || !txtStack) return;

    var imgs = imgStack.querySelectorAll('img');
    var txts = txtStack.querySelectorAll('p');
    var count = Math.min(imgs.length, txts.length);
    if (count < 2) return;

    var i = 0;
    activate(imgs, 0);
    activate(txts, 0);

    setTimeout(function tick() {
      setInterval(function () {
        i = (i + 1) % count;
        activate(imgs, i);
        activate(txts, i);
      }, INTERVAL_MS);
    }, offsetMs);
  }

  function init() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    var cards = document.querySelectorAll('#problem .problem-grid .card');
    for (var n = 0; n < cards.length; n++) {
      startCard(cards[n], n * STAGGER_MS);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
```

- [ ] **Step 2: Wire the script into `index.html`**

Find the script block that currently looks like:

```html
  <!-- JavaScript Modules -->
  <script src="js/frame-engine.js"></script>
  <script src="js/scroll-handler.js"></script>
  <script src="js/intersection-observer.js"></script>
  <script src="js/navigation.js"></script>
  <script src="js/product-showcase.js"></script>
  <script src="js/carousel.js"></script>
  <script src="js/vending-carousel.js"></script>
  <script src="js/distribution-player.js"></script>
  <script src="js/modal.js"></script>
  <script src="js/main.js"></script>
```

Insert one new line **immediately after** `<script src="js/vending-carousel.js"></script>`:

```html
  <script src="js/problem-carousel.js"></script>
```

The block after the change must read:

```html
  <!-- JavaScript Modules -->
  <script src="js/frame-engine.js"></script>
  <script src="js/scroll-handler.js"></script>
  <script src="js/intersection-observer.js"></script>
  <script src="js/navigation.js"></script>
  <script src="js/product-showcase.js"></script>
  <script src="js/carousel.js"></script>
  <script src="js/vending-carousel.js"></script>
  <script src="js/problem-carousel.js"></script>
  <script src="js/distribution-player.js"></script>
  <script src="js/modal.js"></script>
  <script src="js/main.js"></script>
```

- [ ] **Step 3: Verify the carousel runs in a browser**

Save to `/tmp/jilljill-task4-verify.js`:

```js
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(e.message));

  await page.goto('http://localhost:8000/', { waitUntil: 'networkidle' });
  await page.locator('#problem').scrollIntoViewIfNeeded();

  const initial = await page.$$eval('#problem .card-img-stack', stacks =>
    stacks.map(s => Array.from(s.querySelectorAll('img')).findIndex(i => i.classList.contains('active')))
  );

  // Wait long enough for every card's first stagger tick to fire (4 cards × 575ms + 1 interval = ~4.6s)
  await page.waitForTimeout(4800);

  const after = await page.$$eval('#problem .card-img-stack', stacks =>
    stacks.map(s => Array.from(s.querySelectorAll('img')).findIndex(i => i.classList.contains('active')))
  );

  const captions = await page.$$eval('#problem .card-text-stack', stacks =>
    stacks.map(s => Array.from(s.querySelectorAll('p')).findIndex(p => p.classList.contains('active')))
  );

  console.log(JSON.stringify({ initial, after, captions, errors }, null, 2));

  if (errors.length) process.exit(2);
  if (initial.some(v => v !== 0)) process.exit(3);
  // After 4.8s every card should have ticked at least once
  if (after.some(v => v === 0)) process.exit(4);
  // Caption index must equal image index for every card (lockstep)
  for (let i = 0; i < after.length; i++) {
    if (after[i] !== captions[i]) process.exit(5);
  }
  console.log('OK');
  await browser.close();
})();
```

Run:

```bash
node /tmp/jilljill-task4-verify.js
```

Expected: ends with `OK`. Exit code 2 = JS console errors; 3 = initial state wrong; 4 = no rotation happened (script not loading); 5 = image and caption indices diverged.

- [ ] **Step 4: Commit**

```bash
git add js/problem-carousel.js index.html
git commit -m "$(cat <<'EOF'
feat(problem): staggered cross-fade carousel for the four Problem cards

New problem-carousel.js advances each card's image stack and caption
stack in lockstep every 2.3s, with a 575ms stagger between cards so
all four are never animating at the same instant. No-op under
prefers-reduced-motion.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Tune Direct-to-Hand carousel — slower interval, larger images

**Files:**
- Modify: `js/carousel.js:11`
- Modify: `css/sections.css:255-261`

- [ ] **Step 1: Change the per-slide interval**

Open `js/carousel.js`. Line 11 currently reads:

```js
    this.interval = 3000; // 3 seconds per slide
```

Replace with:

```js
    this.interval = 6000; // 6 seconds per slide (Phase A — bigger, calmer carousel)
```

Confirm only that one line changed:

```bash
git diff js/carousel.js
```

Expected: a single one-line diff at line 11.

- [ ] **Step 2: Bump image size by +25%**

Open `css/sections.css`. The `.carousel-track img` rule at lines 255–261 currently reads:

```css
.carousel-track img {
  width: 100%;
  max-width: 480px;
  height: 100%;
  object-fit: contain;
  flex-shrink: 0;
}
```

Replace with (max-width 480 → 600, which is +25%; container also bumps to keep aspect):

```css
.carousel-track img {
  width: 100%;
  max-width: 600px;
  height: 100%;
  object-fit: contain;
  flex-shrink: 0;
}
```

Then update the surrounding `.carousel-container` (lines 240–247) so the larger images don't get clipped:

```css
.carousel-container {
  position: relative;
  width: 100%;
  max-width: 600px;
  height: 600px;
  overflow: hidden;
  border-radius: var(--radius-xl);
}
```

(Width 480 → 600, height 520 → 600, both +25%.)

- [ ] **Step 3: Verify in browser**

Save to `/tmp/jilljill-task5-verify.js`:

```js
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 900 });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(e.message));

  await page.goto('http://localhost:8000/', { waitUntil: 'networkidle' });
  await page.locator('#solution').scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  const containerBox = await page.locator('#carouselContainer').boundingBox();
  const imgBox = await page.locator('#carouselTrack img').first().boundingBox();

  // Track the slide position to confirm it actually moves and dwells ~6s
  const t0 = await page.locator('#carouselTrack').evaluate(el => el.style.transform || '');
  await page.waitForTimeout(7000);
  const t1 = await page.locator('#carouselTrack').evaluate(el => el.style.transform || '');

  console.log(JSON.stringify({ containerBox, imgBox, t0, t1, errors }, null, 2));

  if (errors.length) process.exit(2);
  if (!containerBox || containerBox.width < 540) process.exit(3); // expect ~600
  if (t0 === t1) process.exit(4); // carousel should have advanced once in 7s
  console.log('OK');
  await browser.close();
})();
```

Run:

```bash
node /tmp/jilljill-task5-verify.js
```

Expected: ends with `OK`. Exit 3 = size didn't grow; exit 4 = carousel didn't tick (interval change broken).

- [ ] **Step 4: Commit**

```bash
git add js/carousel.js css/sections.css
git commit -m "$(cat <<'EOF'
style(carousel): slow Direct-to-Hand carousel to 6s, enlarge images +25%

Per-slide dwell goes from 3s to 6s and the container/image max-width
goes from 480/480 to 600/600 (height 520 → 600). The 0.8s slide
transition itself is unchanged so motion still feels snappy.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Update Hero subtitle copy

**Files:**
- Modify: `index.html:131-133` — `.hero-subtitle` paragraph

- [ ] **Step 1: Replace the subtitle**

Open `index.html`. Lines 131–133 currently read:

```html
        <p class="hero-subtitle">
          India's first ad-funded water bottle platform. Your message, carried by every consumer.
        </p>
```

Replace with:

```html
        <p class="hero-subtitle">
          India's first ad-funded water bottle. Carried by every consumer, seen on every street.
        </p>
```

(The `.hero-tagline` H1 stays exactly as-is — the existing copy already matches the spec.)

- [ ] **Step 2: Verify**

```bash
grep -n "Carried by every consumer, seen on every street" index.html
```

Expected: exactly one match at line 132.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "copy(hero): tighten subtitle to the warm-missional India line

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: Rewrite About copy + remove the three unbacked stats

**Files:**
- Modify: `index.html:153-172` — `.profile-text` two paragraphs and the entire `.profile-stats` block

- [ ] **Step 1: Replace the paragraphs and remove the stats block**

Find lines 153–173 — the two `<p>` tags and the `<div class="profile-stats">…</div>` block, ending right before `<div class="profile-founders" data-reveal data-reveal-direction="right">`. Replace that entire span with:

```html
            <p>
              JillJill is India's first ad-funded beverage venture. We turn an everyday water bottle into a moving billboard — brands get seen, every Indian consumer gets clean water, and a small share of every bottle goes back into wells across rural India.
            </p>
            <p>
              We're a young team building this from the ground up — through authorized agents, smart vending machines, and partnerships in metros, tech parks, and street corners across India.
            </p>
```

The `<h2>Redefining Advertising,<br>One Bottle at a Time</h2>` (line 152) stays. The founder card block below (`<div class="profile-founders">`…) stays.

- [ ] **Step 2: Verify the stats element is gone and the new copy is in**

```bash
grep -c "profile-stats" index.html      # expect: 0
grep -c "Lakh+ Bottles Distributed" index.html   # expect: 0
grep -c "moving billboard" index.html   # expect: 1
grep -c "young team building this from the ground up" index.html   # expect: 1
```

If any number is wrong, re-edit and re-check.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "$(cat <<'EOF'
copy(about): rewrite in warm-missional tone, remove unbacked stats

Removes the three stat tiles (10 Lakh+ bottles, 50+ cities, 5+ wells)
that overstated a pre-launch reality, and rewrites both paragraphs to
emphasise the India-first, well-funding mission.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Replace the "10 cents / East Africa" line in the Solution section

**Files:**
- Modify: `index.html:258` — the `<p>` inside the Social-Impact `solution-point`

- [ ] **Step 1: Change the line**

Open `index.html`. Line 258 currently reads:

```html
                  <p>10 cents per bottle funds water wells in East Africa.</p>
```

Replace with:

```html
                  <p>₹1 from every bottle funds water wells across rural India.</p>
```

- [ ] **Step 2: Verify**

```bash
grep -c "East Africa" index.html             # expect: 0
grep -c "₹1 from every bottle funds water wells across rural India" index.html  # expect: 1
```

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "copy(solution): replace 10¢/East Africa line with ₹1/rural India

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: Strip product names and sizes from the Bottle Portfolio cards

**Files:**
- Modify: `index.html:329-352` — four `.product-card` blocks

- [ ] **Step 1: Remove the `<h3>` and `<p>` from each of the 4 product cards**

The four cards currently look like (example — Standard 500ml):

```html
          <div class="product-card" data-reveal data-reveal-delay="0">
            <img src="assets/products/standard-500ml.png" alt="JillJill Standard 500ml" loading="lazy" width="200" height="280">
            <h3 class="product-name">Standard 500ml</h3>
            <p class="product-size">Everyday hydration, maximum visibility</p>
            <button class="btn btn-secondary" style="font-size:var(--fs-caption);padding:8px 20px;">View Details</button>
          </div>
```

For all four cards, delete the `<h3 class="product-name">…</h3>` and `<p class="product-size">…</p>` lines. The image and the button stay. After editing, each card should look like:

```html
          <div class="product-card" data-reveal data-reveal-delay="0">
            <img src="assets/products/standard-500ml.png" alt="JillJill Standard 500ml" loading="lazy" width="200" height="280">
            <button class="btn btn-secondary" style="font-size:var(--fs-caption);padding:8px 20px;">View Details</button>
          </div>
```

Apply the same removal to the Premium 500ml, Medium 1000ml, and Slim 330ml cards. The `alt` text on each `<img>` stays as-is — that's the only place the size is mentioned now, and it's needed for accessibility.

- [ ] **Step 2: Verify**

```bash
grep -c 'product-name' index.html    # expect: 0
grep -c 'product-size' index.html    # expect: 0
grep -c 'product-card' index.html    # expect: 4 (the 4 .product-card divs)
```

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "$(cat <<'EOF'
ui(products): drop size labels from Bottle Portfolio cards (image-only)

Per founder direction: the bottle image is the message. Removes the
.product-name h3 and .product-size p from all four cards. Alt text
keeps the size for screen readers.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: Update Pricing tier copy (counts + reach)

**Files:**
- Modify: `index.html:540` — Starter `pricing-desc`
- Modify: `index.html:554, 556` — Business `pricing-desc` and first feature
- Modify: `index.html:568, 570` — Enterprise `pricing-desc` and first feature

- [ ] **Step 1: Edit the three `pricing-desc` lines**

| Line | Current | New |
|---|---|---|
| 540 | `<div class="pricing-desc">25,000 bottles &bull; 1 city &bull; Basic analytics</div>` | `<div class="pricing-desc">1,000 bottles &bull; Single city &bull; Basic analytics</div>` |
| 554 | `<div class="pricing-desc">50,000 bottles &bull; Multi-city &bull; Full analytics</div>` | `<div class="pricing-desc">25,000 bottles &bull; Single city, multi-location &bull; Full analytics</div>` |
| 568 | `<div class="pricing-desc">100K+ bottles &bull; National &bull; Custom campaign</div>` | `<div class="pricing-desc">50,000+ bottles &bull; Nationwide &bull; Custom campaign</div>` |

- [ ] **Step 2: Edit the two distribution feature bullets**

| Line | Current | New |
|---|---|---|
| 556 | `<li>Multi-city distribution</li>` | `<li>Multi-location distribution</li>` |
| 570 | `<li>National distribution</li>` | `<li>Nationwide distribution</li>` |

(All other feature bullets across the three tiers stay unchanged. Durations 4-week / 8-week / Custom stay.)

- [ ] **Step 3: Verify**

```bash
grep -c "1,000 bottles" index.html             # expect: 1
grep -c "25,000 bottles" index.html            # expect: 1
grep -c "50,000+ bottles" index.html           # expect: 1
grep -c "Single city, multi-location" index.html  # expect: 1
grep -c "Nationwide" index.html                # expect: 2 (pricing-desc + feature bullet)
grep -c "Multi-city" index.html                # expect: 0
grep -c "100K+" index.html                     # expect: 0
```

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "$(cat <<'EOF'
copy(pricing): rescope tiers — Starter 1k / Business 25k / Enterprise 50k+

Aligns the three pricing tiers with the realistic startup-stage offer:
Starter at 1,000 bottles single city; Business at 25,000 bottles
single city multi-location; Enterprise at 50,000+ bottles nationwide.
Also softens "Multi-city distribution" → "Multi-location distribution"
and "National distribution" → "Nationwide distribution".

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 11: Update Footer brand paragraph

**Files:**
- Modify: `index.html:608` — footer brand `<p>`

- [ ] **Step 1: Replace the line**

Line 608 currently reads:

```html
          <p>Building India's first ad-funded beverage ecosystem. Your brand, in their hands.</p>
```

Replace with:

```html
          <p>Building India's first ad-funded beverage ecosystem — every bottle, a brand in motion; every sip, a well closer to a village.</p>
```

- [ ] **Step 2: Verify**

```bash
grep -c "every sip, a well closer to a village" index.html   # expect: 1
```

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "copy(footer): warm-missional brand paragraph

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 12: Replace the Impact section — disc, copy, removed stats, highlighted CTA

**Files:**
- Modify: `index.html:500-529` — entire Impact section content
- Modify: `css/sections.css:419-431` — replace `.impact-visual` rule
- Modify: `css/sections.css:433-438` — remove `.impact-stats` rule (now unused)
- Modify: `css/components.css` — append `.btn-mission` rules at end

- [ ] **Step 1: Replace the Impact-section markup**

Find the Impact section (currently lines 500–529). Replace from `<div class="impact-content" data-reveal>` through to (but not including) the closing `</section>` with:

```html
        <div class="impact-content" data-reveal>
          <h2 class="section-heading" style="color:var(--color-hope-gold);">Every Bottle Builds a Well</h2>
          <p style="color:rgba(255,255,255,0.85);font-size:var(--fs-h3);margin:var(--space-xl) 0 var(--space-2xl);">
            ₹1 from every JillJill bottle funds clean water wells across rural India.
          </p>

          <div class="impact-disc">
            <img src="assets/icons/jil-disc.svg" alt="JillJill — wells for India" width="220" height="220">
          </div>

          <a href="#cta" class="btn btn-primary btn-mission" style="margin-top:var(--space-3xl);">Join Our Mission to Contribute More</a>
        </div>
```

The whole `<div class="impact-stats">…</div>` block is gone. The CTA gains the `btn-mission` class and new copy.

- [ ] **Step 2: Replace the `.impact-visual` CSS rule with `.impact-disc`**

Open `css/sections.css`. Lines 419–431 currently read:

```css
.impact-visual {
  margin: var(--space-2xl) auto;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-warm-amber), var(--color-hope-gold));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 4rem;
  box-shadow: 0 0 60px rgba(255, 179, 71, 0.3);
  animation: pulseGlow 3s infinite;
}
```

Replace that entire block with:

```css
.impact-disc {
  margin: var(--space-2xl) auto;
  width: 220px;
  height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
  filter: drop-shadow(0 0 60px rgba(255, 179, 71, 0.35));
  animation: pulseGlow 3s infinite;
}

.impact-disc img {
  width: 100%;
  height: 100%;
  display: block;
}
```

- [ ] **Step 3: Remove the now-unused `.impact-stats` rules**

Lines 433–442 currently read:

```css
.impact-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-xl);
  margin-top: var(--space-3xl);
}

.impact-stat .stat-number {
  color: var(--color-hope-gold);
}
```

Delete both rules entirely (the `.impact-stats` selector and the `.impact-stat .stat-number` selector). The blank line and the next `/* === CTA SECTION === */` comment that follows must remain.

- [ ] **Step 4: Add `.btn-mission` styling**

Append to the end of `css/components.css`:

```css
/* === Phase A — Highlighted "Join Our Mission" CTA === */

.btn-mission {
  font-size: 1.15em;
  padding: 1.1em 2.4em;
  background: linear-gradient(135deg, var(--color-warm-amber), var(--color-hope-gold));
  color: var(--color-deep-navy);
  border: none;
  box-shadow: 0 0 0 0 rgba(244, 180, 0, 0.55);
  animation: missionPulse 2s ease-in-out infinite alternate;
}

.btn-mission:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 30px rgba(244, 180, 0, 0.45);
}

@keyframes missionPulse {
  from { box-shadow: 0 0 0 0 rgba(244, 180, 0, 0.55); }
  to   { box-shadow: 0 0 0 14px rgba(244, 180, 0, 0); }
}

@media (prefers-reduced-motion: reduce) {
  .btn-mission { animation: none; }
}
```

- [ ] **Step 5: Verify the changes hang together**

```bash
grep -c "impact-stats" index.html         # expect: 0
grep -c "impact-stats" css/sections.css   # expect: 0
grep -c "impact-stat " css/sections.css   # expect: 0
grep -c "impact-disc" index.html          # expect: 1
grep -c "impact-disc" css/sections.css    # expect: 2 (.impact-disc + .impact-disc img)
grep -c "btn-mission" index.html          # expect: 1
grep -c "btn-mission" css/components.css  # expect: 4 (definition + :hover + keyframes + reduced-motion)
node -e "const fs=require('fs');for(const f of ['css/components.css','css/sections.css']){const css=fs.readFileSync(f,'utf8');const o=(css.match(/{/g)||[]).length;const c=(css.match(/}/g)||[]).length;if(o!==c){console.error('BRACE MISMATCH in '+f,o,c);process.exit(1)}}console.log('css ok')"
```

All counts must match (none reported as `BRACE MISMATCH`).

- [ ] **Step 6: Browser verification**

Save to `/tmp/jilljill-task12-verify.js`:

```js
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(e.message));

  await page.goto('http://localhost:8000/', { waitUntil: 'networkidle' });
  await page.locator('#impact').scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  const hasStats = await page.locator('#impact .impact-stats').count();
  const hasDisc = await page.locator('#impact .impact-disc img').count();
  const cta = await page.locator('#impact a.btn-mission').textContent();
  const discBox = await page.locator('#impact .impact-disc img').boundingBox();

  console.log(JSON.stringify({ hasStats, hasDisc, cta, discBox, errors }, null, 2));

  if (errors.length) process.exit(2);
  if (hasStats !== 0) process.exit(3);
  if (hasDisc !== 1) process.exit(4);
  if (!cta || !cta.includes('Join Our Mission to Contribute More')) process.exit(5);
  if (!discBox || discBox.width < 200) process.exit(6);
  console.log('OK');
  await browser.close();
})();
```

Run:

```bash
node /tmp/jilljill-task12-verify.js
```

Expected: ends with `OK`.

- [ ] **Step 7: Commit**

```bash
git add index.html css/sections.css css/components.css
git commit -m "$(cat <<'EOF'
feat(impact): Jil-disc visual, India copy, removed unbacked stats, highlighted CTA

- Replaces the 💧 emoji + amber gradient with the new yellow Jil-disc SVG
- Drops the 3-tile impact-stats block (10K+/50+/200K+) — pre-launch numbers
- Updates lead paragraph to ₹1/rural-India copy
- Adds .btn-mission style with pulsing gold glow on the "Join Our Mission
  to Contribute More" CTA, suppressed under prefers-reduced-motion
- Removes the now-unused .impact-stats and .impact-stat CSS rules

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 13: Final full-page verification

**Files:** none modified — verification only.

- [ ] **Step 1: Write the comprehensive Playwright check**

Save to `/tmp/jilljill-phase-a-final.js`:

```js
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 900 });

  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  page.on('requestfailed', r => errors.push(`requestfailed: ${r.url()} ${r.failure()?.errorText}`));

  await page.goto('http://localhost:8000/', { waitUntil: 'networkidle' });

  const checks = {};

  // Hero
  await page.locator('#hero').scrollIntoViewIfNeeded();
  checks.heroSubtitle = await page.locator('.hero-subtitle').textContent();

  // About — no profile-stats
  await page.locator('#about').scrollIntoViewIfNeeded();
  checks.profileStatsCount = await page.locator('#about .profile-stats').count();
  checks.aboutHasMovingBillboard = (await page.locator('#about').textContent()).includes('moving billboard');

  // Problem — 4 stacks × 3 imgs × 3 captions
  await page.locator('#problem').scrollIntoViewIfNeeded();
  checks.problemStacks = await page.locator('#problem .card-img-stack').count();
  checks.problemImgs = await page.locator('#problem .card-img-stack img').count();
  checks.problemCaptions = await page.locator('#problem .card-text-stack p').count();

  // Solution — ₹1 / rural India line
  await page.locator('#solution').scrollIntoViewIfNeeded();
  checks.solutionEastAfrica = (await page.locator('#solution').textContent()).includes('East Africa');
  checks.solutionRuralIndia = (await page.locator('#solution').textContent()).includes('rural India');

  // Direct-to-Hand carousel — bigger container
  const containerBox = await page.locator('#carouselContainer').boundingBox();
  checks.carouselContainerWidth = containerBox && Math.round(containerBox.width);

  // Products — no labels
  await page.locator('#products').scrollIntoViewIfNeeded();
  checks.productNameCount = await page.locator('#products .product-name').count();
  checks.productSizeCount = await page.locator('#products .product-size').count();

  // Pricing
  await page.locator('#pricing').scrollIntoViewIfNeeded();
  const pricingTexts = await page.locator('#pricing .pricing-desc').allTextContents();
  checks.pricing = pricingTexts;

  // Impact
  await page.locator('#impact').scrollIntoViewIfNeeded();
  checks.impactStatsCount = await page.locator('#impact .impact-stats').count();
  checks.impactDiscCount = await page.locator('#impact .impact-disc img').count();
  checks.missionCta = await page.locator('#impact a.btn-mission').textContent();

  // Footer
  await page.locator('#footer').scrollIntoViewIfNeeded();
  checks.footerHasVillageLine = (await page.locator('#footer').textContent()).includes('a well closer to a village');

  // Existing carousels still alive
  checks.vendingCarouselImgs = await page.locator('#vendingCarousel img').count();
  checks.distributionCanvas = await page.locator('#distribution-canvas').count();

  // Wait through one Problem stagger cycle to confirm rotation works end-to-end
  await page.waitForTimeout(4800);
  const advanced = await page.$$eval('#problem .card-img-stack', stacks =>
    stacks.map(s => Array.from(s.querySelectorAll('img')).findIndex(i => i.classList.contains('active')))
  );
  checks.problemAdvanced = advanced;

  console.log(JSON.stringify({ checks, errors }, null, 2));

  // Hard assertions
  const fails = [];
  if (errors.length) fails.push('console/page errors present');
  if (!checks.heroSubtitle.includes('seen on every street')) fails.push('hero subtitle wrong');
  if (checks.profileStatsCount !== 0) fails.push('profile-stats not removed');
  if (!checks.aboutHasMovingBillboard) fails.push('about copy not updated');
  if (checks.problemStacks !== 4) fails.push(`problemStacks ${checks.problemStacks}`);
  if (checks.problemImgs !== 12) fails.push(`problemImgs ${checks.problemImgs}`);
  if (checks.problemCaptions !== 12) fails.push(`problemCaptions ${checks.problemCaptions}`);
  if (checks.solutionEastAfrica) fails.push('"East Africa" still present');
  if (!checks.solutionRuralIndia) fails.push('"rural India" missing');
  if (!checks.carouselContainerWidth || checks.carouselContainerWidth < 540) fails.push('carousel container too small');
  if (checks.productNameCount !== 0) fails.push('product-name not removed');
  if (checks.productSizeCount !== 0) fails.push('product-size not removed');
  if (!checks.pricing.some(t => t.includes('1,000 bottles'))) fails.push('Starter pricing wrong');
  if (!checks.pricing.some(t => t.includes('25,000 bottles'))) fails.push('Business pricing wrong');
  if (!checks.pricing.some(t => t.includes('50,000+ bottles'))) fails.push('Enterprise pricing wrong');
  if (checks.impactStatsCount !== 0) fails.push('impact-stats not removed');
  if (checks.impactDiscCount !== 1) fails.push('impact-disc missing');
  if (!checks.missionCta.includes('Join Our Mission to Contribute More')) fails.push('mission CTA copy wrong');
  if (!checks.footerHasVillageLine) fails.push('footer copy not updated');
  if (checks.vendingCarouselImgs < 3) fails.push('vending carousel broken');
  if (checks.distributionCanvas !== 1) fails.push('distribution canvas missing');
  if (checks.problemAdvanced.some(v => v === 0)) fails.push('problem-carousel did not advance any card after 4.8s');

  if (fails.length) {
    console.error('FAIL:', fails.join('; '));
    process.exit(1);
  }
  console.log('ALL CHECKS PASSED');
  await browser.close();
})();
```

- [ ] **Step 2: Run it**

```bash
node /tmp/jilljill-phase-a-final.js
```

Expected: ends with `ALL CHECKS PASSED` and exits 0. If it prints `FAIL:`, the listed string names which sub-check broke — re-open the relevant earlier task and fix.

- [ ] **Step 3: Visual sanity (manual or screenshots)**

Take three screenshots for the user to eyeball:

```bash
node -e "
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.setViewportSize({ width: 1280, height: 900 });
  await p.goto('http://localhost:8000/', { waitUntil: 'networkidle' });
  for (const sec of ['problem','solution','impact']) {
    await p.locator('#' + sec).scrollIntoViewIfNeeded();
    await p.waitForTimeout(400);
    await p.screenshot({ path: '/tmp/jilljill-phaseA-' + sec + '.png', fullPage: false });
  }
  await b.close();
  console.log('saved 3 screenshots to /tmp/jilljill-phaseA-*.png');
})();
"
```

Open the three PNGs (`/tmp/jilljill-phaseA-problem.png`, `-solution.png`, `-impact.png`) and confirm they look right. Surface them to the user before declaring success.

- [ ] **Step 4: Stop the dev server**

If you started a background server in Task 0:

```bash
# Find and stop the python http.server you started (adjust if you used npx/serve)
# On Windows Git Bash:
ps -W | grep python | head
# Then taskkill /PID <pid> /F  — or just leave it; nothing else here depends on it
```

This step is optional — leaving the server running is harmless.

---

## Spec coverage check (writing-plans self-review)

| Spec section | Covered by |
|---|---|
| §3 D1 — royalty-free images | Task 1 |
| §3 D2 — staggered 2.3 s problem cards | Tasks 2, 3, 4 |
| §3 D3 — 6 s carousel + 25 % size | Task 5 |
| §3 D4 — pricing tiers | Task 10 |
| §3 D5 — impact disc + India copy + CTA | Task 12 |
| §3 D6 — about stats removed | Task 7 |
| §3 D7 — warm-missional copy | Tasks 6, 7, 8, 11, 12 |
| §3 D8 — small JS module + stagger | Task 4 |
| §5.1 problem-carousel.js | Task 4 |
| §5.2 problem markup pattern | Task 3 |
| §5.3 carousel speed/size | Task 5 |
| §5.4 bottle portfolio | Task 9 |
| §5.5 impact section | Task 12 |
| §5.6 about stats | Task 7 |
| §5.7 copy | Tasks 6, 7, 8, 10, 11 |
| §6 data flow (none) | n/a — confirmed in Task 13 final sweep |
| §7 a11y / reduced-motion | Tasks 2, 4, 12 (all wired with `prefers-reduced-motion`) |
| §8 testing | Task 13 (Playwright sweep covers items 1–8 of spec §8) |
| §9 out-of-scope | Documented in plan header — no task touches Phase B/C surfaces |
| §10 rollback | Per-section commits enable per-section reverts; image rename approach honored (originals kept on disk) |

No coverage gaps. No placeholders.
