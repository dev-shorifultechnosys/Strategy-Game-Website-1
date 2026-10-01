
(() => {
  'use strict';
  if (document.body.dataset.page !== 'feedback') return;
  const form = document.querySelector('[data-feedback-form-v1]');
  if (!form) return;

  const text = form.querySelector('#feedbackText');
  const count = form.querySelector('[data-feedback-count]');
  const typeError = form.querySelector('[data-type-error]');
  const textError = form.querySelector('[data-text-error]');
  const upload = form.querySelector('input[type="file"]');
  const uploadLabel = form.querySelector('[data-upload-label]');
  const user = form.querySelector('[data-feedback-user]');

  const pageName = 'Feedback';
  const themeName = (document.documentElement.dataset.theme || 'dark').replace(/^./, s => s.toUpperCase());
  const storedSurface = localStorage.getItem('fortress-surface') || localStorage.getItem('fortress-background') || 'Brushed Gunmetal';
  const storedBoard = localStorage.getItem('fortress-board-theme') || localStorage.getItem('fortress-board') || 'Honed Slate';

  const setText = (selector, value) => {
    const el = form.querySelector(selector);
    if (el) el.textContent = value;
  };
  setText('[data-context-page]', pageName);
  setText('[data-context-theme]', themeName);
  setText('[data-context-surface]', storedSurface);
  setText('[data-context-board]', storedBoard);

  if (user) user.textContent = localStorage.getItem('fortress-user') || 'Guest';

  const syncCount = () => {
    if (!text || !count) return;
    count.textContent = `${text.value.length} / ${text.maxLength || 4000}`;
  };
  text?.addEventListener('input', () => {
    syncCount();
    if (text.value.trim()) textError.hidden = true;
  });
  syncCount();

  form.querySelectorAll('input[name="type"]').forEach(input => {
    input.addEventListener('change', () => { typeError.hidden = true; });
  });

  upload?.addEventListener('change', () => {
    const file = upload.files?.[0];
    if (!uploadLabel) return;
    if (!file) {
      uploadLabel.textContent = 'Choose file';
      return;
    }
    const max = 5 * 1024 * 1024;
    if (file.size > max) {
      upload.value = '';
      uploadLabel.textContent = 'Max 5 MB';
      return;
    }
    uploadLabel.textContent = file.name.length > 24 ? file.name.slice(0,21) + '…' : file.name;
  });

  form.addEventListener('submit', event => {
    event.preventDefault();

    const selected = form.querySelector('input[name="type"]:checked');
    const hasText = !!text?.value.trim();
    typeError.hidden = !!selected;
    textError.hidden = hasText;

    if (!selected || !hasText) {
      const firstInvalid = !selected ? form.querySelector('.feedback-type-grid') : text;
      firstInvalid?.scrollIntoView({ behavior:'smooth', block:'center' });
      return;
    }

    const file = upload?.files?.[0];
    const payload = {
      type: selected.value,
      feedback: text.value.trim(),
      page: pageName,
      theme: document.documentElement.dataset.theme || 'dark',
      surface: storedSurface,
      boardTheme: storedBoard,
      screenshotName: file?.name || '',
      submittedAt: new Date().toISOString()
    };
    localStorage.setItem('fortress-feedback-last', JSON.stringify(payload));

    form.innerHTML = `
      <div class="feedback-success">
        <div>
          <div class="feedback-success-icon">✓</div>
          <div class="eyebrow">Feedback saved</div>
          <h2>Thanks for helping improve Fortress.</h2>
          <p>Your report and the visible context details were saved locally in this prototype. The production build can send the same structured data to the live feedback endpoint.</p>
          <div class="feedback-success-actions">
            <a class="btn btn-primary" href="play.html">Return to Play →</a>
            <a class="btn" href="index.html">Back to Home</a>
          </div>
        </div>
      </div>`;
  });

  const themeObserver = new MutationObserver(() => {
    setText('[data-context-theme]', (document.documentElement.dataset.theme || 'dark').replace(/^./, s => s.toUpperCase()));
  });
  themeObserver.observe(document.documentElement, { attributes:true, attributeFilter:['data-theme'] });
})();
