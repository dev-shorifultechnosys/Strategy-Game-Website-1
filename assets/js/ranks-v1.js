
(() => {
  'use strict';
  if (document.body.dataset.page !== 'ranks') return;

  const rail = document.querySelector('[data-right-rail]');
  if (rail) rail.innerHTML = `
    <div class="ranks-rail-v1">
      <nav class="ranks-rail-tabs" aria-label="Competitive hub">
        <a href="games.html"><b>☷</b><span>Games</span></a>
        <a href="players.html"><b>♙</b><span>Players</span></a>
        <a class="active" href="ranks.html"><b>♛</b><span>Ranks</span></a>
      </nav>
      <section class="card ranks-rail-card">
        <div class="eyebrow">Your rank</div>
        <div class="rail-rank-hero"><div class="rail-rank-badge">247</div><div><h3>Gold</h3><p>1200 rating</p></div></div>
        <div class="rail-progress"><span></span></div>
        <p>50 points to the next competitive threshold.</p>
        <a class="btn btn-primary btn-block" href="play.html">Play ranked</a>
      </section>
      <section class="card ranks-rail-card">
        <div class="eyebrow">Top rival</div>
        <div class="rival-row"><span><strong>NorthWall</strong><small>#5 · 1760 rating</small></span><b>560 pts to catch</b></div>
        <p style="margin-top:10px">A long-term target visible without distracting from the leaderboard.</p>
      </section>
      <section class="card ranks-rail-card">
        <div class="eyebrow">Season progress</div>
        <h3>12 days left</h3>
        <p>Season 04 closes soon. Your current position and milestone remain visible across the competitive hub.</p>
      </section>
    </div>`;

  const rows = [...document.querySelectorAll('.rank-row[data-player]')];
  const gap = document.querySelector('[data-rank-gap]');
  const empty = document.querySelector('[data-rank-empty]');
  const search = document.querySelector('[data-rank-search]');
  const tier = document.querySelector('[data-rank-tier]');
  const tabs = [...document.querySelectorAll('[data-rank-scope]')];

  let scope = 'overall';

  function applyFilters(){
    const q = (search?.value || '').trim().toLowerCase();
    const tierValue = tier?.value || 'all';
    let visible = 0;

    rows.forEach((row, i) => {
      const name = row.dataset.player || '';
      const rowTier = row.dataset.tier || '';
      let show = (!q || name.includes(q)) && (tierValue === 'all' || rowTier === tierValue);

      if (scope === 'friends') {
        show = show && ['wiggins','northwall','you'].includes(name);
      } else if (scope === 'season') {
        show = show && name !== 'you' ? true : show;
      }

      row.hidden = !show;
      if (show) visible++;
    });

    if (gap) gap.hidden = !!q || tierValue !== 'all' || scope === 'friends';
    if (empty) empty.hidden = visible > 0;
  }

  search?.addEventListener('input', applyFilters);
  tier?.addEventListener('change', applyFilters);
  tabs.forEach(tab => tab.addEventListener('click', () => {
    scope = tab.dataset.rankScope;
    tabs.forEach(t => t.classList.toggle('active', t === tab));
    applyFilters();
  }));
})();
