'use strict';
const viewButtons = document.querySelectorAll('[data-view]');
function setPreviewWidth(view) {
  if (view !== 'desktop' && view !== 'mobile') throw new Error('Choose desktop or mobile.');
  document.querySelector('.designs').classList.toggle('mobile-previews', view === 'mobile');
  viewButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.view === view)));
  document.querySelector('#view-status').textContent = `All three concepts are now shown at ${view} width.`;
  return { view, concepts: 3 };
}
viewButtons.forEach(button => button.addEventListener('click', () => setPreviewWidth(button.dataset.view)));
if (document.modelContext?.registerTool) {
  try {
    Promise.resolve(document.modelContext.registerTool({
      name: 'set_concept_preview_width',
      title: 'Change concept preview width',
      description: 'Show the three KJP website design concepts at desktop or mobile width.',
      inputSchema: {type: 'object', properties: {view: {type: 'string', enum: ['desktop', 'mobile']}}, required: ['view'], additionalProperties: false},
      annotations: {readOnlyHint: false},
      execute(input) {
        if (!input || Object.keys(input).some(key => key !== 'view')) throw new Error('Supply only a view.');
        return setPreviewWidth(input.view);
      }
    })).catch(() => {});
  } catch (_) { /* The proposal remains usable without browser agent support. */ }
}
