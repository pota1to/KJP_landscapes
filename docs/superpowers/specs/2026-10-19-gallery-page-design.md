# KJP Gallery Page Design

## Purpose

Add a dedicated gallery page that presents KJP Landscapes & Groundworks project photography as a tightly packed mosaic. The page should feel landscape-oriented on laptops while retaining the same varied masonry character in a vertically scrolling mobile layout.

The gallery must use the complete supplied image set. It must let visitors inspect every photograph at a larger size without leaving the page.

## Page and Navigation

- Add `gallery.html` with the canonical route `/gallery`.
- Add Gallery to the desktop and mobile header navigation on every page.
- Add Gallery to the footer navigation on every page.
- Mark Gallery as the current page only within `gallery.html`.
- Add the canonical gallery URL to `sitemap.xml`.
- Keep the existing header, phone call action, closing call-to-action and footer patterns.
- Use a compact introductory section headed “Our work” rather than a large photographic hero, so the gallery remains the visual focus.

## Gallery Layout

Use a deliberate CSS Grid mosaic rather than a JavaScript masonry library.

### Laptop and large tablet

- Use a five-column grid with a consistent narrow gap.
- Mix standard, wide and tall tiles to create the interlocking pattern shown in the supplied reference.
- Use dense grid placement so gaps are filled while the source order remains logical.
- Keep the overall composition visually wider than it is tall at the first viewport, then continue naturally down the page for the full image set.

### Mobile

- Use a two-column grid that continues vertically down the page.
- Retain a mixture of standard, wide and tall tiles instead of changing to a single uniform column.
- Allow selected wide tiles to span both columns.
- Preserve comfortable touch targets and a narrow but visible gap between photographs.

### Thumbnail treatment

- Fill each assigned tile using `object-fit: cover` and centered positioning.
- Do not distort or stretch photographs.
- Cropping applies only to mosaic thumbnails; the full-screen viewer shows the complete photograph.
- Each tile is a semantic button with an accessible name derived from useful alternative text.

## Image Assets

- Use all 56 photographs supplied for this feature, including the project-process photograph named `garden12 before.jpg`.
- Store gallery assets under `assets/gallery/` with predictable web-safe names.
- Create two WebP variants per source image:
  - a compact thumbnail suitable for the mosaic;
  - a larger image suitable for the full-screen viewer on laptop and mobile screens.
- Preserve each source image's orientation and aspect ratio in the larger variant.
- Do not overwrite or repurpose existing service and home-page assets.
- Load thumbnails lazily except for the first visible group, and decode them asynchronously.
- Preload only the neighbouring full-screen image when the viewer is open.

## Full-Screen Viewer

Implement the viewer with native HTML and the existing JavaScript module, without an external gallery dependency.

- Open the selected photograph in a modal layer covering the viewport.
- Display the complete image with `object-fit: contain` against a dark background.
- Provide visible previous, next and close buttons.
- Wrap navigation from the final image to the first image and from the first to the final image.
- Support `ArrowLeft`, `ArrowRight` and `Escape` keys.
- Support horizontal swipe gestures on touch devices with a movement threshold that avoids accidental changes during taps.
- Show the current position as “n of 56”.
- Prevent the page behind the viewer from scrolling.
- Restore focus to the originating thumbnail when the viewer closes.
- Keep focus within the modal while it is open and expose an appropriate accessible label.
- Closing must work through the close button, Escape key and clicking the dark backdrop outside the image controls.

## Progressive Enhancement

- Every gallery image remains visible if JavaScript is unavailable.
- JavaScript enhances the buttons with the modal viewer; navigation and the rest of the site remain usable if viewer initialisation fails.
- Avoid animation beyond a short opacity transition, and remove that transition when the user prefers reduced motion.

## Styling

- Reuse the site's cream background, dark green text, lime accent and existing typography.
- Keep the grid edge aligned with the site's standard content shell.
- Use subtle hover/focus treatment without covering the photographs with captions.
- Show a strong keyboard focus indicator on thumbnails and all viewer controls.
- Ensure viewer controls remain clearly visible over both light and dark photographs.

## Testing and Verification

Automated checks will cover:

- `/gallery` resolves in the local clean-URL test server.
- Gallery links exist in every header and footer and use the canonical extension-free route.
- `gallery.html` contains the complete expected image set and accessible thumbnail controls.
- All generated gallery assets exist and use valid dimensions/formats.
- The viewer opens the selected image, moves in both directions, wraps at each end and closes correctly.
- Keyboard navigation and focus restoration work.
- Swipe gestures change images in the expected direction.
- Existing navigation, service-page and asset tests continue to pass.

Visual verification will cover laptop, tablet and mobile widths, including:

- no empty grid holes or distorted thumbnails;
- a landscape-oriented multi-column composition on laptop;
- a two-column vertically scrolling masonry composition on mobile;
- no page scrolling behind the open viewer;
- complete images visible in both portrait and landscape orientations;
- navigation controls accessible without obscuring important image content.

## Acceptance Criteria

The feature is complete when all supplied photographs appear in the responsive mosaic, every tile opens the correct complete photograph, arrow/keyboard/swipe navigation works, the Gallery route is linked consistently throughout the site, generated assets are optimised, and the full automated and visual verification passes.
