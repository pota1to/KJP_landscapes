# KJP Multi-page Services Website Design

Date: 29 September 2026  
Status: Approved design

## Goal

Expand the existing KJP Landscapes & Groundworks homepage into a fast, accessible, static five-page website. Add three service-category pages and a dedicated About page while retaining the current green editorial visual direction, rectangular photography, fixed call action, and straightforward GitHub Pages deployment.

## Scope

The site will contain:

- `index.html` — existing homepage, updated for multi-page navigation.
- `groundworks-structural.html` — Concrete Work and Drainage Solutions.
- `hardscaping-features.html` — Paving & Patios, Fencing & Privacy, and Raised Beds.
- `lawns-decking.html` — Premium Decking, Turfing & Lawns, and Artificial Grass.
- `about.html` — business overview, approach, experience, services, and coverage.
- `credits.html` — stock-image source and photographer credits.
- Shared `styles.css`, `script.mjs`, favicon, call-to-action, footer, and locally stored image assets.

The site remains plain HTML, CSS, and JavaScript with no framework, package manager, build step, CMS, form backend, analytics, map, or server-side code.

## Information Architecture and Links

Every page will use the same primary navigation order:

1. Home
2. Groundworks & Structural
3. Hardscaping & Features
4. Lawns & Decking
5. About

The current page will be marked with `aria-current="page"`. The KJP brand will link to `index.html` on every page. The telephone button will remain a separate `tel:07745061601` action in the sticky header.

On the homepage:

- Each service category heading and its service rows will link to the relevant category page.
- The About section's text link will lead to `about.html`.
- Gallery navigation remains an on-page section rather than a separate page.

The footer will provide Home, Services, About, and Credits access. All paths will be relative so the extracted folder works locally and on GitHub Pages, including project sites hosted below a repository path.

## Responsive Navigation

Desktop navigation remains visible above `980px`. At `980px` and below, the full navigation is replaced by a burger button while the call button stays independently visible.

The mobile/tablet menu will:

- Use a native button with `aria-expanded`, `aria-controls`, and an accessible label that reflects its state.
- Open a rectangular editorial navigation panel below the sticky header.
- Close when the burger is pressed again, a navigation link is selected, Escape is pressed, or the user clicks outside the panel.
- Return focus to the burger after Escape closes the menu.
- Close automatically if the viewport crosses back into desktop width.
- Preserve visible focus styles and minimum 44px interactive targets.

The menu will use progressive enhancement. The burger is hidden and the navigation remains accessible by default. JavaScript will add a ready state before mobile-only hiding and toggling are activated. If JavaScript does not run, visitors still receive the full navigation.

## Service Page Structure

Each category page will contain:

1. Sticky shared header.
2. Compact editorial page introduction with eyebrow, `h1`, short category description, and telephone call-to-action.
3. A sequence of service-detail sections.
4. Existing green closing call-to-action.
5. Shared footer.

Every service-detail section will place its descriptive text before its image in the HTML for consistent reading order. Desktop CSS will use a `2fr 1fr` grid:

- Odd sections: text left, image right.
- Even sections: image left, text right through CSS grid placement.
- The image column is no more than one-third of the available subsection width.

At mobile widths, every section becomes a single column with text followed by image. Images use a consistent `4 / 3` frame, centred `object-fit: cover` cropping, no rounded corners, explicit dimensions, lazy loading, and descriptive alternative text.

### Groundworks & Structural

Page introduction: practical preparation and below-ground work that supports reliable outdoor improvements.

- Concrete Work — generic content covering bases, slabs, paths, hardstanding, careful preparation, levels, and a tidy finish.
- Drainage Solutions — generic content covering standing-water assessment, suitable falls, channels, pipework, soakaway-style solutions where appropriate, and integration with the surrounding surface.

Content will avoid engineering guarantees, planning advice, or claims that a solution is appropriate without assessing the site.

### Hardscaping & Features

Page introduction: functional, well-finished structures that make gardens easier to use and maintain.

- Paving & Patios — preparation, layout, material choices, usable seating areas, paths, edges, and drainage considerations.
- Fencing & Privacy — boundaries, privacy, replacement panels, posts, gates, durability, and fit with the garden.
- Raised Beds — timber or masonry-style raised areas, practical heights, defined planting zones, soil retention, and integration with paths or patios.

### Lawns & Decking

Page introduction: durable surfaces and greener spaces designed around how the garden will be used.

- Premium Decking — sub-base preparation, framing, boards, edges, steps, access, and outdoor seating areas.
- Turfing & Lawns — ground preparation, levelling, fresh turf, edges, establishment guidance, and practical lawn layouts.
- Artificial Grass — excavation and base preparation, drainage, secure edges, neat joins, and lower-maintenance garden use.

Content will avoid absolute statements such as “maintenance-free” and will not present stock scenes as KJP projects.

## About Page

The About page will use the same editorial system without a decorative KJP monogram panel. It will contain:

- A concise introduction to KJP Landscapes & Groundworks.
- The existing statement that the business has over 20 years of trade experience.
- A practical working approach: understand the space, prepare correctly, communicate clearly, and finish carefully.
- An overview of the service range without duplicating the full service-page copy.
- Coverage across Sunderland and surrounding Tyne and Wear.
- A telephone call-to-action.

