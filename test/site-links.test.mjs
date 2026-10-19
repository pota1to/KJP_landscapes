import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { launchBrowser, startTestSite } from './browser-harness.mjs';


const htmlPages = [
  'index.html',
  'groundworks-structural.html',
  'hardscaping-features.html',
  'lawns-decking.html',
  'about.html',
  'gallery.html',
];

const requiredPageLinks = [
  '/',
  '/groundworks-structural',
  '/hardscaping-features',
  '/lawns-decking',
  '/gallery',
  '/about',
];


test('sitemap exposes the canonical gallery route exactly once', async () => {
  const sitemap = await readFile(new URL('../sitemap.xml', import.meta.url), 'utf8');
  const matches = sitemap.match(/<loc>https:\/\/kjplandscapes\.co\.uk\/gallery<\/loc>/g) || [];
  assert.equal(matches.length, 1);
});


test('About page uses the approved two-section content and service-area map', async t => {
  const site = await startTestSite(process.cwd());
  const browser = await launchBrowser();
  t.after(async () => {
    await browser.close();
    await site.close();
  });

  await browser.goto(`${site.origin}/about.html`, { width: 1200, height: 900 });
  const state = await browser.evaluate(`(() => {
    const map = document.querySelector('.about-section__map img');
    return {
      h1s: [...document.querySelectorAll('h1')].map(element => element.textContent.trim()),
      sectionHeadings: [...document.querySelectorAll('.about-section h2')].map(element => element.textContent.trim()),
      text: document.querySelector('main')?.textContent.replace(/\\s+/g, ' ').trim() || '',
      sectionCount: document.querySelectorAll('.about-section').length,
      map: {
        src: map?.getAttribute('src'),
        alt: map?.getAttribute('alt'),
        width: map?.getAttribute('width'),
        height: map?.getAttribute('height'),
        loading: map?.getAttribute('loading'),
      },
      hasOldApproach: Boolean(document.querySelector('.approach-grid')),
      hasOldServiceLinks: Boolean(document.querySelector('.about-service-links')),
    };
  })()`);

  assert.equal(state.h1s.length, 1);
  assert.equal(state.sectionCount, 2);
  assert.deepEqual(state.sectionHeadings, ['About Us', 'Areas We Cover']);
  assert.match(state.text, /over 20 years/i);
  assert.match(state.text, /Sunderland/i);
  assert.match(state.text, /Tyne and Wear/i);
  for (const service of ['paving', 'patios', 'fencing', 'decking', 'turf', 'artificial grass', 'drainage', 'concrete work', 'raised beds', 'general groundworks']) {
    assert.match(state.text, new RegExp(service, 'i'));
  }
  for (const area of ['Houghton-le-Spring', 'Hetton-le-Hole', 'Seaham', 'Murton', 'Shiney Row', 'Penshaw', 'Washington', 'West Boldon', 'East Boldon', 'Cleadon', 'Whitburn', 'South Shields']) {
    assert.match(state.text, new RegExp(area, 'i'));
  }
  assert.deepEqual(state.map, {
    src: 'assets/areas-map.webp',
    alt: 'Illustrated map of the main areas served by KJP Landscapes and Groundworks around Sunderland',
    width: '1200',
    height: '1200',
    loading: 'lazy',
  });
  assert.equal(state.hasOldApproach, false);
  assert.equal(state.hasOldServiceLinks, false);
  assert.doesNotMatch(state.text, /accredit|award|guarantee|testimonial|our team of|team members/i);
});


test('About service areas place the map beside the copy on desktop and below it on mobile', async t => {
  const site = await startTestSite(process.cwd());
  const browser = await launchBrowser();
  t.after(async () => {
    await browser.close();
    await site.close();
  });

  await browser.goto(`${site.origin}/about.html`, { width: 1200, height: 900 });
  const desktop = await browser.evaluate(`(() => {
    const copy = document.querySelector('.about-section--areas .about-section__copy')?.getBoundingClientRect();
    const map = document.querySelector('.about-section--areas .about-section__map')?.getBoundingClientRect();
    return {
      copyRight: copy?.right || 0,
      mapLeft: map?.left || 0,
      copyWidth: copy?.width || 0,
      mapWidth: map?.width || 0,
      noOverflow: document.documentElement.scrollWidth <= window.innerWidth,
    };
  })()`);
  assert.ok(desktop.mapLeft > desktop.copyRight, 'service-area map is not beside the copy on desktop');
  assert.ok(desktop.mapWidth >= desktop.copyWidth * 0.9, 'service-area columns are not approximately equal');
  assert.equal(desktop.noOverflow, true);

  await browser.goto(`${site.origin}/about.html`, { width: 390, height: 844 });
  const mobile = await browser.evaluate(`(() => {
    const copy = document.querySelector('.about-section--areas .about-section__copy')?.getBoundingClientRect();
    const map = document.querySelector('.about-section--areas .about-section__map')?.getBoundingClientRect();
    return {
      copyBottom: copy?.bottom || 0,
      mapTop: map?.top || 0,
      noOverflow: document.documentElement.scrollWidth <= window.innerWidth,
    };
  })()`);
  assert.ok(mobile.mapTop > mobile.copyBottom, 'service-area map is not below the copy on mobile');
  assert.equal(mobile.noOverflow, true);
});


