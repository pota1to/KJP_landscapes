# KJP Gallery Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an optimised 56-image project gallery with responsive masonry layouts and an accessible full-screen viewer.

**Architecture:** A static `gallery.html` page supplies crawlable thumbnails and data attributes. CSS Grid provides a deliberate five-column desktop mosaic and two-column mobile mosaic, while a focused `gallery.mjs` module progressively enhances the page with a native-dialog viewer, cyclic navigation and touch gestures. A reproducible Pillow script generates separate thumbnail and full-screen WebP assets from the supplied originals.

**Tech Stack:** HTML5, CSS Grid, native `<dialog>`, browser JavaScript modules, Node.js test runner with headless Chrome, Python 3 with Pillow 12.

**Spec:** `docs/superpowers/specs/2026-10-19-gallery-page-design.md`

## Global Constraints

- Use every one of the 56 supplied photographs, including `garden12 before.jpg`.
- Use the extension-free canonical route `/gallery`; do not introduce `.html` internal links.
- Thumbnail cropping is allowed only through `object-fit: cover`; full-screen images must use their complete original framing.
- Laptop and large-tablet layout uses five CSS Grid columns; mobile layout uses two columns with wide and tall tile variations.
- Do not add a gallery or masonry dependency.
- Preserve keyboard navigation, visible focus, reduced-motion behaviour and no-JavaScript access to every thumbnail.
- Do not overwrite existing home, hero or service assets.
- Preserve the existing KJP header, call action, closing call-to-action and footer styling.

## Review Focus

- Portrait and landscape sources must both remain undistorted: asset tests pin bounding dimensions and browser tests pin `cover` thumbnails plus `contain` viewer images.
- An incomplete or malformed gallery item must not crash the rest of the page: viewer tests initialise against missing data and require a safe no-op.
- Predominantly vertical gestures must not change the image: unit tests exercise direction dominance as well as the 50px horizontal threshold.
- First/last boundaries must wrap without stale status or alternative text: browser tests exercise both ends.
- Closing by button, Escape or backdrop must restore scrolling and focus to the exact originating thumbnail: browser tests exercise all three paths.

---

### Task 0: Preserve the Clean-URL Test Environment

**Files:**
- Modify: `test/browser-harness.mjs`
- Modify: `test/service-pages.test.mjs`
- Modify: `test/site-links.test.mjs`

**Interfaces:**
- Produces: `startTestSite(rootPath) -> { origin: string, close(): Promise<void> }`, resolving `/gallery` to `gallery.html` when that page is added.

- [ ] **Step 1: Verify the existing clean-URL changes**

Run: `node --test test/navigation.test.mjs test/service-pages.test.mjs test/site-links.test.mjs`

Expected: 20 tests pass and 0 fail.

- [ ] **Step 2: Commit the existing test-environment fix separately**

```bash
git add test/browser-harness.mjs test/service-pages.test.mjs test/site-links.test.mjs
git commit -m "Fix clean URL test environment"
```

### Task 1: Generate Optimised Gallery Assets

**Files:**
- Create: `scripts/prepare-gallery-assets.py`
- Create: `assets/gallery/thumbs/gallery-01.webp` through `assets/gallery/thumbs/gallery-56.webp`
- Create: `assets/gallery/full/gallery-01.webp` through `assets/gallery/full/gallery-56.webp`
- Modify: `test/test_assets.py`

**Interfaces:**
- Consumes: a source directory passed as the first CLI argument; for this checkout use `/home/simas/Downloads/kjp`.
- Produces: `build_variants(source_dir: Path, output_dir: Path) -> None` and sequential `gallery-NN.webp` files in `thumbs/` and `full/`.

- [ ] **Step 1: Add a failing gallery-asset test**

Add `test_gallery_images_have_optimised_thumbnail_and_full_variants` asserting:

- both directories contain exactly `gallery-01.webp` through `gallery-56.webp`;
- every file opens as WEBP;
- thumbnails have a longest edge no greater than 720px and are no larger than 250 KiB;
- full images have a longest edge no greater than 1920px and are no larger than 900 KiB;
- every image has positive width and height.

Also include `gallery.html` in the page lists used by the existing favicon and removed-credit assertions; those two assertions should initially fail because the page does not exist yet, while running only the new asset test must fail because the gallery assets do not exist.

- [ ] **Step 2: Run the new asset test to verify it fails**

