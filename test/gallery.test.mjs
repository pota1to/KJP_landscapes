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


test('gallery index wrapping and swipe direction helpers handle boundaries', async () => {
  const { getSwipeStep, normaliseGalleryIndex } = await import('../gallery.mjs');

  assert.equal(normaliseGalleryIndex(56, 56), 0);
  assert.equal(normaliseGalleryIndex(57, 56), 1);
  assert.equal(normaliseGalleryIndex(-1, 56), 55);
  assert.equal(normaliseGalleryIndex(-57, 56), 55);
  assert.throws(() => normaliseGalleryIndex(0, 0), /positive/i);

  assert.equal(getSwipeStep({ startX: 100, startY: 10, endX: 51, endY: 10 }), 0);
  assert.equal(getSwipeStep({ startX: 100, startY: 10, endX: 50, endY: 10 }), 1);
  assert.equal(getSwipeStep({ startX: 50, startY: 10, endX: 100, endY: 10 }), -1);
  assert.equal(getSwipeStep({ startX: 100, startY: 10, endX: 0, endY: 130 }), 0);
});


test('gallery viewer opens the selected image, navigates and wraps in sync', async t => {
  const site = await startTestSite(process.cwd());
  const browser = await launchBrowser();
  t.after(async () => {
    await browser.close();
    await site.close();
  });

  await browser.goto(`${site.origin}/gallery`, { width: 1200, height: 900 });
  await browser.click('[data-gallery-item]:nth-child(10)');

  const read = async () => await browser.evaluate(`(() => ({
    open: document.querySelector('[data-gallery-dialog]')?.open || false,
    src: document.querySelector('[data-gallery-viewer-image]')?.getAttribute('src'),
    alt: document.querySelector('[data-gallery-viewer-image]')?.getAttribute('alt'),
    status: document.querySelector('[data-gallery-status]')?.textContent.trim(),
  }))()`);

  let state = await read();
  assert.equal(state.open, true);
  assert.equal(state.src, 'assets/gallery/full/gallery-10.webp');
  assert.equal(state.alt, 'Gravel driveway with a neat lawn border');
  assert.equal(state.status, '10 of 56');

  await browser.click('[data-gallery-next]');
  state = await read();
  assert.equal(state.src, 'assets/gallery/full/gallery-11.webp');
  assert.equal(state.status, '11 of 56');

  await browser.click('[data-gallery-previous]');
  await browser.press('ArrowRight');
  await browser.press('ArrowLeft');
  state = await read();
  assert.equal(state.src, 'assets/gallery/full/gallery-10.webp');
  assert.equal(state.alt, 'Gravel driveway with a neat lawn border');
  assert.equal(state.status, '10 of 56');

  await browser.evaluate(`document.querySelector('[data-gallery-dialog]').close()`);
  await browser.click('[data-gallery-item]:first-child');
  await browser.click('[data-gallery-previous]');
  state = await read();
  assert.equal(state.src, 'assets/gallery/full/gallery-56.webp');
  assert.equal(state.status, '56 of 56');
  await browser.click('[data-gallery-next]');
  state = await read();
  assert.equal(state.src, 'assets/gallery/full/gallery-01.webp');
  assert.equal(state.status, '1 of 56');
  assert.deepEqual(browser.getErrors(), []);
});


