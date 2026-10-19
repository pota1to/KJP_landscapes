import assert from 'node:assert/strict';
import test from 'node:test';

import { launchBrowser, startTestSite } from './browser-harness.mjs';


const pages = [
  {
    path: '/groundworks-structural.html',
    title: 'Groundworks & Structural | KJP Landscapes & Groundworks',
    h1: 'Groundworks & Structural',
    current: '/groundworks-structural',
    heroAsset: 'hero-groundworks.webp',
    headings: ['Concrete Work', 'Drainage Solutions'],
  },
  {
    path: '/hardscaping-features.html',
    title: 'Hardscaping & Features | KJP Landscapes & Groundworks',
    h1: 'Hardscaping & Features',
    current: '/hardscaping-features',
    heroAsset: 'hero-hardscaping.webp',
    headings: ['Paving & Patios', 'Fencing & Privacy', 'Raised Beds'],
  },
  {
    path: '/lawns-decking.html',
    title: 'Lawns & Decking | KJP Landscapes & Groundworks',
    h1: 'Lawns & Decking',
    current: '/lawns-decking',
    heroAsset: 'hero-lawns.webp',
    headings: ['Premium Decking', 'Turfing & Lawns', 'Artificial Grass'],
  },
];

const heroPages = [
  ...pages,
  {
    path: '/about.html',
    heroAsset: 'hero-about.webp',
  },
];

const closingPages = [
  '/index.html',
  ...pages.map(page => page.path),
];

const footerPages = [
  ...closingPages,
  '/about.html',
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
          heading: detail.querySelector('h2')?.textContent.trim(),
          image: image?.getAttribute('src'),
          alt: image?.getAttribute('alt'),
          width: image?.getAttribute('width'),
          height: image?.getAttribute('height'),
          loading: image?.getAttribute('loading'),
          hasCaption: Boolean(detail.querySelector('figcaption')),
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
      assert.equal(detail.hasCaption, false);
    }
    assert.deepEqual(browser.getErrors(), [], `${page.path} logged a JavaScript error`);
  }
});


test('closing calls form one left-aligned column at every responsive width', async t => {
  const site = await startTestSite(process.cwd());
  const browser = await launchBrowser();
  t.after(async () => {
    await browser.close();
    await site.close();
  });

  for (const path of closingPages) {
    for (const width of [1200, 900, 390]) {
      await browser.goto(`${site.origin}${path}`, { width, height: 900 });
      const layout = await browser.evaluate(`(() => {
        const rect = selector => document.querySelector(selector)?.getBoundingClientRect();
        const gridElement = document.querySelector('.closing-grid');
        const grid = gridElement?.getBoundingClientRect();
        const gridStyle = gridElement ? getComputedStyle(gridElement) : null;
        const gridPaddingLeft = parseFloat(gridStyle?.paddingLeft || '0');
        const gridPaddingRight = parseFloat(gridStyle?.paddingRight || '0');
        const label = rect('.closing-grid > .section-number');
        const slogan = rect('.closing-grid > h2');
        const action = rect('.closing-grid > div:last-child');
        return {
          gridContentLeft: (grid?.left || 0) + gridPaddingLeft,
          gridContentWidth: (grid?.width || 0) - gridPaddingLeft - gridPaddingRight,
          labelLeft: label?.left || 0,
          labelBottom: label?.bottom || 0,
          sloganLeft: slogan?.left || 0,
          sloganTop: slogan?.top || 0,
          sloganBottom: slogan?.bottom || 0,
          sloganWidth: slogan?.width || 0,
          actionLeft: action?.left || 0,
          actionTop: action?.top || 0,
          actionWidth: action?.width || 0,
          actionBottom: action?.bottom || 0,
          hasForcedBreak: Boolean(document.querySelector('.closing-grid > h2 br')),
          sloganHeight: slogan?.height || 0,
          sloganLineHeight: parseFloat(getComputedStyle(document.querySelector('.closing-grid > h2')).lineHeight),
        };
      })()`);

      assert.ok(Math.abs(layout.labelLeft - layout.sloganLeft) <= 1, `${path} label and slogan are not aligned at ${width}px`);
      assert.ok(layout.labelBottom <= layout.sloganTop, `${path} label is not above the slogan at ${width}px`);
      assert.ok(Math.abs(layout.sloganLeft - layout.gridContentLeft) <= 1, `${path} closing copy is not aligned to the left at ${width}px`);
      assert.ok(Math.abs(layout.actionLeft - layout.sloganLeft) <= 1, `${path} action copy is not aligned to the slogan at ${width}px`);
      assert.ok(layout.actionTop >= layout.sloganBottom, `${path} action must follow the slogan at ${width}px`);

      if (path === '/groundworks-structural.html' && width >= 900) {
        assert.equal(layout.hasForcedBreak, false, `groundworks slogan still has a forced break at ${width}px`);
        assert.ok(layout.sloganHeight <= layout.sloganLineHeight * 1.25, `groundworks slogan wraps at ${width}px`);
      }
    }
  }
});


