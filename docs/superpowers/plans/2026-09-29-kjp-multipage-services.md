# KJP Multi-page Services Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the existing KJP homepage into a static five-page website with three service-category pages, a dedicated About page, an accessible mobile/tablet burger menu, and eight locally hosted stock images.

**Architecture:** Keep the existing plain HTML/CSS/ES module structure and duplicate the small shared header/footer markup across pages so every page works without a build step. Add one reusable menu initialiser beside the guarded carousel initialiser, reusable page/detail CSS, local WebP assets, and browser-level tests using headless Chrome with no runtime dependencies.

**Tech Stack:** HTML5, CSS, ECMAScript modules, Node.js built-in test runner, headless Google Chrome, Python 3/Pillow for asset preparation, GitHub Pages-compatible relative paths.

**Spec:** `docs/superpowers/specs/2026-09-29-kjp-multipage-services-design.md`

## Global Constraints

- Keep the site deployable as plain static files with no package manager, framework, build step, CMS, server-side code, or runtime third-party requests.
- Use `980px` as the desktop/mobile-tablet navigation breakpoint.
- Keep `tel:07745061601` as a separately visible sticky-header action at every viewport.
- Use relative page and asset paths that work beneath a GitHub Pages repository subpath.
- Keep all photography rectangular with no rounded corners.
- Store service imagery locally as centred 1200×900 WebP files and lazy-load it below the page introduction.
- Use a desktop `2fr 1fr` service-detail grid so photography occupies no more than one-third of each subsection.
- Stack mobile service content in text-then-image reading order.
- Mark service-page stock photography as illustrative and credit every source in `credits.html`.
- Preserve the homepage carousel's three desktop states, six mobile states, square crops, and non-clickable images.
- Do not invent accreditations, awards, guarantees, testimonials, team size, or new named coverage areas.

## File Structure

- Modify `index.html` for multi-page navigation, service links, About link, shared footer links, and menu markup.
- Modify `styles.css` for menu, page introductions, service-detail grids, About, Credits, and responsive behaviour.
- Modify `script.mjs` for reusable burger-menu state and event handling while retaining guarded carousel setup.
- Create `groundworks-structural.html`, `hardscaping-features.html`, `lawns-decking.html`, `about.html`, and `credits.html`.
- Create eight `assets/service-*.webp` stock assets.
- Create `test/browser-harness.mjs` for local-server and Chrome DevTools Protocol test support.
- Create `test/navigation.test.mjs`, `test/service-pages.test.mjs`, `test/site-links.test.mjs`, and `test/test_assets.py`.

## Review Focus

- JavaScript disabled at mobile width: full primary navigation remains visible and page links still work; pin this in Task 1's browser test.
- Menu open while crossing above `980px`: menu closes, state resets, and desktop navigation is visible; pin this in Task 1's browser test.
- Service pages contain no carousel: shared `script.mjs` loads without console errors; pin this in Task 3's browser test.
- A 320px-wide header: full KJP name, burger, and call action remain usable without horizontal overflow; pin this in Task 4's browser test.
- GitHub Pages repository subpath: every internal page and local asset uses a relative URL and resolves from the test server; pin this in Task 4's link test.

---

### Task 1: Browser Harness and Responsive Navigation

**Files:**
- Create: `test/browser-harness.mjs`
- Create: `test/navigation.test.mjs`
- Modify: `index.html:17-35`
- Modify: `styles.css:124-227, 695-779, 912-935`
- Modify: `script.mjs:1-152`

**Interfaces:**
- Produces: `getMenuPresentation(isOpen: boolean) -> { expanded: string, label: string }` in `script.mjs`.
- Produces: `createNavigationMenu(header: HTMLElement, desktopMedia?: MediaQueryList) -> { open(): void, close(options?): void, destroy(): void }` in `script.mjs`.
- Produces: test helpers `startTestSite(rootPath)`, `launchBrowser()`, and a browser session exposing `goto(path, viewport)`, `evaluate(expression)`, `click(selector)`, `press(key)`, and `close()`.
- Consumes: existing header markup, colour variables, and sticky call button.

- [ ] **Step 1: Create the browser test harness**

In `test/browser-harness.mjs`, use Node's child-process APIs, a local `python3 -m http.server`, headless Chrome remote debugging, and Node's built-in `WebSocket` to provide the exact helper interfaces named above.

- [ ] **Step 2: Write the failing navigation tests**

In `test/navigation.test.mjs`, assert:

```js
test('mobile menu opens and closes accessibly', async () => {
  // At 760×900: toggle is visible; nav is initially closed.
  // Clicking toggle sets aria-expanded="true", label="Close menu", and reveals nav.
  // Escape closes nav and returns focus to the toggle.
  // Clicking outside and clicking a nav link also close it.
});

test('navigation resets at desktop width and degrades without JavaScript', async () => {
  // Opening at 760px then resizing to 1200px resets the menu and shows desktop nav.
  // With JavaScript disabled at 760px, the complete nav remains visible.
});
```