Run: `python3 -m unittest test.test_assets.ServiceAssetTests.test_gallery_images_have_optimised_thumbnail_and_full_variants`

Expected: FAIL with missing gallery asset directories/files.

- [ ] **Step 3: Implement the deterministic Pillow converter**

Define `GALLERY_SOURCES` in this exact supplied order:

```text
2b1bad94-721c-4660-86a1-99362ecf2941.jpeg
6d811fca-8c61-405a-b33b-7bfb413f328c.jpeg
9ade2f42-8209-493f-b5e9-236319005d67.jpeg
54d34ee3-2cc4-45bb-b0e3-063170e09e25.jpeg
astro1.jpg
astro2.jpg
d55ae2d5-b093-4a09-a501-06042d1a51c2.jpeg
df9fddf7-1ff9-4d69-88f3-b3d73aa72c19.jpeg
drain2.jpg
drive1.jpg
drive2.jpg
drive3.jpg
drive4.jpg
fencing1.jpg
fencing2.jpg
fencing5.jpg
fencing6.jpg
fencing7.jpg
garden1.jpg
garden2.jpg
garden3.jpg
garden4.jpg
garden5.jpg
garden6.jpg
garden7.jpg
garden10.jpg
garden11.jpg
garden12 before.jpg
groundworks1.jpg
Hero.jpeg
patio4.jpg
patio5.jpg
patio6.jpg
patio7.jpg
patio9.jpg
paving1.jpg
paving2.jpg
raised beds3.jpg
raised beds4.jpg
stairs2.jpg
turfing1.jpg
drain1-edited.png
fencing3 edited.png
fencing4 aedited.png
garden6 edited.png
garden9 aedited.png
garden8 aedited.png
garden12 aedited.png
patio3 aedited.png
patio2 edited.png
patio1 aedited.png
patio8 aedited.png
patio10 aedited.png
raised1 beds edited.png
raised beds2 aedited.png
stairs1 aedited.png
```

For each source, apply EXIF orientation, convert to RGB, resize without enlargement using `Image.Resampling.LANCZOS`, and save:

- thumbnail: 720px bounding box, WEBP quality 78, method 6;
- full: 1920px bounding box, WEBP quality 85, method 6.

The second optional CLI argument is the output directory and defaults to `assets/gallery`.

- [ ] **Step 4: Generate the checked-in assets**

Run: `python3 scripts/prepare-gallery-assets.py /home/simas/Downloads/kjp assets/gallery`

Expected: 56 thumbnails and 56 full images with sequential filenames.

- [ ] **Step 5: Run the gallery-asset test**

Run: `python3 -m unittest test.test_assets.ServiceAssetTests.test_gallery_images_have_optimised_thumbnail_and_full_variants`

Expected: PASS.

- [ ] **Step 6: Commit the asset pipeline and generated files**

```bash
git add scripts/prepare-gallery-assets.py assets/gallery test/test_assets.py
git commit -m "Add optimised gallery image assets"
```

### Task 2: Add the Gallery Page and Site-Wide Route

**Files:**
- Create: `gallery.html`
- Create: `test/gallery.test.mjs`
- Modify: `index.html`
- Modify: `groundworks-structural.html`
- Modify: `hardscaping-features.html`
- Modify: `lawns-decking.html`
- Modify: `about.html`
- Modify: `test/site-links.test.mjs`
- Modify: `test/test_assets.py`
- Modify: `sitemap.xml`

**Interfaces:**
- Consumes: sequential thumbnail/full asset pairs from Task 1.
- Produces: canonical `/gallery` route and 56 `[data-gallery-item]` buttons with `data-full`, `data-gallery-size` and child `<img>` elements.

- [ ] **Step 1: Write failing page, navigation and sitemap tests**

In `test/gallery.test.mjs`, add `gallery page exposes all supplied projects as accessible controls` asserting:

- one `<h1>` with text `Our work`;
- exactly 56 unique `[data-gallery-item]` buttons;
- each button has a non-empty accessible label, `data-full="assets/gallery/full/gallery-NN.webp"`, and one image using the matching thumbnail;
- the first eight thumbnails use `loading="eager"`, the remaining 48 use `loading="lazy"`, and all use `decoding="async"`;
- tile sizes are limited to `standard`, `wide`, `tall` and `feature`.

