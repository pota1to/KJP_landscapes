import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { launchBrowser, startTestSite } from './browser-harness.mjs';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let site;

before(async () => {
  site = await startTestSite(projectRoot);
});

after(async () => {
  await site.close();
});

test('menu presentation exposes matching visual and accessible states', async () => {
  const module = await import('../script.mjs');
  assert.equal(typeof module.getMenuPresentation, 'function');
  assert.deepEqual(module.getMenuPresentation(false), {
    expanded: 'false',
    label: 'Open menu'
  });
  assert.deepEqual(module.getMenuPresentation(true), {
    expanded: 'true',
    label: 'Close menu'
  });
});

test('mobile menu opens and closes accessibly', async () => {
  const browser = await launchBrowser();
  try {
    await browser.goto(`${site.origin}/index.html`, { width: 760, height: 900 });
    const initial = await browser.evaluate(`(() => {
      const toggle = document.querySelector('[data-menu-toggle]');
      const nav = document.querySelector('[data-site-nav]');
      return {
        toggleVisible: Boolean(toggle) && !toggle.hidden && getComputedStyle(toggle).display !== 'none',
        navHidden: Boolean(nav) && (nav.hidden || getComputedStyle(nav).display === 'none')
      };
    })()`);
    assert.deepEqual(initial, { toggleVisible: true, navHidden: true });

    await browser.click('[data-menu-toggle]');
    assert.deepEqual(await browser.evaluate(`(() => {
      const toggle = document.querySelector('[data-menu-toggle]');
      const nav = document.querySelector('[data-site-nav]');
      return {
        expanded: toggle.getAttribute('aria-expanded'),
        label: toggle.getAttribute('aria-label'),
        navHidden: nav.hidden
      };
    })()`), { expanded: 'true', label: 'Close menu', navHidden: false });

    await browser.press('Escape');
    assert.deepEqual(await browser.evaluate(`(() => ({
      expanded: document.querySelector('[data-menu-toggle]').getAttribute('aria-expanded'),
      navHidden: document.querySelector('[data-site-nav]').hidden,
      focusReturned: document.activeElement === document.querySelector('[data-menu-toggle]')
    }))()`), { expanded: 'false', navHidden: true, focusReturned: true });

    await browser.click('[data-menu-toggle]');
    await browser.click('main');
    assert.equal(await browser.evaluate(`document.querySelector('[data-menu-toggle]').getAttribute('aria-expanded')`), 'false');

    await browser.click('[data-menu-toggle]');
    await browser.evaluate(`(() => {
      document.querySelector('[data-site-nav] a').addEventListener('click', event => event.preventDefault(), { once: true });
    })()`);
    await browser.click('[data-site-nav] a');
    assert.equal(await browser.evaluate(`document.querySelector('[data-menu-toggle]').getAttribute('aria-expanded')`), 'false');
  } finally {
    await browser.close();
  }
});

test('navigation resets at desktop width and degrades without JavaScript', async () => {
  const browser = await launchBrowser();
  try {
    await browser.goto(`${site.origin}/index.html`, { width: 760, height: 900 });
    await browser.click('[data-menu-toggle]');
    await browser.setViewport({ width: 1200, height: 900 });
    assert.deepEqual(await browser.evaluate(`(() => {
      const toggle = document.querySelector('[data-menu-toggle]');
      const nav = document.querySelector('[data-site-nav]');
      return {
        expanded: toggle.getAttribute('aria-expanded'),
        toggleHidden: getComputedStyle(toggle).display === 'none',
        navVisible: !nav.hidden && getComputedStyle(nav).display !== 'none'
      };
    })()`), { expanded: 'false', toggleHidden: true, navVisible: true });
  } finally {
    await browser.close();
  }

  const noScriptBrowser = await launchBrowser({ javascriptEnabled: false });
  try {
    await noScriptBrowser.goto(`${site.origin}/index.html`, { width: 760, height: 900 });
    assert.deepEqual(await noScriptBrowser.evaluate(`(() => {
      const toggle = document.querySelector('[data-menu-toggle]');
      const nav = document.querySelector('[data-site-nav]');
      return {
        toggleHidden: !toggle || toggle.hidden || getComputedStyle(toggle).display === 'none',
        navVisible: Boolean(nav) && !nav.hidden && getComputedStyle(nav).display !== 'none'
      };
    })()`), { toggleHidden: true, navVisible: true });
  } finally {
    await noScriptBrowser.close();
  }
});
