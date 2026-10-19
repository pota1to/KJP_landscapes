export function normaliseGalleryIndex(index, count) {
  if (!Number.isFinite(count) || count <= 0) {
    throw new RangeError('Gallery item count must be positive');
  }
  return ((index % count) + count) % count;
}

export function getSwipeStep(gesture, threshold = 50) {
  const horizontal = gesture.endX - gesture.startX;
  const vertical = gesture.endY - gesture.startY;
  const horizontalDistance = Math.abs(horizontal);
  const verticalDistance = Math.abs(vertical);

  if (horizontalDistance < threshold || horizontalDistance <= verticalDistance) return 0;
  return horizontal < 0 ? 1 : -1;
}

const noOpViewer = () => ({
  open() {},
  close() {},
  show() {},
  destroy() {},
});

export function createGalleryViewer(root) {
  if (!root?.querySelector || !root?.querySelectorAll) return noOpViewer();

  const grid = root.querySelector('[data-gallery-grid]');
  const dialog = root.querySelector('[data-gallery-dialog]');
  const viewerImage = root.querySelector('[data-gallery-viewer-image]');
  const status = root.querySelector('[data-gallery-status]');
  const previous = root.querySelector('[data-gallery-previous]');
  const next = root.querySelector('[data-gallery-next]');
  const closeButton = root.querySelector('[data-gallery-close]');
  const items = [...root.querySelectorAll('[data-gallery-item]')];
  const required = [grid, dialog, viewerImage, status, previous, next, closeButton];
  const validItems = items.length > 0 && items.every(item => {
    const image = item.querySelector?.('img');
    return Boolean(item.dataset?.full && image?.getAttribute('alt'));
  });

  if (required.some(element => !element) || !validItems || typeof dialog.showModal !== 'function') {
    return noOpViewer();
  }

  const documentBody = dialog.ownerDocument?.body;
  const ownerDocument = dialog.ownerDocument;
  let currentIndex = 0;
  let origin = null;
  let pointerStart = null;

  const preloadNeighbours = () => {
    if (typeof Image !== 'function') return;
    const neighbourIndexes = [
      normaliseGalleryIndex(currentIndex - 1, items.length),
      normaliseGalleryIndex(currentIndex + 1, items.length),
    ];
    for (const index of new Set(neighbourIndexes)) {
      const preload = new Image();
      preload.src = items[index].dataset.full;
    }
  };

  const show = index => {
    currentIndex = normaliseGalleryIndex(index, items.length);
    const item = items[currentIndex];
    const thumbnail = item.querySelector('img');
    viewerImage.src = item.dataset.full;
    viewerImage.alt = thumbnail.getAttribute('alt');
    status.textContent = `${currentIndex + 1} of ${items.length}`;
    preloadNeighbours();
  };

  const restorePage = () => {
    documentBody?.classList.remove('gallery-viewer-open');
    const focusTarget = origin;
    origin = null;
    focusTarget?.focus();
  };

  const close = () => {
    if (dialog.open) dialog.close();
    restorePage();
  };

  const open = index => {
    const targetIndex = normaliseGalleryIndex(index, items.length);
    origin = items[targetIndex];
    show(targetIndex);
    documentBody?.classList.add('gallery-viewer-open');
    if (!dialog.open) dialog.showModal();
    closeButton.focus();
  };

  const onGridClick = event => {
    const item = event.target.closest?.('[data-gallery-item]');
    const index = items.indexOf(item);
    if (index >= 0) open(index);
  };
  const onPrevious = () => show(currentIndex - 1);
  const onNext = () => show(currentIndex + 1);
  const onClose = () => close();
  const onCancel = event => {
    event.preventDefault();
    close();
  };
  const onDialogClose = () => restorePage();
  const onDialogClick = event => {
    if (event.target === dialog) close();
  };
  const onKeyDown = event => {
    if (!dialog.open) return;
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      onPrevious();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      onNext();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      close();
    }
  };
  const onPointerDown = event => {
    pointerStart = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY };
  };
  const onPointerUp = event => {
    if (!pointerStart || event.pointerId !== pointerStart.pointerId) return;
    const step = getSwipeStep({
      ...pointerStart,
      endX: event.clientX,
      endY: event.clientY,
    });
    pointerStart = null;
    if (step) show(currentIndex + step);
  };

  grid.addEventListener('click', onGridClick);
  previous.addEventListener('click', onPrevious);
  next.addEventListener('click', onNext);
  closeButton.addEventListener('click', onClose);
  dialog.addEventListener('cancel', onCancel);
  dialog.addEventListener('close', onDialogClose);
  dialog.addEventListener('click', onDialogClick);
  ownerDocument.addEventListener('keydown', onKeyDown);
  dialog.addEventListener('pointerdown', onPointerDown);
  dialog.addEventListener('pointerup', onPointerUp);

  return {
    open,
    close,
    show,
    destroy() {
      close();
      grid.removeEventListener('click', onGridClick);
      previous.removeEventListener('click', onPrevious);
      next.removeEventListener('click', onNext);
      closeButton.removeEventListener('click', onClose);
      dialog.removeEventListener('cancel', onCancel);
      dialog.removeEventListener('close', onDialogClose);
      dialog.removeEventListener('click', onDialogClick);
      ownerDocument.removeEventListener('keydown', onKeyDown);
      dialog.removeEventListener('pointerdown', onPointerDown);
      dialog.removeEventListener('pointerup', onPointerUp);
    },
  };
}

if (typeof document !== 'undefined') createGalleryViewer(document);