Extend `htmlPages` and `requiredPageLinks` in `test/site-links.test.mjs` with `gallery.html` and `/gallery`. Add an assertion that `sitemap.xml` contains exactly one `https://kjplandscapes.co.uk/gallery` entry. Keep the existing assertion that the footer does not contain the old text `Our work`; the new navigation label is `Gallery`.

- [ ] **Step 2: Run the focused tests to verify they fail**

Run: `node --test test/gallery.test.mjs test/site-links.test.mjs`

Expected: FAIL because `gallery.html` and `/gallery` links do not exist.

- [ ] **Step 3: Create the static gallery page**

Use the existing page shell and add:

- canonical `https://kjplandscapes.co.uk/gallery`;
- the existing favicon, `styles.css`, `script.mjs` and analytics script; defer the `gallery.mjs` module reference until Task 4 so this task has no missing resources;
- compact intro copy: eyebrow `Project gallery`, heading `Our work`, and `A selection of paving, landscaping and groundwork projects completed across Sunderland and Tyne and Wear.`;
- a `.gallery-grid[data-gallery-grid]` containing all 56 semantic buttons in source order;
- concise, content-specific alternative text for each photograph without inventing locations or customer details;
- a closing call section using eyebrow `Plan your project`, heading `Let’s make more of your outdoors.`, the existing supporting sentence and telephone action;
- a native `<dialog data-gallery-dialog>` shell with previous, next, close, image and `n of 56` status elements.

Apply a balanced repeating tile-size sequence that starts `feature, standard, tall, wide, standard, tall, standard, wide` and includes every size within each subsequent group of eight. The sequence controls thumbnail shape only.

- [ ] **Step 4: Add Gallery navigation everywhere**

Add `<a href="/gallery">Gallery</a>` immediately before About in every header and footer. Set `aria-current="page"` only on the two Gallery links in `gallery.html`. Add the gallery URL to `sitemap.xml`.

- [ ] **Step 5: Run page and route tests**

Run: `node --test test/gallery.test.mjs test/site-links.test.mjs && python3 -m unittest test.test_assets`

Expected: page/navigation tests pass; asset suite also passes now that `gallery.html` exists.

- [ ] **Step 6: Commit the static page and route**

```bash
git add gallery.html index.html groundworks-structural.html hardscaping-features.html lawns-decking.html about.html sitemap.xml test/gallery.test.mjs test/site-links.test.mjs test/test_assets.py
git commit -m "Add gallery page and navigation"
```

### Task 3: Build the Responsive Mosaic

**Files:**
- Modify: `styles.css`
- Modify: `test/gallery.test.mjs`

**Interfaces:**
- Consumes: `[data-gallery-size]` values from Task 2.
- Produces: `.gallery-grid` geometry and `.gallery-item` tile presentation at desktop and mobile widths.

- [ ] **Step 1: Write failing responsive-layout tests**

Add `gallery uses a five-column landscape mosaic on laptop and a two-column vertical mosaic on mobile`. At 1440×1000 assert:

- computed grid has five columns and `grid-auto-flow: dense`;
- wide tiles are wider than standard tiles, tall tiles are taller, and feature tiles are both;
- every thumbnail computes to `object-fit: cover`;
- the document has no horizontal overflow.

At 390×844 assert:

- computed grid has two columns and `grid-auto-flow: dense`;
- at least one wide tile spans both columns;
- both tall and standard tile shapes remain present;
- grid height exceeds four times its width, proving the composition continues vertically;
- no horizontal overflow and every thumbnail remains visible.

Add a no-JavaScript browser pass asserting all 56 thumbnails remain visible.

- [ ] **Step 2: Run the responsive test to verify it fails**

Run: `node --test --test-name-pattern="five-column|two-column|no-JavaScript" test/gallery.test.mjs`

Expected: FAIL because gallery layout styles are missing.

- [ ] **Step 3: Implement gallery component styles**

Append a focused Gallery section in `styles.css` before the responsive overrides:

- desktop grid: `repeat(5, minmax(0, 1fr))`, `grid-auto-flow: dense`, and consistent clamped auto rows/gaps;
- `standard` 1×1, `wide` 2×1, `tall` 1×2, `feature` 2×2;
- mobile breakpoint at 760px: two columns with touch-friendly clamped rows, retaining the same size rules;
- button reset, overflow clipping, centered cover images, hover treatment and strong `:focus-visible` outline;
- compact intro spacing aligned to `.section-shell`;
- reduced-motion rule that disables gallery transitions.