test('gallery viewer handles swipe intent, complete-image framing and rapid navigation', async t => {
  const site = await startTestSite(process.cwd());
  const browser = await launchBrowser();
  t.after(async () => {
    await browser.close();
    await site.close();
  });

  await browser.goto(`${site.origin}/gallery`, { width: 390, height: 844 });
  await browser.click('[data-gallery-item]:nth-child(30)');
  let state = await browser.evaluate(`(() => ({
    fit: getComputedStyle(document.querySelector('[data-gallery-viewer-image]')).objectFit,
    status: document.querySelector('[data-gallery-status]').textContent.trim(),
  }))()`);
  assert.equal(state.fit, 'contain');
  assert.equal(state.status, '30 of 56');

  await browser.evaluate(`(() => {
    const dialog = document.querySelector('[data-gallery-dialog]');
    dialog.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 1, clientX: 250, clientY: 200 }));
    dialog.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 1, clientX: 180, clientY: 205 }));
  })()`);
  state = await browser.evaluate(`document.querySelector('[data-gallery-status]').textContent.trim()`);
  assert.equal(state, '31 of 56');

  await browser.evaluate(`(() => {
    const dialog = document.querySelector('[data-gallery-dialog]');
    dialog.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 2, clientX: 250, clientY: 150 }));
    dialog.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 2, clientX: 150, clientY: 270 }));
  })()`);
  state = await browser.evaluate(`document.querySelector('[data-gallery-status]').textContent.trim()`);
  assert.equal(state, '31 of 56');

  await browser.evaluate(`(() => {
    const next = document.querySelector('[data-gallery-next]');
    const previous = document.querySelector('[data-gallery-previous]');
    for (let index = 0; index < 12; index += 1) next.click();
    for (let index = 0; index < 5; index += 1) previous.click();
  })()`);
  state = await browser.evaluate(`(() => ({
    src: document.querySelector('[data-gallery-viewer-image]').getAttribute('src'),
    alt: document.querySelector('[data-gallery-viewer-image]').getAttribute('alt'),
    status: document.querySelector('[data-gallery-status]').textContent.trim(),
    fit: getComputedStyle(document.querySelector('[data-gallery-viewer-image]')).objectFit,
  }))()`);
  assert.equal(state.src, 'assets/gallery/full/gallery-38.webp');
  assert.equal(state.alt, 'Artificial lawn with angular timber raised beds');
  assert.equal(state.status, '38 of 56');
  assert.equal(state.fit, 'contain');
  assert.deepEqual(browser.getErrors(), []);
});


test('gallery viewer close paths restore scrolling and originating focus', async t => {
  const site = await startTestSite(process.cwd());
  const browser = await launchBrowser();
  t.after(async () => {
    await browser.close();
    await site.close();
  });

  await browser.goto(`${site.origin}/gallery`, { width: 390, height: 844 });
  const readClosedState = async expectedIndex => await browser.evaluate(`(() => ({
    open: document.querySelector('[data-gallery-dialog]').open,
    locked: document.body.classList.contains('gallery-viewer-open') || getComputedStyle(document.body).overflow === 'hidden',
    originFocused: document.activeElement === document.querySelectorAll('[data-gallery-item]')[${expectedIndex}],
  }))()`);

  await browser.click('[data-gallery-item]:nth-child(5)');
  let openState = await browser.evaluate(`(() => ({
    open: document.querySelector('[data-gallery-dialog]').open,
    locked: document.body.classList.contains('gallery-viewer-open') && getComputedStyle(document.body).overflow === 'hidden',
  }))()`);
  assert.deepEqual(openState, { open: true, locked: true });
  await browser.click('[data-gallery-close]');
  assert.deepEqual(await readClosedState(4), { open: false, locked: false, originFocused: true });

  await browser.click('[data-gallery-item]:nth-child(6)');
  await browser.press('Escape');
  assert.deepEqual(await readClosedState(5), { open: false, locked: false, originFocused: true });

  await browser.click('[data-gallery-item]:nth-child(7)');
  await browser.evaluate(`document.querySelector('[data-gallery-dialog]').dispatchEvent(new MouseEvent('click', { bubbles: true }))`);
  assert.deepEqual(await readClosedState(6), { open: false, locked: false, originFocused: true });
  assert.deepEqual(browser.getErrors(), []);
});


test('gallery viewer initialisation is safe for missing and malformed roots', async () => {
  const { createGalleryViewer } = await import('../gallery.mjs');
  const missing = createGalleryViewer(null);
  assert.doesNotThrow(() => {
    missing.open(0);
    missing.show(1);
    missing.close();
    missing.destroy();
  });

  const malformed = createGalleryViewer({
    querySelector() { return null; },
    querySelectorAll() { return []; },
  });
  assert.doesNotThrow(() => malformed.open(0));
  assert.doesNotThrow(() => malformed.destroy());
});
