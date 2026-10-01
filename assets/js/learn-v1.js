
(() => {
  'use strict';
  if (document.body.dataset.page !== 'rules') return;

  const sections = [...document.querySelectorAll('[data-rule-section]')];
  const links = [...document.querySelectorAll('.learn-nav a')];
  const label = document.querySelector('[data-learn-progress-label]');
  const bar = document.querySelector('[data-learn-progress-bar]');

  const setStep = (step) => {
    const n = Math.max(1, Math.min(7, Number(step) || 1));
    if (label) label.textContent = `Step ${n} of 7`;
    if (bar) bar.style.width = `${(n / 7) * 100}%`;
    links.forEach(link => {
      const target = document.querySelector(link.getAttribute('href'));
      link.classList.toggle('active', target?.dataset.step === String(n));
    });
  };

  // Always start correctly at Step 1 / Goal unless the URL explicitly targets a lesson.
  const hashTarget = location.hash ? document.querySelector(location.hash) : null;
  const initialStep = hashTarget?.dataset.step || '1';
  setStep(initialStep);

  // Reliable scroll-spy: activate the last section whose top has crossed the reading line.
  const updateFromScroll = () => {
    const readingLine = Math.max(140, window.innerHeight * 0.28);
    let active = 1;
    for (const section of sections) {
      if (section.getBoundingClientRect().top <= readingLine) {
        active = Number(section.dataset.step) || active;
      } else {
        break;
      }
    }
    setStep(active);
  };

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      updateFromScroll();
      ticking = false;
    });
  };
  window.addEventListener('scroll', onScroll, { passive:true });
  window.addEventListener('resize', onScroll);
  window.addEventListener('hashchange', () => {
    const target = location.hash ? document.querySelector(location.hash) : null;
    if (target?.dataset.step) setStep(target.dataset.step);
  });

  links.forEach(link => {
    link.addEventListener('click', () => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target?.dataset.step) setStep(target.dataset.step);
    });
  });

  document.querySelector('[data-learn-undo]')?.addEventListener('click', event => {
    const btn = event.currentTarget;
    btn.textContent = 'Move 1 restored';
    btn.setAttribute('aria-live','polite');
    setTimeout(() => btn.textContent = 'Undo', 1200);
  });

  const promotionButton = document.querySelector('[data-promotion-demo]');
  const promotionPopover = document.querySelector('[data-promotion-popover]');
  promotionButton?.addEventListener('click', () => {
    if (!promotionPopover) return;
    const willOpen = promotionPopover.hasAttribute('hidden');
    promotionPopover.toggleAttribute('hidden', !willOpen);
    promotionButton.setAttribute('aria-expanded', String(willOpen));
  });

  // One post-layout sync fixes browser restore/anchor edge cases.
  requestAnimationFrame(() => {
    if (!location.hash && window.scrollY < 120) setStep(1);
    else updateFromScroll();
  });
})();