Also add direct assertions for `getMenuPresentation(false)` returning `{ expanded: 'false', label: 'Open menu' }` and `getMenuPresentation(true)` returning `{ expanded: 'true', label: 'Close menu' }`.

- [ ] **Step 3: Run the navigation tests to verify RED**

Run: `node --test test/navigation.test.mjs`

Expected: FAIL because `getMenuPresentation`, `[data-menu-toggle]`, and responsive menu behaviour do not exist.

- [ ] **Step 4: Add accessible shared header markup to the homepage**

In `index.html`, make the brand link `index.html`; replace the three fragment nav links with Home, the three category pages, and About; add `id="site-navigation" data-site-nav` to the nav; add a hidden-by-default `.menu-toggle[data-menu-toggle]` button with `aria-controls="site-navigation"`, `aria-expanded="false"`, and three decorative burger lines. Mark Home with `aria-current="page"`.

- [ ] **Step 5: Implement menu state and event handling**

In `script.mjs`, export the two interfaces above. `createNavigationMenu` must validate required elements, remove the toggle's `hidden` attribute, add `.menu-ready` to the header, synchronise `aria-expanded`, label, panel state, and `.menu-open`, and implement toggle click, link click, outside click, Escape with focus return, and desktop media-query reset. Its `destroy()` removes every listener and restores the progressive-enhancement defaults.

Initialise each `.site-header` only when `document` exists. Keep carousel initialisation guarded by `.carousel` presence.

- [ ] **Step 6: Add desktop and mobile/tablet menu styling**

Keep `.menu-toggle` hidden above `980px`. At `980px` and below, use the existing header colours and square-cornered styling; when `.menu-ready` is present, show the burger and turn `.site-nav` into a full-width panel below the sticky header. Preserve a visible no-JavaScript nav when `.menu-ready` is absent. Add current-page and focus states, 44px targets, and reduced-motion-safe transitions.

- [ ] **Step 7: Run navigation tests to verify GREEN**

Run: `node --test test/navigation.test.mjs`

Expected: PASS for mobile interactions, desktop reset, and no-JavaScript fallback.

- [ ] **Step 8: Run carousel regression checks**

Run: `node --input-type=module -e "import { getCarouselPageState, getRelativeSlideOffset } from './script.mjs'; if (getCarouselPageState(6, 2, 2).pageCount !== 3) throw new Error('desktop'); if (getCarouselPageState(6, 5, 1).pageCount !== 6) throw new Error('mobile'); if (getRelativeSlideOffset(184, 184) !== 0) throw new Error('offset');"`

Expected: exit 0.

- [ ] **Step 9: Commit**

```bash
git add index.html styles.css script.mjs test/browser-harness.mjs test/navigation.test.mjs
git commit -m "Add responsive site navigation"
```

### Task 2: Optimised Stock Assets and Credits

**Files:**
- Create: `test/test_assets.py`
- Create: `assets/service-concrete.webp`
- Create: `assets/service-drainage.webp`
- Create: `assets/service-paving.webp`
- Create: `assets/service-fencing.webp`
- Create: `assets/service-raised-beds.webp`
- Create: `assets/service-decking.webp`
- Create: `assets/service-turfing.webp`
- Create: `assets/service-artificial-grass.webp`
- Create: `credits.html`

**Interfaces:**
- Consumes: the eight exact Pexels source pages and author/title metadata in the design spec.
- Produces: eight 1200×900 WebP files named above and a Credits page linking each file to its source page.

- [ ] **Step 1: Write the failing asset tests**

Use `unittest`, Pillow, and `html.parser`. Assert that all eight files exist, report format `WEBP`, dimensions `(1200, 900)`, and size at most 350 KB. Parse `credits.html` and assert it contains eight HTTPS Pexels photo links, each expected photographer name, an “Illustrative stock photography” notice, the shared stylesheet, and relative navigation.

- [ ] **Step 2: Run the asset tests to verify RED**

Run: `python3 -m unittest test/test_assets.py -v`

Expected: FAIL because all eight service assets and `credits.html` are absent.

- [ ] **Step 3: Download the approved source images**

Use the Pexels free-download action from each source page in the design spec. Save originals in a temporary directory outside the repository; do not commit originals or hotlink Pexels CDN URLs.

- [ ] **Step 4: Convert and optimise assets**

Use `PIL.ImageOps.fit(image.convert('RGB'), (1200, 900), centering=(0.5, 0.5))`, then save WebP with `quality=82` and `method=6`. If any output exceeds 350 KB, lower quality in small increments without changing dimensions or cropping.

- [ ] **Step 5: Create `credits.html`**

