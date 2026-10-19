import assert from 'node:assert/strict';
import test from 'node:test';

import { launchBrowser, startTestSite } from './browser-harness.mjs';


test('gallery page exposes all supplied projects as accessible controls', async t => {
  const site = await startTestSite(process.cwd());
  const browser = await launchBrowser();
  t.after(async () => {
    await browser.close();
    await site.close();
  });

  await browser.goto(`${site.origin}/gallery`, { width: 1200, height: 900 });
  const state = await browser.evaluate(`(() => ({
    headings: [...document.querySelectorAll('h1')].map(element => element.textContent.trim()),
    items: [...document.querySelectorAll('[data-gallery-item]')].map(item => {
      const image = item.querySelector('img');
      return {
        tag: item.tagName,
        type: item.getAttribute('type'),
        label: item.getAttribute('aria-label'),
        full: item.getAttribute('data-full'),
        size: item.getAttribute('data-gallery-size'),
        imageCount: item.querySelectorAll('img').length,
        src: image?.getAttribute('src'),
        alt: image?.getAttribute('alt'),
        loading: image?.getAttribute('loading'),
        decoding: image?.getAttribute('decoding'),
      };
    }),
  }))()`);

  assert.deepEqual(state.headings, ['Our work']);
  assert.equal(state.items.length, 56);
  assert.equal(new Set(state.items.map(item => item.full)).size, 56);

  state.items.forEach((item, offset) => {
    const number = String(offset + 1).padStart(2, '0');
    assert.equal(item.tag, 'BUTTON');
    assert.equal(item.type, 'button');
    assert.ok(item.label?.trim(), `gallery item ${number} needs an accessible label`);
    assert.equal(item.label, item.alt);
    assert.equal(item.full, `assets/gallery/full/gallery-${number}.webp`);
    assert.equal(item.imageCount, 1);
    assert.equal(item.src, `assets/gallery/thumbs/gallery-${number}.webp`);
    assert.equal(item.loading, offset < 8 ? 'eager' : 'lazy');
    assert.equal(item.decoding, 'async');
    assert.ok(['standard', 'wide', 'tall', 'feature'].includes(item.size));
  });
});


test('gallery uses a five-column landscape mosaic on laptop and a two-column vertical mosaic on mobile', async t => {
  const site = await startTestSite(process.cwd());
  const browser = await launchBrowser();
  t.after(async () => {
    await browser.close();
    await site.close();
  });

  const measure = async () => await browser.evaluate(`(() => {
    const grid = document.querySelector('[data-gallery-grid]');
    const rect = selector => {
      const box = document.querySelector(selector)?.getBoundingClientRect();
      return { width: box?.width || 0, height: box?.height || 0 };
    };
    const styles = getComputedStyle(grid);
    return {
      columns: styles.gridTemplateColumns.split(' ').filter(Boolean).length,
      flow: styles.gridAutoFlow,
      grid: rect('[data-gallery-grid]'),
      standard: rect('[data-gallery-size="standard"]'),
      wide: rect('[data-gallery-size="wide"]'),
      tall: rect('[data-gallery-size="tall"]'),
      feature: rect('[data-gallery-size="feature"]'),
      imageFits: [...document.querySelectorAll('[data-gallery-item] img')].map(image => getComputedStyle(image).objectFit),
      visibleImages: [...document.querySelectorAll('[data-gallery-item] img')].filter(image => {
        const box = image.getBoundingClientRect();
        return box.width > 0 && box.height > 0 && getComputedStyle(image).visibility !== 'hidden';
      }).length,
      noOverflow: document.documentElement.scrollWidth <= window.innerWidth,
    };
  })()`);

  await browser.goto(`${site.origin}/gallery`, { width: 1440, height: 1000 });
  const desktop = await measure();
  assert.equal(desktop.columns, 5);
  assert.equal(desktop.flow, 'dense');
  assert.ok(desktop.wide.width > desktop.standard.width * 1.5);
  assert.ok(desktop.tall.height > desktop.standard.height * 1.5);
  assert.ok(desktop.feature.width > desktop.standard.width * 1.5);
  assert.ok(desktop.feature.height > desktop.standard.height * 1.5);
  assert.deepEqual(new Set(desktop.imageFits), new Set(['cover']));
  assert.equal(desktop.noOverflow, true);

  await browser.goto(`${site.origin}/gallery`, { width: 390, height: 844 });
  const mobile = await measure();
  assert.equal(mobile.columns, 2);
  assert.equal(mobile.flow, 'dense');
  assert.ok(mobile.wide.width > mobile.standard.width * 1.5);
  assert.ok(mobile.tall.height > mobile.standard.height * 1.5);
  assert.ok(mobile.standard.height > 0);
  assert.ok(mobile.grid.height > mobile.grid.width * 4);
  assert.equal(mobile.visibleImages, 56);
  assert.equal(mobile.noOverflow, true);
});


test('gallery keeps all thumbnails visible with no-JavaScript', async t => {
  const site = await startTestSite(process.cwd());
  const browser = await launchBrowser({ javascriptEnabled: false });
  t.after(async () => {
    await browser.close();
    await site.close();
  });

  await browser.goto(`${site.origin}/gallery`, { width: 390, height: 844 });
  const visibleImages = await browser.evaluate(`[...document.querySelectorAll('[data-gallery-item] img')].filter(image => {
    const box = image.getBoundingClientRect();
    return box.width > 0 && box.height > 0 && getComputedStyle(image).display !== 'none' && getComputedStyle(image).visibility !== 'hidden';
  }).length`);
  assert.equal(visibleImages, 56);
});