test('homepage services and About content link to their dedicated pages', async t => {
  const site = await startTestSite(process.cwd());
  const browser = await launchBrowser();
  t.after(async () => {
    await browser.close();
    await site.close();
  });

  await browser.goto(`${site.origin}/index.html`, { width: 1200, height: 900 });
  const links = await browser.evaluate(`(() => ({
    headings: [...document.querySelectorAll('.service-group h3 a')].map(link => link.getAttribute('href')),
    rows: [...document.querySelectorAll('.service-group li a')].map(link => link.getAttribute('href')),
    about: document.querySelector('.about-copy .text-link')?.getAttribute('href'),
  }))()`);
  assert.deepEqual(links.headings, [
    '/groundworks-structural',
    '/hardscaping-features',
    '/lawns-decking',
  ]);
  assert.deepEqual(links.rows, [
    '/groundworks-structural#concrete',
    '/groundworks-structural#drain',
    '/hardscaping-features#patio',
    '/hardscaping-features#fence',
    '/hardscaping-features#raisedbeds',
    '/lawns-decking#decking',
    '/lawns-decking#turf',
    '/lawns-decking#astro',
  ]);
  assert.equal(links.about, '/about');
});


test('all pages expose consistent relative navigation and every local resource resolves', async t => {
  const site = await startTestSite(process.cwd());
  t.after(async () => site.close());

  const urls = new Set();
  for (const page of htmlPages) {
    const html = await readFile(new URL(`../${page}`, import.meta.url), 'utf8');
    const references = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map(match => match[1]);
    const footer = html.match(/<footer[\s\S]*?<\/footer>/)?.[0] || '';
    const footerReferences = [...footer.matchAll(/href="([^"]+)"/g)].map(match => match[1]);
    assert.ok(references.includes('/'), `${page} needs a home brand link`);
    assert.ok(!references.includes('credits.html'), `${page} still links to credits.html`);
    for (const href of requiredPageLinks) {
      assert.ok(references.includes(href), `${page} is missing ${href}`);
      assert.ok(footerReferences.includes(href), `${page} footer is missing ${href}`);
    }
    for (const reference of references) {
      if (/^(?:#|tel:|data:|https?:|mailto:)/.test(reference)) continue;
      urls.add(new URL(reference, `${site.origin}/${page}`).href);
    }
    urls.add(`${site.origin}/${page}`);
  }

  for (const url of urls) {
    const response = await fetch(url);
    assert.equal(response.status, 200, url);
    await response.arrayBuffer();
  }
});


test('all pages use the crawlable KJP PNG favicon', async () => {
  const faviconLink = /<link\s+rel="icon"\s+type="image\/png"\s+sizes="96x96"\s+href="\/kjp-logo96x96\.png"\s*\/?\s*>/;

  for (const page of htmlPages) {
    const html = await readFile(new URL(`../${page}`, import.meta.url), 'utf8');
    assert.match(html, faviconLink, `${page} is missing the KJP PNG favicon`);
    assert.doesNotMatch(html, /data:image\/svg\+xml/, `${page} still embeds the old SVG favicon`);
  }
});


test('footer navigation omits the Our work link on every page', async () => {
  for (const page of htmlPages) {
    const html = await readFile(new URL(`../${page}`, import.meta.url), 'utf8');
    const footer = html.match(/<footer[\s\S]*?<\/footer>/)?.[0] || '';
    assert.doesNotMatch(footer, />\s*Our work\s*</i, `${page} footer still shows Our work`);
    assert.doesNotMatch(footer, /href="[^"]*#gallery"/i, `${page} footer still links to the gallery`);
  }
});


test('320px header keeps the full brand, menu and call action usable', async t => {
  const site = await startTestSite(process.cwd());
  const browser = await launchBrowser();
  t.after(async () => {
    await browser.close();
    await site.close();
  });

  await browser.goto(`${site.origin}/index.html`, { width: 320, height: 700 });
  const state = await browser.evaluate(`(() => {
    const box = selector => {
      const element = document.querySelector(selector);
      const rect = element?.getBoundingClientRect();
      return { visible: Boolean(rect && rect.width && rect.height), width: rect?.width || 0, height: rect?.height || 0 };
    };
    return {
      noOverflow: document.documentElement.scrollWidth <= window.innerWidth,
      brandText: document.querySelector('.brand')?.textContent.replace(/\\s+/g, ' ').trim(),
      brand: box('.brand'),
      menu: box('[data-menu-toggle]'),
      call: box('.call-button'),
    };
  })()`);

  assert.equal(state.noOverflow, true);
  assert.match(state.brandText, /KJP Landscapes & Groundworks/);
  for (const [name, box] of Object.entries({ brand: state.brand, menu: state.menu, call: state.call })) {
    assert.equal(box.visible, true, name);
    assert.ok(box.height >= 44, `${name} must be at least 44px high`);
  }
});