test('homepage closing slogan stays on one line at wide laptop widths', async t => {
  const site = await startTestSite(process.cwd());
  const browser = await launchBrowser();
  t.after(async () => {
    await browser.close();
    await site.close();
  });

  await browser.goto(`${site.origin}/index.html`, { width: 1840, height: 900 });
  const slogan = await browser.evaluate(`(() => {
    const element = document.querySelector('.closing-grid > h2');
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return {
      hasForcedBreak: Boolean(element.querySelector('br')),
      height: rect.height,
      lineHeight: parseFloat(style.lineHeight),
    };
  })()`);

  assert.equal(slogan.hasForcedBreak, false);
  assert.ok(
    slogan.height <= slogan.lineHeight * 1.25,
    'homepage closing slogan wraps at 1840px',
  );
});


test('tablet footers keep navigation on one left-aligned line', async t => {
  const site = await startTestSite(process.cwd());
  const browser = await launchBrowser();
  t.after(async () => {
    await browser.close();
    await site.close();
  });

  for (const path of footerPages) {
    await browser.goto(`${site.origin}${path}`, { width: 900, height: 900 });
    const layout = await browser.evaluate(`(() => {
      const footer = document.querySelector('.footer-grid');
      const nav = footer?.querySelector('nav');
      const footerRect = footer?.getBoundingClientRect();
      const navRect = nav?.getBoundingClientRect();
      const footerStyle = footer ? getComputedStyle(footer) : null;
      const contentLeft = (footerRect?.left || 0) + parseFloat(footerStyle?.paddingLeft || '0');
      const linkTops = [...(nav?.querySelectorAll('a') || [])].map(link => link.getBoundingClientRect().top);
      return {
        contentLeft,
        navLeft: navRect?.left || 0,
        linkTops,
        noPageOverflow: document.documentElement.scrollWidth <= window.innerWidth,
      };
    })()`);

    assert.ok(Math.abs(layout.navLeft - layout.contentLeft) <= 1, `${path} footer links are not left aligned`);
    assert.ok(Math.max(...layout.linkTops) - Math.min(...layout.linkTops) <= 1, `${path} footer links wrap at tablet width`);
    assert.equal(layout.noPageOverflow, true, `${path} footer causes horizontal overflow`);
  }
});


test('mobile footers keep links left aligned without horizontal overflow', async t => {
  const site = await startTestSite(process.cwd());
  const browser = await launchBrowser();
  t.after(async () => {
    await browser.close();
    await site.close();
  });

  for (const path of footerPages) {
    await browser.goto(`${site.origin}${path}`, { width: 320, height: 700 });
    const layout = await browser.evaluate(`(() => {
      const footer = document.querySelector('.footer-grid');
      const nav = footer?.querySelector('nav');
      const footerRect = footer?.getBoundingClientRect();
      const navRect = nav?.getBoundingClientRect();
      const footerStyle = footer ? getComputedStyle(footer) : null;
      return {
        contentLeft: (footerRect?.left || 0) + parseFloat(footerStyle?.paddingLeft || '0'),
        navLeft: navRect?.left || 0,
        noPageOverflow: document.documentElement.scrollWidth <= window.innerWidth,
      };
    })()`);

    assert.ok(Math.abs(layout.navLeft - layout.contentLeft) <= 1, `${path} mobile footer links are not left aligned`);
    assert.equal(layout.noPageOverflow, true, `${path} mobile footer causes horizontal overflow`);
  }
});


