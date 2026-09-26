export function normaliseIndex(index, count) {
  if (!Number.isInteger(count) || count <= 0) {
    throw new Error('Carousel requires a positive slide count.');
  }
  return ((index % count) + count) % count;
}

export function getCarouselPageState(slideCount, pageIndex, itemsPerPage) {
  const pageCount = Math.ceil(slideCount / itemsPerPage);
  const activePage = normaliseIndex(pageIndex, pageCount);
  const firstSlideIndex = activePage * itemsPerPage;

  return {
    activePage,
    firstSlideIndex,
    finalSlideIndex: Math.min(firstSlideIndex + itemsPerPage, slideCount),
    pageCount
  };
}

export function getRelativeSlideOffset(slideOffset, firstSlideOffset) {
  return slideOffset - firstSlideOffset;
}

export function createCarousel(root) {
  const track = root.querySelector('.carousel-track');
  const slides = [...root.querySelectorAll('.carousel-slide')];
  const indicators = [...root.querySelectorAll('[data-carousel-index]')];
  const status = root.querySelector('#carousel-status');
  let activePage = 0;
  let activeStartIndex = 0;
  let pointerStart = null;
  let resizeFrame = null;

  const getItemsPerPage = () => window.matchMedia('(min-width: 761px)').matches ? 2 : 1;

  const configureIndicators = () => {
    const itemsPerPage = getItemsPerPage();
    const pageCount = Math.ceil(slides.length / itemsPerPage);

    indicators.forEach((indicator, indicatorIndex) => {
      const isAvailable = indicatorIndex < pageCount;
      indicator.hidden = !isAvailable;
      indicator.dataset.carouselIndex = String(indicatorIndex);

      if (itemsPerPage === 2) {
        const firstProject = indicatorIndex * 2 + 1;
        const lastProject = Math.min(firstProject + 1, slides.length);
        indicator.setAttribute('aria-label', `Show projects ${firstProject} and ${lastProject}`);
      } else {
        indicator.setAttribute('aria-label', `Show project ${indicatorIndex + 1}`);
      }
    });
  };

  const goTo = pageIndex => {
    const itemsPerPage = getItemsPerPage();
    const page = getCarouselPageState(slides.length, pageIndex, itemsPerPage);
    activePage = page.activePage;
    activeStartIndex = page.firstSlideIndex;

    const trackOffset = getRelativeSlideOffset(
      slides[activeStartIndex].offsetLeft,
      slides[0].offsetLeft
    );
    track.style.transform = `translateX(-${trackOffset}px)`;

    slides.forEach((slide, slideIndex) => {
      const isVisible = slideIndex >= activeStartIndex && slideIndex < page.finalSlideIndex;
      slide.setAttribute('aria-hidden', String(!isVisible));

      const imageLink = slide.querySelector('.carousel-image-link');
      if (imageLink) imageLink.tabIndex = isVisible ? 0 : -1;
    });

    indicators.forEach((indicator, indicatorIndex) => {
      if (!indicator.hidden && indicatorIndex === activePage) {
        indicator.setAttribute('aria-current', 'true');
      } else {
        indicator.removeAttribute('aria-current');
      }
    });

    status.textContent = itemsPerPage === 2
      ? `Projects ${activeStartIndex + 1}–${page.finalSlideIndex} of ${slides.length}`
      : `Project ${activeStartIndex + 1} of ${slides.length}`;
  };

  const onClick = event => {
    const action = event.target.closest('[data-carousel-action]')?.dataset.carouselAction;
    const index = event.target.closest('[data-carousel-index]')?.dataset.carouselIndex;

    if (action === 'previous') goTo(activePage - 1);
    if (action === 'next') goTo(activePage + 1);
    if (index !== undefined) goTo(Number(index));
  };

  const onKeydown = event => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goTo(activePage - 1);
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      goTo(activePage + 1);
    }
  };

  const onPointerDown = event => {
    pointerStart = event.clientX;
  };

  const onPointerUp = event => {
    if (pointerStart === null) return;
    const distance = event.clientX - pointerStart;
    if (Math.abs(distance) >= 50) goTo(activePage + (distance < 0 ? 1 : -1));
    pointerStart = null;
  };

  const onResize = () => {
    const previousFirstImage = activeStartIndex;
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      configureIndicators();
      goTo(Math.floor(previousFirstImage / getItemsPerPage()));
    });
  };

  root.classList.add('is-enhanced');
  root.addEventListener('click', onClick);
  root.addEventListener('keydown', onKeydown);
  track.addEventListener('pointerdown', onPointerDown);
  track.addEventListener('pointerup', onPointerUp);
  window.addEventListener('resize', onResize);
  configureIndicators();
  goTo(0);

  return {
    goTo,
    destroy() {
      root.removeEventListener('click', onClick);
      root.removeEventListener('keydown', onKeydown);
      track.removeEventListener('pointerdown', onPointerDown);
      track.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(resizeFrame);
      root.classList.remove('is-enhanced');
      track.style.transform = '';
    }
  };
}

if (typeof document !== 'undefined') {
  document.querySelectorAll('.carousel').forEach(createCarousel);
}
