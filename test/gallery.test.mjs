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