Use the shared header/footer structure, unique title and description, one `h1`, an explanatory notice that these images are illustrative, and one source link for each service image. Mark no page as KJP project work.

- [ ] **Step 6: Run the asset tests to verify GREEN**

Run: `python3 -m unittest test/test_assets.py -v`

Expected: PASS for all asset and credit assertions.

- [ ] **Step 7: Commit**

```bash
git add assets/service-*.webp credits.html test/test_assets.py
git commit -m "Add credited service stock imagery"
```

### Task 3: Three Service-category Pages

**Files:**
- Create: `test/service-pages.test.mjs`
- Create: `groundworks-structural.html`
- Create: `hardscaping-features.html`
- Create: `lawns-decking.html`
- Modify: `styles.css`

**Interfaces:**
- Consumes: Task 1's shared header/menu contract and Task 2's eight `assets/service-*.webp` files.
- Produces: `.page-intro`, `.service-details`, `.service-detail`, `.service-detail__copy`, `.service-detail__media`, and `.stock-note` markup/styling used by the three category pages.

- [ ] **Step 1: Write the failing service-page browser tests**

In `test/service-pages.test.mjs`, use the browser harness to assert:

- All three URLs return a document with one unique `h1`, correct page title/description, shared menu, call link, closing CTA, footer, and current-page navigation state.
- Groundworks contains exactly Concrete Work and Drainage Solutions.
- Hardscaping contains exactly Paving & Patios, Fencing & Privacy, and Raised Beds.
- Lawns contains exactly Premium Decking, Turfing & Lawns, and Artificial Grass.
- Each detail has one local service image with non-empty alt text, explicit `1200`×`900`, `loading="lazy"`, and a nearby illustrative-stock notice.
- At 1200px, odd sections place text left/image right; even sections place image left/text right; each image width is no more than one-third of its section width.
- At 390px, every detail uses one column and the text begins above the image.
- Loading each service page produces no JavaScript console errors despite having no carousel.

- [ ] **Step 2: Run the service-page tests to verify RED**

Run: `node --test test/service-pages.test.mjs`

Expected: FAIL because the three pages and reusable service-detail styles do not exist.

- [ ] **Step 3: Add reusable page and service-detail styles**

Add compact `.page-intro` styling that follows the current green editorial system. Add a bordered `.service-details` sequence and a `2fr 1fr` `.service-detail` grid. Use CSS placement on even sections while retaining text-before-image DOM order. Style every media frame at `aspect-ratio: 4 / 3`, `overflow: hidden`, `border-radius: 0`, with centred cover cropping. At `760px` and below, use one column and restore copy then image placement.

- [ ] **Step 4: Create `groundworks-structural.html`**

Add unique metadata and generic copy from the spec for Concrete Work and Drainage Solutions. Use `service-concrete.webp` and `service-drainage.webp`. Include the shared header, menu markup, call action, stock notice, closing CTA, footer, and Credits link. Mark Groundworks & Structural as current.

- [ ] **Step 5: Create `hardscaping-features.html`**

Add unique metadata and generic copy from the spec for Paving & Patios, Fencing & Privacy, and Raised Beds. Use `service-paving.webp`, `service-fencing.webp`, and `service-raised-beds.webp`. Mark Hardscaping & Features as current.

- [ ] **Step 6: Create `lawns-decking.html`**

Add unique metadata and generic copy from the spec for Premium Decking, Turfing & Lawns, and Artificial Grass. Use `service-decking.webp`, `service-turfing.webp`, and `service-artificial-grass.webp`. Avoid “maintenance-free” wording. Mark Lawns & Decking as current.

- [ ] **Step 7: Run the service-page tests to verify GREEN**

Run: `node --test test/service-pages.test.mjs`

Expected: PASS for page content, image semantics, alternating desktop layout, mobile order, and no-console-error checks.

- [ ] **Step 8: Commit**

```bash
git add groundworks-structural.html hardscaping-features.html lawns-decking.html styles.css test/service-pages.test.mjs
git commit -m "Add service category pages"
```

### Task 4: About Page and Site-wide Linking

**Files:**
- Create: `test/site-links.test.mjs`
- Create: `about.html`
- Modify: `index.html`
- Modify: `groundworks-structural.html`
- Modify: `hardscaping-features.html`
- Modify: `lawns-decking.html`
- Modify: `credits.html`
- Modify: `styles.css`

**Interfaces:**
- Consumes: Task 1's navigation markup and Task 3's page shell.
- Produces: complete relative cross-page navigation, homepage service links, `.about-page` content, and consistent footer links across all six HTML documents.

- [ ] **Step 1: Write the failing About and internal-link tests**

Assert in `test/site-links.test.mjs` that:

