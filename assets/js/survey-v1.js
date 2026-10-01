
(() => {
  'use strict';
  if (document.body.dataset.page !== 'survey') return;

  const form = document.querySelector('[data-survey-wizard]');
  if (!form) return;

  const steps = [...form.querySelectorAll('[data-survey-step]')];
  const progress = [...document.querySelectorAll('[data-survey-jump]')];
  const line = document.querySelector('[data-playtest-line]');
  const heading = document.querySelector('[data-playtest-heading]');
  const badge = document.querySelector('[data-playtest-badge]');
  const hint = document.querySelector('[data-playtest-hint]');
  const next = form.querySelector('[data-survey-next]');
  const submit = form.querySelector('[data-survey-submit]');
  const titles = ['Player background','Gameplay clarity','Enjoyment & replay','Final feedback'];

  const currentIndex = () => Math.max(0, steps.findIndex(s => s.classList.contains('active')));

  const sync = () => {
    const i = currentIndex();
    if (line) line.style.width = `${((i + 1) / steps.length) * 100}%`;
    if (heading) heading.textContent = titles[i] || titles[0];
    if (badge) badge.textContent = `Step ${i + 1} / ${steps.length}`;

    const step = steps[i];
    let ready = true;
    const required = [...step.querySelectorAll('[required]')];
    for (const field of required) {
      if (field.type === 'radio') {
        if (!step.querySelector(`[name="${CSS.escape(field.name)}"]:checked`)) ready = false;
      } else if (!field.checkValidity()) ready = false;
    }

    if (hint) {
      hint.textContent = i === steps.length - 1
        ? (ready ? 'Ready to submit your feedback' : 'Complete the required answer')
        : (ready ? 'Ready for the next step' : 'Choose the required answer to continue');
    }
    if (next && !next.hidden) next.classList.toggle('needs-answer', !ready);
    if (submit && !submit.hidden) submit.classList.toggle('needs-answer', !ready);
  };

  form.addEventListener('change', sync);
  progress.forEach(btn => btn.addEventListener('click', () => requestAnimationFrame(sync)));
  form.querySelector('[data-survey-next]')?.addEventListener('click', () => requestAnimationFrame(sync));
  form.querySelector('[data-survey-back]')?.addEventListener('click', () => requestAnimationFrame(sync));

  // Friendly visual validation on required steps.
  form.addEventListener('invalid', event => {
    const section = event.target.closest('[data-survey-step]');
    section?.classList.remove('survey-invalid');
    requestAnimationFrame(() => section?.classList.add('survey-invalid'));
    if (hint) hint.textContent = 'Complete the required answer to continue';
  }, true);

  // Textarea counters.
  ['improve','keep'].forEach(id => {
    const field = document.getElementById(id);
    const counter = document.querySelector(`[data-count-for="${id}"]`);
    const update = () => { if (counter && field) counter.textContent = `${field.value.length} / ${field.maxLength || 600}`; };
    field?.addEventListener('input', update);
    update();
  });

  // Replace the prototype reset behavior with a useful completion state.
  const observer = new MutationObserver(() => {
    if (!form.classList.contains('survey-complete')) return;
    observer.disconnect();
    form.innerHTML = `
      <div class="playtest-success">
        <div class="playtest-success-icon">✓</div>
        <div class="eyebrow">Feedback saved</div>
        <h2>Thanks for helping improve Fortress.</h2>
        <p>Your responses were saved locally in this prototype. The production version can send the same structured feedback to the live playtest endpoint.</p>
        <div class="success-actions">
          <a class="btn btn-primary" href="play.html">Return to Play →</a>
          <a class="btn" href="watch.html">Watch a live match</a>
        </div>
      </div>`;
  });
  observer.observe(form, { attributes:true, attributeFilter:['class'] });

  // "None" excludes other confusion answers, and vice versa.
  const confusion = [...form.querySelectorAll('input[name="confusing"]')];
  confusion.forEach(input => input.addEventListener('change', () => {
    if (!input.checked) return;
    if (input.value === 'none') confusion.forEach(other => { if (other !== input) other.checked = false; });
    else {
      const none = confusion.find(x => x.value === 'none');
      if (none) none.checked = false;
    }
  }));

  // Initial sync after pages.js builds 1–5 scales and shows step 1.
  requestAnimationFrame(sync);
})();


// Playtest V1.1 interaction polish
(() => {
  'use strict';
  if (document.body.dataset.page !== 'survey') return;
  const form = document.querySelector('[data-survey-wizard]');
  if (!form) return;

  const hint = document.querySelector('[data-playtest-hint]');
  const next = form.querySelector('[data-survey-next]');
  const submit = form.querySelector('[data-survey-submit]');

  const currentStep = () => [...form.querySelectorAll('[data-survey-step]')]
    .find(section => section.classList.contains('active'));

  const isReady = (step) => {
    if (!step) return true;
    const required = [...step.querySelectorAll('[required]')];
    for (const field of required) {
      if (field.type === 'radio') {
        if (!step.querySelector(`input[name="${CSS.escape(field.name)}"]:checked`)) return false;
      } else if (!field.checkValidity()) {
        return false;
      }
    }
    return true;
  };

  const refreshGuidance = () => {
    const step = currentStep();
    const ready = isReady(step);
    const idx = [...form.querySelectorAll('[data-survey-step]')].indexOf(step);
    if (hint) {
      hint.textContent = idx === 3
        ? (ready ? 'Ready to submit your feedback' : 'Complete the required answer')
        : (ready ? 'Ready for the next step' : 'Choose the required answer to continue');
    }
    next?.classList.toggle('needs-answer', !ready);
    submit?.classList.toggle('needs-answer', !ready);
  };

  form.addEventListener('change', refreshGuidance);
  form.addEventListener('click', e => {
    if (e.target.closest('[data-survey-next],[data-survey-back],[data-survey-jump]')) {
      requestAnimationFrame(refreshGuidance);
    }
  });
  requestAnimationFrame(refreshGuidance);
})();