test('internal pages use compact responsive image-backed heroes', async t => {
  const site = await startTestSite(process.cwd());
  const browser = await launchBrowser();
  const desktopHeights = [];
  const wideDesktopHeights = [];
  const tabletHeights = [];
  const mobileHeights = [];
  t.after(async () => {
    await browser.close();
    await site.close();
  });

  for (const page of heroPages) {
    await browser.goto(`${site.origin}${page.path}`, { width: 1200, height: 900 });
    const desktop = await browser.evaluate(`(() => {
      const hero = document.querySelector('.page-intro');
      const inner = hero?.querySelector('.page-intro__inner');
      const heading = hero?.querySelector('h1');
      const label = hero?.querySelector('.section-number');
      const paragraph = hero?.querySelector('p:not(.section-number)');
      const action = hero?.querySelector('.primary-action');
      const style = hero ? getComputedStyle(hero) : null;
      return {
        hasInner: Boolean(inner),
        backgroundImage: style?.backgroundImage || '',
        backgroundSize: style?.backgroundSize || '',
        height: hero?.getBoundingClientRect().height || 0,
        headingColor: heading ? getComputedStyle(heading).color : '',
        labelColor: label ? getComputedStyle(label).color : '',
        paragraphColor: paragraph ? getComputedStyle(paragraph).color : '',
        innerWidth: inner?.getBoundingClientRect().width || 0,
        actionWidth: action?.getBoundingClientRect().width || 0,
      };
    })()`);

    assert.equal(desktop.hasInner, true, page.path);
    assert.match(desktop.backgroundImage, /linear-gradient/, page.path);
    assert.match(desktop.backgroundImage, new RegExp(page.heroAsset), page.path);
    assert.match(desktop.backgroundSize, /^cover(?:, cover)*$/);
    assert.ok(desktop.height >= 400 && desktop.height <= 560, `${page.path} hero is not compact`);
    assert.equal(desktop.headingColor, 'rgb(255, 255, 255)');
    assert.equal(desktop.labelColor, 'rgb(185, 239, 88)');
    assert.match(desktop.paragraphColor, /^rgba?\(255, 255, 255/);
    if (desktop.actionWidth) {
      assert.ok(desktop.actionWidth < desktop.innerWidth * 0.6, `${page.path} action should not stretch`);
    }
    desktopHeights.push(desktop.height);

    await browser.setViewport({ width: 1863, height: 927 });
    const wideDesktopHeight = await browser.evaluate(
      `document.querySelector('.page-intro')?.getBoundingClientRect().height || 0`,
    );
    wideDesktopHeights.push(wideDesktopHeight);

    await browser.setViewport({ width: 980, height: 900 });
    const tabletHeight = await browser.evaluate(
      `document.querySelector('.page-intro')?.getBoundingClientRect().height || 0`,
    );
    tabletHeights.push(tabletHeight);

    await browser.setViewport({ width: 390, height: 844 });
    const mobile = await browser.evaluate(`(() => {
      const hero = document.querySelector('.page-intro');
      return {
        noOverflow: document.documentElement.scrollWidth <= window.innerWidth,
        height: hero?.getBoundingClientRect().height || 0,
      };
    })()`);
    assert.equal(mobile.noOverflow, true, page.path);
    assert.ok(mobile.height >= 400 && mobile.height <= 520, `${page.path} mobile hero is not compact`);
    mobileHeights.push(mobile.height);
  }

  for (const [label, heights] of [
    ['desktop', desktopHeights],
    ['wide desktop', wideDesktopHeights],
    ['tablet', tabletHeights],
    ['mobile', mobileHeights],
  ]) {
    const heightDifference = Math.max(...heights) - Math.min(...heights);
    assert.ok(heightDifference <= 1, `internal ${label} hero heights differ by ${heightDifference}px`);
  }
});


test('internal hero headings match the homepage heading typography', async t => {
  const site = await startTestSite(process.cwd());
  const browser = await launchBrowser();
  t.after(async () => {
    await browser.close();
    await site.close();
  });

  await browser.goto(`${site.origin}/index.html`, { width: 1200, height: 900 });
  const homepageTypography = await browser.evaluate(`(() => {
    const style = getComputedStyle(document.querySelector('.hero h1'));
    return { fontFamily: style.fontFamily, fontWeight: style.fontWeight };
  })()`);

  for (const page of heroPages) {
    await browser.goto(`${site.origin}${page.path}`, { width: 1200, height: 900 });
    const typography = await browser.evaluate(`(() => {
      const style = getComputedStyle(document.querySelector('.page-intro h1'));
      return { fontFamily: style.fontFamily, fontWeight: style.fontWeight };
    })()`);
    assert.deepEqual(typography, homepageTypography, page.path);
  }
});


test('service sections alternate on desktop with equal text and image columns', async t => {
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
        copyWidth: copy.width,
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
      assert.ok(Math.abs(layout.mediaWidth - layout.copyWidth) <= 1);
      assert.ok(Math.abs((layout.imageWidth / layout.imageHeight) - (4 / 3)) < 0.01);
    });
  }
});


test('service sections place photography between headings and paragraphs on mobile', async t => {
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
        const heading = detail.querySelector('h2').getBoundingClientRect();
        const media = detail.querySelector('.service-detail__media').getBoundingClientRect();
        const paragraph = detail.querySelector('p:not(.section-number)').getBoundingClientRect();
        return {
          columns: getComputedStyle(detail).gridTemplateColumns.split(' ').length,
          headingBottom: heading.bottom,
          mediaTop: media.top,
          mediaBottom: media.bottom,
          paragraphTop: paragraph.top,
        };
      }),
    }))()`);
    assert.equal(state.noOverflow, true);
    assert.equal(state.layouts.length, page.headings.length);
    state.layouts.forEach(layout => {
      assert.equal(layout.columns, 1);
      assert.ok(layout.headingBottom <= layout.mediaTop);
      assert.ok(layout.mediaBottom <= layout.paragraphTop);
    });
  }
});