- `about.html` has one `h1`, references over 20 years of experience, Sunderland and Tyne and Wear, the practical four-part working approach, the three service-category pages, and a telephone CTA.
- About contains no `.about-stat`, accreditation, award, guarantee, testimonial, or invented team-size text.
- Every homepage service-category heading and service row points to its category page; the homepage About link points to `about.html`.
- Every HTML page uses `index.html` for the brand link and contains relative links to Home, all three services, About, and Credits.
- Fetching every internal HTML, stylesheet, script, and image URL from the local server returns HTTP 200.
- At a 320px viewport, the header has no horizontal overflow and the full KJP name, burger button, and call action have visible bounding boxes at least 44px high where interactive.

- [ ] **Step 2: Run the site-link tests to verify RED**

Run: `node --test test/site-links.test.mjs`

Expected: FAIL because `about.html`, homepage category links, and consistent site-wide links are incomplete.

- [ ] **Step 3: Create `about.html`**

Use unique title/description and the shared header/footer. Write concise sections for the existing over-20-years statement, the working approach (understand, prepare, communicate, finish), the service range, and Sunderland/surrounding Tyne and Wear coverage. Add direct category links and the telephone CTA. Do not add a decorative monogram panel or unverified claims.

- [ ] **Step 4: Convert homepage service content into links**

In `index.html`, link each service-group heading and each service row to its category page with a full-width, keyboard-focusable anchor while preserving current spacing and arrow styling. Change the homepage About text link to `about.html`; retain a separate phone CTA where present.

- [ ] **Step 5: Standardise headers and footers across all pages**

Ensure the six HTML documents use identical navigation order and relative paths, page-specific `aria-current="page"`, brand link, call button, Home link, three category links, About link, and Credits footer link. On the homepage, retain an “Our work” link to `index.html#gallery` in the footer without adding it to the primary five-link navigation.

- [ ] **Step 6: Add linked-service and About-page styling**

Preserve the current service-grid appearance while making linked rows and headings visibly focusable and full-width. Add reusable About-page editorial sections and the 320px header adjustments needed to keep the full brand, burger, and call action visible without overflow.

- [ ] **Step 7: Run the site-link tests to verify GREEN**

Run: `node --test test/site-links.test.mjs`

Expected: PASS for About content, relative links, all local HTTP responses, and the 320px header.

- [ ] **Step 8: Commit**

```bash
git add about.html index.html groundworks-structural.html hardscaping-features.html lawns-decking.html credits.html styles.css test/site-links.test.mjs
git commit -m "Connect multi-page site and add About page"
```

### Task 5: Full Regression and Visual Verification

**Files:**
- Modify only if verification exposes a scoped defect: `index.html`, `groundworks-structural.html`, `hardscaping-features.html`, `lawns-decking.html`, `about.html`, `credits.html`, `styles.css`, `script.mjs`, or the owning test.

**Interfaces:**
- Consumes: Tasks 1–4 complete site and test suite.
- Produces: verified deployable static site with no unresolved failures.

- [ ] **Step 1: Run the complete Node test suite**

Run: `node --test test/*.test.mjs`

Expected: all Node tests PASS with zero failures.

- [ ] **Step 2: Run the complete asset test suite**

Run: `python3 -m unittest test/test_assets.py -v`

Expected: all asset tests PASS.

- [ ] **Step 3: Check JavaScript syntax**

Run: `node --check script.mjs`

Expected: exit 0.

- [ ] **Step 4: Check repository diff formatting**

Run: `git diff --check`

Expected: exit 0 with no output.

- [ ] **Step 5: Capture desktop screenshots for every primary page**

At 1440×1000, capture the homepage, three service pages, and About page. Verify the editorial hierarchy, sticky header, full navigation, call button, image one-third limit, alternating placement, no rounded photography, and no horizontal overflow.

- [ ] **Step 6: Capture mobile screenshots for every primary page**

At 390×844 and 320×700, capture the same pages with the menu closed and one representative page with it open. Verify full brand visibility, separate call action, burger accessibility, text-before-image stacking, readable copy, and no clipping or overlap.

- [ ] **Step 7: Exercise interactive regressions manually in the browser**

Verify homepage carousel arrows, indicators, swipe, three desktop states, six mobile states, and zero initial offset. Verify menu toggle, Escape, outside click, link click, focus return, desktop resize, and call links. Disable JavaScript once at mobile width and confirm primary navigation remains usable.

- [ ] **Step 8: Fix only failures found by Steps 1–7 and rerun their owning checks**

Do not broaden scope. For each code defect, add or tighten the failing automated test first, observe RED, make the minimal fix, and rerun the full suite.

- [ ] **Step 9: Commit final verification fixes, if any**

```bash
git add index.html groundworks-structural.html hardscaping-features.html lawns-decking.html about.html credits.html styles.css script.mjs test assets
git commit -m "Verify responsive multi-page services site"
```

If no fixes were required, do not create an empty commit.