- [ ] **Step 4: Run the responsive tests**

Run: `node --test test/gallery.test.mjs`

Expected: static page and responsive layout tests pass; viewer tests have not been added yet.

- [ ] **Step 5: Commit the responsive mosaic**

```bash
git add styles.css test/gallery.test.mjs
git commit -m "Style responsive masonry gallery"
```

### Task 4: Add the Accessible Full-Screen Viewer

**Files:**
- Create: `gallery.mjs`
- Modify: `gallery.html`
- Modify: `styles.css`
- Modify: `test/gallery.test.mjs`

**Interfaces:**
- Produces: `normaliseGalleryIndex(index: number, count: number) -> number`.
- Produces: `getSwipeStep(gesture: { startX: number, startY: number, endX: number, endY: number }, threshold?: number) -> -1 | 0 | 1`; left swipe returns `1`, right swipe returns `-1`, short or vertically dominant gestures return `0`.
- Produces: `createGalleryViewer(root: Element | null) -> { open(index: number): void, close(): void, show(index: number): void, destroy(): void }`; invalid or incomplete roots return safe no-op methods.

- [ ] **Step 1: Write failing unit tests for index and swipe logic**

Assert positive/negative wrapping for 56 items, a thrown error for a non-positive count, 49px movement returning zero, 50px horizontal movement returning the correct step, and a 100px horizontal/120px vertical gesture returning zero.

- [ ] **Step 2: Write failing browser tests for the viewer**

Cover:

- clicking item 10 opens its matching full image and status `10 of 56`;
- next/previous buttons and Arrow keys update source, alternative text and status;
- previous from item 1 wraps to 56 and next from 56 wraps to 1;
- simulated pointer swipes navigate while a vertically dominant gesture does not;
- the viewer image computes to `object-fit: contain` for portrait and landscape sources;
- the body cannot scroll while open;
- close button, Escape and backdrop each close, restore body scrolling and restore focus to the originating thumbnail;
- rapid next/previous actions leave the final requested image and status in sync;
- importing/initialising against missing or malformed markup does not throw;
- no browser console errors occur.

- [ ] **Step 3: Run viewer tests to verify they fail**

Run: `node --test --test-name-pattern="index|swipe|viewer|wrap|focus|malformed" test/gallery.test.mjs`

Expected: FAIL because `gallery.mjs` and behaviour are missing.

- [ ] **Step 4: Implement the viewer module**

Add `<script type="module" src="gallery.mjs"></script>` to `gallery.html`, then use the dialog and gallery data attributes from Task 2. On open/show, synchronously update the full image source, alt text and status, then preload the previous and next full assets with `new Image()`. Use `showModal()`, the body class `gallery-viewer-open`, native dialog focus handling plus explicit origin-focus restoration. Listen for clicks, keyboard events and pointer gestures; backdrop close only when `event.target === dialog`. Wrap every index through `normaliseGalleryIndex`.

- [ ] **Step 5: Style the full-screen viewer**

Add dark full-viewport dialog/backdrop styling, centered `object-fit: contain` imagery, high-contrast 44px-minimum controls, safe-area-aware close positioning, mobile arrow placement and body scroll locking. Disable viewer transitions under `prefers-reduced-motion: reduce`.

- [ ] **Step 6: Run gallery behaviour tests**

Run: `node --test test/gallery.test.mjs`

Expected: all gallery tests pass.

- [ ] **Step 7: Run the complete automated suite**

Run: `node --test test/navigation.test.mjs test/service-pages.test.mjs test/site-links.test.mjs test/gallery.test.mjs && python3 -m unittest test.test_assets`

Expected: all Node and Python tests pass with 0 failures.

- [ ] **Step 8: Perform visual verification**

Run the clean-URL local server and inspect `/gallery` at 1440×1000, 1024×768, 760×900, 390×844 and 320×700. Open both landscape and portrait images at each relevant width. Verify the layout, complete-image framing, controls, swipe-sized touch targets, focus indicators, body lock and absence of horizontal overflow against the design spec.

- [ ] **Step 9: Check syntax and whitespace**

Run: `node --check gallery.mjs && node --check script.mjs && git diff --check`

Expected: all commands exit 0 with no output from `git diff --check`.

- [ ] **Step 10: Commit the viewer and final verification fixes**

```bash
git add gallery.mjs gallery.html styles.css test/gallery.test.mjs
git commit -m "Add full-screen gallery viewer"
```
