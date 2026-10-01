
(() => {
  'use strict';
  if (document.body.dataset.page !== 'notifications') return;

  const cards = [...document.querySelectorAll('[data-notification]')];
  const filters = [...document.querySelectorAll('[data-filter]')];
  const unreadOnly = document.querySelector('[data-unread-only]');
  const markAll = document.querySelector('[data-mark-read-v1]');
  const empty = document.querySelector('[data-notification-empty]');
  const unreadCount = document.querySelector('[data-unread-count]');
  const totalCount = document.querySelector('[data-total-count]');
  let activeFilter = 'all';

  const updateCounts = () => {
    const unread = cards.filter(card => card.classList.contains('unread')).length;
    if (unreadCount) unreadCount.textContent = unread;
    if (totalCount) totalCount.textContent = cards.length;
    filters.forEach(btn => {
      const key = btn.dataset.filter;
      const count = key === 'all' ? cards.length : cards.filter(card => card.dataset.category === key).length;
      const badge = btn.querySelector('span');
      if (badge) badge.textContent = count;
    });
  };

  const render = () => {
    let visible = 0;
    cards.forEach(card => {
      const categoryMatch = activeFilter === 'all' || card.dataset.category === activeFilter;
      const unreadMatch = !unreadOnly?.checked || card.classList.contains('unread');
      const show = categoryMatch && unreadMatch;
      card.hidden = !show;
      if (show) visible++;
    });
    if (empty) empty.hidden = visible !== 0;
    updateCounts();
  };

  filters.forEach(btn => {
    btn.addEventListener('click', () => {
      activeFilter = btn.dataset.filter;
      filters.forEach(other => {
        const selected = other === btn;
        other.classList.toggle('active', selected);
        other.setAttribute('aria-selected', selected ? 'true' : 'false');
      });
      render();
    });
  });

  unreadOnly?.addEventListener('change', render);

  markAll?.addEventListener('click', () => {
    cards.forEach(card => {
      card.classList.remove('unread');
      card.classList.add('read');
    });
    localStorage.setItem('fortress-notifications-read', 'true');
    markAll.textContent = 'All read';
    markAll.disabled = true;
    render();
  });

  if (localStorage.getItem('fortress-notifications-read') === 'true') {
    cards.forEach(card => {
      card.classList.remove('unread');
      card.classList.add('read');
    });
    if (markAll) {
      markAll.textContent = 'All read';
      markAll.disabled = true;
    }
  }

  updateCounts();
  render();
})();
