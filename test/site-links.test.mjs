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
];

const requiredPageLinks = [
  'index.html',
  'groundworks-structural.html',
  'hardscaping-features.html',
  'lawns-decking.html',
  'about.html',
];


test('About page uses the approved factual content and calls to action', async t => {
  const site = await startTestSite(process.cwd());
  const browser = await launchBrowser();
  t.after(async () => {
    await browser.close();
    await site.close();
  });

  await browser.goto(`${site.origin}/about.html`, { width: 1200, height: 900 });
  const state = await browser.evaluate(`(() => ({
    h1s: [...document.querySelectorAll('h1')].map(element => element.textContent.trim()),
    text: document.querySelector('main')?.textContent.replace(/\\s+/g, ' ').trim() || '',
    categoryLinks: [...document.querySelectorAll('.about-service-links a')].map(link => link.getAttribute('href')),
    phoneHref: document.querySelector('main a[href^="tel:"]')?.getAttribute('href'),
    statCount: document.querySelectorAll('.about-stat').length,
  }))()`);

  assert.equal(state.h1s.length, 1);
  assert.match(state.text, /over 20 years/i);
  assert.match(state.text, /Sunderland/i);
  assert.match(state.text, /Tyne and Wear/i);
  for (const word of ['understand', 'prepare', 'communicate', 'finish']) {
    assert.match(state.text, new RegExp(word, 'i'));
  }
  assert.deepEqual(state.categoryLinks.sort(), [
    'groundworks-structural.html',
    'hardscaping-features.html',
    'lawns-decking.html',
  ].sort());
  assert.equal(state.phoneHref, 'tel:07745061601');
  assert.equal(state.statCount, 0);
  assert.doesNotMatch(state.text, /accredit|award|guarantee|testimonial|our team of|team members/i);
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
    'groundworks-structural.html',
    'hardscaping-features.html',
    'lawns-decking.html',
  ]);
  assert.equal(links.rows.length, 8);
  assert.deepEqual(new Set(links.rows), new Set(links.headings));
  assert.equal(links.about, 'about.html');
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
    assert.ok(references.includes('index.html'), `${page} needs a home brand link`);
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
  }
});


test('all pages use the crawlable KJP PNG favicon', async () => {
  const faviconLink = '<link rel="icon" type="image/png" sizes="96x96" href="/kjp-logo96x96.png">';

  for (const page of htmlPages) {
    const html = await readFile(new URL(`../${page}`, import.meta.url), 'utf8');
    assert.ok(html.includes(faviconLink), `${page} is missing the KJP PNG favicon`);
    assert.doesNotMatch(html, /data:image\/svg\+xml/, `${page} still embeds the old SVG favicon`);
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
