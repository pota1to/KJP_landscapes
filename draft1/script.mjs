export function normaliseIndex(index, count) {
  if (!Number.isInteger(count) || count <= 0) {
    throw new Error('Carousel requires a positive slide count.');
  }
  return ((index % count) + count) % count;
}

export function createCarousel(root) {
  const track = root.querySelector('.carousel-track');
  const slides = [...root.querySelectorAll('.carousel-slide')];
  const indicators = [...root.querySelectorAll('[data-carousel-index]')];
  const status = root.querySelector('#carousel-status');
  let activeIndex = 0;
  let pointerStart = null;

  const goTo = index => {
    activeIndex = normaliseIndex(index, slides.length);
    track.style.transform = `translateX(-${activeIndex * 100}%)`;

    slides.forEach((slide, slideIndex) => {
      slide.setAttribute('aria-hidden', String(slideIndex !== activeIndex));
    });

    indicators.forEach((indicator, indicatorIndex) => {
      if (indicatorIndex === activeIndex) {
        indicator.setAttribute('aria-current', 'true');
      } else {
        indicator.removeAttribute('aria-current');
      }
    });

    status.textContent = `Project ${activeIndex + 1} of ${slides.length}`;
  };

  const onClick = event => {
    const action = event.target.closest('[data-carousel-action]')?.dataset.carouselAction;
    const index = event.target.closest('[data-carousel-index]')?.dataset.carouselIndex;

    if (action === 'previous') goTo(activeIndex - 1);
    if (action === 'next') goTo(activeIndex + 1);
    if (index !== undefined) goTo(Number(index));
  };

  const onKeydown = event => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goTo(activeIndex - 1);
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      goTo(activeIndex + 1);
    }
  };

  const onPointerDown = event => {
    pointerStart = event.clientX;
  };

  const onPointerUp = event => {
    if (pointerStart === null) return;
    const distance = event.clientX - pointerStart;
    if (Math.abs(distance) >= 50) {
      goTo(activeIndex + (distance < 0 ? 1 : -1));
    }
    pointerStart = null;
  };

  root.classList.add('is-enhanced');
  root.addEventListener('click', onClick);
  root.addEventListener('keydown', onKeydown);
  track.addEventListener('pointerdown', onPointerDown);
  track.addEventListener('pointerup', onPointerUp);
  goTo(0);

  return {
    goTo,
    destroy() {
      root.removeEventListener('click', onClick);
      root.removeEventListener('keydown', onKeydown);
      track.removeEventListener('pointerdown', onPointerDown);
      track.removeEventListener('pointerup', onPointerUp);
      root.classList.remove('is-enhanced');
      track.style.transform = '';
    }
  };
}

if (typeof document !== 'undefined') {
  document.querySelectorAll('.carousel').forEach(createCarousel);
}