It will not invent accreditations, awards, guarantees, team size, customer testimonials, or named coverage areas not supplied by the business.

## Stock Imagery

Eight illustrative stock images will be downloaded, stored locally in `assets/`, converted to appropriately sized WebP files, and credited in `credits.html`.

- Concrete Work: Life Of Pix, “Cement flowing at construction site” — https://www.pexels.com/photo/cement-flowing-at-construction-site-2469/
- Drainage Solutions: Sergei Starostin, “Urban Pipework Construction Site Close-up” — https://www.pexels.com/photo/urban-pipework-construction-site-close-up-29274530/
- Paving & Patios: Jonathan Borba, “Sunny Garden Patio with Stone Pathway in Bahia” — https://www.pexels.com/photo/sunny-garden-patio-with-stone-pathway-in-bahia-36394729/
- Fencing & Privacy: Ksu&Eli Studio, “Garden with Wooden Fence” — https://www.pexels.com/photo/garden-with-wooden-fence-8967390/
- Raised Beds: Alfo Medeiros, “Green Plant on a Garden” — https://www.pexels.com/photo/green-plant-on-a-garden-11573791/
- Premium Decking: Vishv Shah, “Cozy Wooden Deck with Lush Greenery Outdoors” — https://www.pexels.com/photo/cozy-wooden-deck-with-lush-greenery-outdoors-36794081/
- Turfing & Lawns: Anna Shvets, “Crop worker laying grass roll” — https://www.pexels.com/photo/crop-worker-laying-grass-roll-5231236/
- Artificial Grass: Engin Akyurt, “Top View of Synthetic Green Grass” — https://www.pexels.com/photo/top-view-of-synthetic-green-grass-13083599/

The service pages will identify these as illustrative where context could otherwise imply they show KJP work. Existing gallery photographs remain the only project imagery presented as KJP completed work.

## Visual System

The new pages will reuse the existing colour variables, typography, spacing scale, square corners, borders, buttons, and section-shell widths. New styles will be limited to reusable page-introduction, service-detail, mobile-menu, About-page, and Credits-page components.

The design will maintain:

- Dark forest green, lime accents, warm paper backgrounds, and restrained borders.
- Large editorial headings with compact supporting copy.
- Rectangular photography without rounded masks.
- Generous but consistent section spacing.
- The sticky call action and existing closing call-to-action.

## JavaScript

`script.mjs` will continue to initialise the homepage carousel only when a carousel exists. A separate menu initialiser will manage the shared burger navigation on every page.

The menu implementation will keep its state local to each header instance and expose no global variables. It will update `aria-expanded`, the panel's hidden state, and the accessible button label together so visual and assistive-technology states cannot diverge.

## Accessibility and Performance

All pages will include:

- A skip link and unique `main` landmark.
- One descriptive `h1`, followed by logical `h2` service headings.
- Unique page titles and meta descriptions.
- Descriptive alt text based on visible image content.
- Keyboard-operable navigation and clearly visible focus indicators.
- Reduced-motion support inherited from the existing site.
- Local images with explicit dimensions, WebP compression, and lazy loading below the initial viewport.
- No remote runtime image requests, third-party scripts, web fonts, or framework payloads.

## Error Handling and Degraded Behaviour

- Without JavaScript, primary navigation stays visible and all page links and telephone links work.
- If a service page has no carousel, the shared script exits without error.
- If a stock image fails to load, meaningful alt text still identifies the intended subject.
- Relative links avoid dependence on a specific domain or GitHub username.
- Menu setup checks for required elements before attaching listeners.

## Verification

Implementation will use automated static and browser checks plus visual review. Verification will cover:

- All five primary pages and `credits.html` return successfully from a local server.
- Every internal page link, telephone link, stylesheet, script, and local image path resolves.
- Unique titles, descriptions, `h1` elements, landmarks, and current-page navigation states exist.
- The desktop header shows navigation; mobile/tablet shows the burger and separate call button.
- Menu open, close, Escape, outside-click, link-click, focus-return, and desktop-resize behaviours work.
- No-JavaScript navigation remains usable.
- Service sections alternate correctly on desktop and stack text-before-image on mobile.
- Service images never exceed one-third of the desktop section grid.
- All eight stock assets are local WebP files with dimensions, alt text, lazy loading, and corresponding credit links.
- Existing homepage carousel behaviour remains unchanged: three desktop states and six mobile states.
- JavaScript syntax and repository diff checks pass.
- Desktop and mobile screenshots show no clipping, overlap, unexpected horizontal scrolling, or rounded photography.

## Acceptance Criteria

The work is complete when the site can be opened locally or deployed directly to GitHub Pages with no build step; visitors can navigate between all pages using visible desktop navigation or the accessible mobile/tablet burger menu; each requested service has generic, appropriate copy and its own credited image in the approved alternating layout; the About page accurately describes the business and coverage; and the existing homepage, carousel, fixed call button, and visual direction remain intact.
