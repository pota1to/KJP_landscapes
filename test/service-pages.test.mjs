import assert from 'node:assert/strict';
import test from 'node:test';

import { launchBrowser, startTestSite } from './browser-harness.mjs';


const pages = [
  {
    path: '/groundworks-structural.html',
    title: 'Groundworks & Structural | KJP Landscapes & Groundworks',
    h1: 'Groundworks & Structural',
    current: 'groundworks-structural.html',
    headings: ['Concrete Work', 'Drainage Solutions'],
  },
  {
    path: '/hardscaping-features.html',
    title: 'Hardscaping & Features | KJP Landscapes & Groundworks',
    h1: 'Hardscaping & Features',
    current: 'hardscaping-features.html',
    headings: ['Paving & Patios', 'Fencing & Privacy', 'Raised Beds'],
  },
  {
    path: '/lawns-decking.html',
    title: 'Lawns & Decking | KJP Landscapes & Groundworks',
    h1: 'Lawns & Decking',
    current: 'lawns-decking.html',
    headings: ['Premium Decking', 'Turfing & Lawns', 'Artificial Grass'],
  },
];


test('service pages contain the approved content and image semantics', async t => {
  const site = await startTestSite(process.cwd());
  const browser = await launchBrowser();
  t.after(async () => {
    await browser.close();
    await site.close();
  });

  for (const page of pages) {
    browser.clearErrors();
    await browser.goto(`${site.origin}${page.path}`, { width: 1200, height: 900 });
    const state = await browser.evaluate(`(() => ({
      title: document.title,
      description: document.querySelector('meta[name="description"]')?.content || '',
      h1s: [...document.querySelectorAll('h1')].map(element => element.textContent.trim()),
      headings: [...document.querySelectorAll('.service-detail h2')].map(element => element.textContent.trim()),
      hasMenu: Boolean(document.querySelector('[data-menu-toggle], [data-site-nav]')),
      callHref: document.querySelector('.call-button')?.getAttribute('href'),
      currentHref: document.querySelector('.site-nav [aria-current="page"]')?.getAttribute('href'),
      introCallHref: document.querySelector('.page-intro a[href^="tel:"]')?.getAttribute('href'),
      hasClosingCall: Boolean(document.querySelector('.closing-call')),
      hasFooter: Boolean(document.querySelector('.site-footer')),
      details: [...document.querySelectorAll('.service-detail')].map(detail => {
        const image = detail.querySelector('img');
        return {
          image: image?.getAttribute('src'),
          alt: image?.getAttribute('alt'),
          width: image?.getAttribute('width'),
          height: image?.getAttribute('height'),
          loading: image?.getAttribute('loading'),
          stockNote: detail.querySelector('.stock-note')?.textContent.trim(),
        };
      }),
    }))()`);

    assert.equal(state.title, page.title, page.path);
    assert.ok(state.description.length >= 80, `${page.path} needs a useful description`);
    assert.deepEqual(state.h1s, [page.h1]);
    assert.deepEqual(state.headings, page.headings);
    assert.equal(state.hasMenu, true);
    assert.equal(state.callHref, 'tel:07745061601');
    assert.equal(state.currentHref, page.current);
    assert.equal(state.introCallHref, 'tel:07745061601');
    assert.equal(state.hasClosingCall, true);
    assert.equal(state.hasFooter, true);
    assert.equal(state.details.length, page.headings.length);
    for (const detail of state.details) {
      assert.match(detail.image, /^assets\/service-[a-z-]+\.webp$/);
      assert.ok(detail.alt);
      assert.equal(detail.width, '1200');
      assert.equal(detail.height, '900');
      assert.equal(detail.loading, 'lazy');
      assert.match(detail.stockNote, /Illustrative stock photograph/i);
    }
    assert.deepEqual(browser.getErrors(), [], `${page.path} logged a JavaScript error`);
  }
});


test('service sections alternate on desktop and images stay within one third', async t => {
  const site = await startTestSite(process.cwd());
  const browser = await launchBrowser();
  t.after(async () => {
    await browser.close();
    await site.close();
  });

  for (const page of pages) {
    await browser.goto(`${site.origin}${page.path}`, { width: 1200, height: 900 });
    const layouts = await browser.evaluate(`(() => [...document.querySelectorAll('.service-detail')].map(detail => {
      const section = detail.getBoundingClientRect();
      const copy = detail.querySelector('.service-detail__copy').getBoundingClientRect();
      const media = detail.querySelector('.service-detail__media').getBoundingClientRect();
      const image = detail.querySelector('img').getBoundingClientRect();
      return {
        sectionWidth: section.width,
        copyLeft: copy.left,
        mediaLeft: media.left,
        mediaWidth: media.width,
        imageWidth: image.width,
        imageHeight: image.height,
      };
    }))()`);
    assert.equal(layouts.length, page.headings.length);
    layouts.forEach((layout, index) => {
      if (index % 2 === 0) assert.ok(layout.copyLeft < layout.mediaLeft);
      else assert.ok(layout.mediaLeft < layout.copyLeft);
      assert.ok(layout.mediaWidth <= layout.sectionWidth / 3 + 1);
      assert.ok(Math.abs((layout.imageWidth / layout.imageHeight) - (4 / 3)) < 0.01);
    });
  }
});


test('service sections stack copy before photography on mobile', async t => {
  const site = await startTestSite(process.cwd());
  const browser = await launchBrowser();
  t.after(async () => {
    await browser.close();
    await site.close();
  });

  for (const page of pages) {
    await browser.goto(`${site.origin}${page.path}`, { width: 390, height: 844 });
    const state = await browser.evaluate(`(() => ({
      noOverflow: document.documentElement.scrollWidth <= window.innerWidth,
      layouts: [...document.querySelectorAll('.service-detail')].map(detail => {
        const copy = detail.querySelector('.service-detail__copy').getBoundingClientRect();
        const media = detail.querySelector('.service-detail__media').getBoundingClientRect();
        return {
          columns: getComputedStyle(detail).gridTemplateColumns.split(' ').length,
          copyTop: copy.top,
          mediaTop: media.top,
        };
      }),
    }))()`);
    assert.equal(state.noOverflow, true);
    assert.equal(state.layouts.length, page.headings.length);
    state.layouts.forEach(layout => {
      assert.equal(layout.columns, 1);
      assert.ok(layout.copyTop < layout.mediaTop);
    });
  }
});
