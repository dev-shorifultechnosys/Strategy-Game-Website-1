/* Fortress — shared application shell, game hub, themes and responsive navigation. */
(() => {
  'use strict';

  const page = document.body.dataset.page || 'home';
  const root = document.documentElement;
  const icons = {
    home:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 11.5 12 5l8 6.5V20H4z"/><path d="M9 20v-6h6v6"/></svg>',
    play:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M8 7h8a4 4 0 0 1 3.8 2.8l1.1 3.6A3 3 0 0 1 18 17h-1.2l-2-2h-5.6l-2 2H6a3 3 0 0 1-2.9-3.6l1.1-3.6A4 4 0 0 1 8 7Z"/><path d="M7 11h4M9 9v4M16 11h.01M18 13h.01"/></svg>',
    watch:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2.5 12s3.6-6 9.5-6 9.5 6 9.5 6-3.6 6-9.5 6-9.5-6Z"/><circle cx="12" cy="12" r="2.7"/></svg>',
    ranks:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M8 4h8v4a4 4 0 0 1-8 0z"/><path d="M8 6H4v1a4 4 0 0 0 4 4M16 6h4v1a4 4 0 0 1-4 4M12 12v5M8 20h8M9 17h6"/></svg>',
    rules:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 5a3 3 0 0 1 3-2h5v17H7a3 3 0 0 0-3 2zM20 5a3 3 0 0 0-3-2h-5v17h5a3 3 0 0 1 3 2z"/></svg>',
    survey:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M7 4h10a2 2 0 0 1 2 2v15H5V6a2 2 0 0 1 2-2Z"/><path d="M9 2h6v4H9zM8 10h8M8 14h8M8 18h5"/></svg>',
    themes:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 0 0 18c2 0 3-1.4 2.2-2.6-.7-1.1.1-2.4 1.4-2.4H17a4 4 0 0 0 4-4c0-5-4-9-9-9Z"/></svg>',
    feedback:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 5h16v12H8l-4 3z"/><path d="M8 9h8M8 13h5"/></svg>',
    bell:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 17h12l-1.4-2V10a4.6 4.6 0 0 0-9.2 0v5z"/><path d="M10 20h4"/></svg>',
    user:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
    sun:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3.5"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    close:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m6 6 12 12M18 6 6 18"/></svg>',
    arrow:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 12h14M14 7l5 5-5 5"/></svg>',
    menu:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7h16M4 12h16M4 17h16"/></svg>'
  };

  const primary = [
    ['home','index.html','Home',icons.home],['play','play.html','Play',icons.play],['watch','watch.html','Watch',icons.watch],
    ['ranks','ranks.html','Ranks',icons.ranks],['rules','rules.html','Learn',icons.rules]
  ];
  const utility = [
    ['survey','survey.html','Playtest',icons.survey],
    ['feedback','feedback.html','Feedback',icons.feedback],['notifications','notifications.html','Notifications',icons.bell]
  ];
  const navMarkup = items => items.map(([id,href,label,icon]) => `<a class="nav-link ${page===id?'active':''}" href="${href}">${icon}<span>${label}</span></a>`).join('');

  const auth = localStorage.getItem('fortress-auth') === 'true';
  let profile = {};
  try { profile = JSON.parse(localStorage.getItem('fortress-demo-account') || '{}') || {}; } catch (_) {}
  const displayName = auth ? (profile.name || 'You') : 'Guest';
  const avatar = (displayName.trim()[0] || 'G').toUpperCase();

  const shell = document.querySelector('[data-shell]');
  if (shell) shell.innerHTML = `
    <aside class="sidebar" aria-label="Primary navigation">
      <a class="brand" href="index.html" aria-label="Fortress home"><i class="brand-mark"></i><span>Fortress</span></a>
      <nav class="nav">${navMarkup(primary)}</nav>
      <nav class="nav nav-utility">${navMarkup(utility)}</nav>
      <div class="sidebar-bottom">
        <div class="sidebar-appearance-row"><a class="sidebar-appearance-link" href="themes.html">${icons.themes}<span>Appearance</span></a><button class="sidebar-theme-toggle compact" data-theme-toggle type="button" aria-label="Toggle light and dark mode">${icons.sun}</button></div>
        <a class="account-mini" href="${auth?'profile.html':'login.html'}">
          <span class="account-avatar">${avatar}</span><span><strong>${displayName}</strong><small>${auth?'1200 · Gold':'Guest session'}</small></span><span class="account-chevron">›</span>
        </a>
        ${auth ? '<button class="btn btn-ghost btn-block" type="button" data-logout>Logout</button>' : '<a class="btn btn-primary btn-block" href="signup.html">Create account</a><a class="btn btn-ghost btn-block" href="login.html">Login</a>'}
      </div>
    </aside>`;

  const mobileTop = document.querySelector('[data-mobile-top]');
  if (mobileTop) mobileTop.innerHTML = `<a class="brand" href="index.html"><i class="brand-mark"></i><span>Fortress</span></a><div class="mobile-actions"><button class="icon-btn" data-theme-toggle aria-label="Toggle theme">${icons.sun}</button><a class="icon-btn" href="${auth?'profile.html':'login.html'}" aria-label="Account">${icons.user}</a></div>`;

  const mobileBottom = document.querySelector('[data-mobile-bottom]');
  if (mobileBottom) mobileBottom.innerHTML = `
    ${primary.slice(0,4).map(([id,href,label,icon])=>`<a href="${href}" class="${page===id?'active':''}">${icon}<span>${label}</span></a>`).join('')}
    <button type="button" data-mobile-menu>${icons.menu}<span>More</span></button>`;

  if (!document.querySelector('.mobile-more-drawer')) document.body.insertAdjacentHTML('beforeend', `
    <div class="mobile-more-drawer" aria-hidden="true">
      <div class="mobile-more-card card"><div class="modal-head"><div><div class="eyebrow">Navigate</div><h3>More</h3></div><button class="icon-btn" data-mobile-menu-close>${icons.close}</button></div>
      <div class="mobile-more-grid">${navMarkup([...primary.slice(4),...utility])}<a class="nav-link ${page==='themes'?'active':''}" href="themes.html">${icons.themes}<span>Appearance</span></a><a class="nav-link" href="profile.html">${icons.user}<span>Profile & settings</span></a></div></div>
    </div>`);

  const rightRail = document.querySelector('[data-right-rail]');
  if (rightRail) rightRail.innerHTML = `
    <div class="game-hub" data-game-hub>
      <div class="hub-tabs" role="tablist"><button class="active" data-hub-tab="new">+<span>New Game</span></button><a href="games.html">☷<span>Games</span></a><a href="players.html">♙<span>Players</span></a></div>
      <div class="hub-panel active" data-hub-panel="new">
        <div class="card quick-card quick-card-v2"><div class="quick-title"><div><div class="eyebrow">Ready room</div><h3>Quick Play</h3><div class="muted small">15 min · Casual</div></div><button class="icon-btn" data-open-modal="quickSettingsModal">☷</button></div><div class="quick-facts"><span><b>&lt;1 min</b><small>est. wait</small></span><span><b>15 min</b><small>clock</small></span><span><b>Casual</b><small>queue</small></span></div><a class="btn btn-primary btn-block" href="play.html">Play now ${icons.arrow}</a></div>
        <button class="quick-option" data-open-modal="botModal"><span class="quick-symbol">◈</span><span class="quick-copy"><strong>Play vs Bot</strong><span>Pick a persona</span></span><b>›</b></button>
        <button class="quick-option" data-open-modal="roomModal"><span class="quick-symbol cyan">#</span><span class="quick-copy"><strong>Private room</strong><span>Join with a code</span></span><b>›</b></button>
        
        ${auth?'':'<div class="quick-note quick-signup"><div><strong>Create a free account</strong><span>Save games, preferences and ladder progress.</span></div><a class="btn btn-sm" href="signup.html">Create account</a></div>'}
      </div>
      <div class="hub-panel" data-hub-panel="games"><div class="hub-empty"><div class="eyebrow">Recent games</div><h3>Preview history</h3><div class="hub-game-row"><span>vs Nova</span><strong>Turn 7</strong><small>In progress</small></div><div class="hub-game-row"><span>vs Aria</span><strong>Win</strong><small>Yesterday</small></div><a class="btn btn-primary btn-block" href="play.html">Continue game</a></div></div>
      <div class="hub-panel" data-hub-panel="players"><div class="hub-empty"><div class="eyebrow">Players online</div><h3>Ready to challenge</h3>${['Wiggins · 1540','HexMaster · 1884','NorthWall · 1760'].map(x=>`<div class="hub-player-row"><span class="dot"></span><span>${x}</span><button class="btn btn-sm" data-demo-action="Challenge sent">Challenge</button></div>`).join('')}</div></div>
    </div>`;

  if (!document.getElementById('botModal')) document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-backdrop" id="botModal" role="dialog" aria-modal="true"><div class="modal card"><div class="modal-head"><div><div class="eyebrow">Bot ladder</div><h3>Choose an opponent</h3><div class="muted small">Seven tactical profiles from 800 to 2450.</div></div><button class="icon-btn" data-close-modal>${icons.close}</button></div><div class="bot-modal-grid">${[['Aria','800','Beginner','♜','aria'],['Maya','1100','Solid','◆','maya'],['Nova','1400','Balanced','◈','nova'],['Kai','1700','Tactical','⚔','kai'],['Zen','2000','Positional','⬡','zen'],['Vex','2300','Ruthless','✦','vex'],['Apex','2450','Elite','♛','apex']].map(([n,r,s,sy,c])=>`<button class="bot-pick" data-bot-select="${n}"><span class="bot-crest ${c}">${sy}</span><span><strong>${n}</strong><small>${r} · ${s}</small></span></button>`).join('')}</div></div></div>
    <div class="modal-backdrop" id="roomModal" role="dialog" aria-modal="true"><div class="modal card"><div class="modal-head"><div><div class="eyebrow">Invite only</div><h3>Private room</h3><div class="muted small">Join a friend with a room code or create a room.</div></div><button class="icon-btn" data-close-modal>${icons.close}</button></div><form data-room-form class="form-grid"><div><label for="roomCode">Join code</label><input class="input" id="roomCode" name="room" maxlength="12" placeholder="FORT-82A" autocomplete="off"></div><button class="btn btn-primary" type="submit">Join code</button><button class="btn" type="button" data-create-room>Create new room</button><div class="room-result" data-room-result></div></form></div></div>
    <div class="modal-backdrop" id="quickSettingsModal" role="dialog" aria-modal="true"><div class="modal card"><div class="modal-head"><div><div class="eyebrow">Quick Play</div><h3>Match settings</h3></div><button class="icon-btn" data-close-modal>${icons.close}</button></div><div class="form-grid"><label>Time control<select data-quick-time><option>10 min</option><option selected>15 min</option><option>30 min</option></select></label><label>Queue<select data-quick-queue><option>Casual</option><option>Ranked</option></select></label><button class="btn btn-primary" data-demo-action="Quick Play settings saved">Save settings</button></div></div></div>`);

  const savedTheme = localStorage.getItem('fortress-theme') || 'dark';
  const savedBg = localStorage.getItem('fortress-bg') || 'gunmetal';
  root.dataset.theme = savedTheme; document.body.dataset.bg = savedBg;
  applyReducedMotion();

  const bgSelect = document.querySelector('[data-bg-theme]');
  if (bgSelect) {
    const knownBg = [...bgSelect.options].some(option => option.value === savedBg) ? savedBg : 'gunmetal';
    bgSelect.value = knownBg;
    bgSelect.addEventListener('change', () => {
      const value = bgSelect.value;
      document.body.dataset.bg = value;
      localStorage.setItem('fortress-bg', value);
      toast(`${prettyMaterialName(value)} surface enabled`);
    });
  }

  document.addEventListener('click', event => {
    const theme = event.target.closest('[data-theme-toggle]');
    if (theme) { const next = root.dataset.theme==='dark'?'light':'dark'; root.dataset.theme=next; localStorage.setItem('fortress-theme',next); toast(`${capitalize(next)} mode enabled`); }
    const open = event.target.closest('[data-open-modal]'); if (open) openModal(open.dataset.openModal);
    const close = event.target.closest('[data-close-modal]'); if (close) closeModal(close.closest('.modal-backdrop'));
    const demo = event.target.closest('[data-demo-action]'); if (demo) toast(demo.dataset.demoAction);
    if (event.target.closest('[data-logout]')) { localStorage.setItem('fortress-auth','false'); toast('Signed out of demo session'); setTimeout(()=>location.href='index.html',350); }
    if (event.target.closest('[data-mobile-menu]')) toggleMobileMore(true);
    if (event.target.closest('[data-mobile-menu-close]')) toggleMobileMore(false);
    const hub = event.target.closest('[data-hub-tab]'); if (hub) setHubTab(hub.dataset.hubTab);
    const createRoom = event.target.closest('[data-create-room]'); if (createRoom) createDemoRoom();
  });
  document.querySelectorAll('.modal-backdrop').forEach(backdrop=>backdrop.addEventListener('click',e=>{if(e.target===backdrop) closeModal(backdrop);}));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){document.querySelectorAll('.modal-backdrop.open').forEach(closeModal);toggleMobileMore(false);}});

  document.querySelector('[data-room-form]')?.addEventListener('submit', event => { event.preventDefault(); const code=String(new FormData(event.currentTarget).get('room')||'').trim().toUpperCase(); const result=document.querySelector('[data-room-result]'); if(!code){toast('Enter a room code');return;} localStorage.setItem('fortress-room-code',code); if(result) result.textContent=`Room ${code} is ready. Opening local board…`; toast(`Joining ${code}`); setTimeout(()=>location.href=`play.html?room=${encodeURIComponent(code)}`,500); });

  const syncBotSelection=()=>{const selected=localStorage.getItem('fortress-bot')||'Nova';document.querySelectorAll('[data-bot-select]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.botSelect===selected?'true':'false'));};
  syncBotSelection();
  document.querySelectorAll('[data-bot-select]').forEach(button=>button.addEventListener('click',()=>{localStorage.setItem('fortress-bot',button.dataset.botSelect);syncBotSelection();toast(`${button.dataset.botSelect} selected`);closeModal(button.closest('.modal-backdrop'));if(page==='play') location.href='play.html';}));

  function setHubTab(name){document.querySelectorAll('[data-hub-tab]').forEach(b=>b.classList.toggle('active',b.dataset.hubTab===name));document.querySelectorAll('[data-hub-panel]').forEach(p=>p.classList.toggle('active',p.dataset.hubPanel===name));}
  function toggleMobileMore(open){const drawer=document.querySelector('.mobile-more-drawer');if(!drawer)return;drawer.classList.toggle('open',open);drawer.setAttribute('aria-hidden',open?'false':'true');}
  function createDemoRoom(){const code=`FORT-${Math.random().toString(36).slice(2,5).toUpperCase()}`;localStorage.setItem('fortress-room-code',code);const result=document.querySelector('[data-room-result]');if(result) result.textContent=`Room created: ${code}`;toast(`Room ${code} created`);}
  function applyReducedMotion(){root.classList.toggle('reduced-motion',localStorage.getItem('fortress-setting-reduced-motion')==='true');}
  function openModal(id){document.getElementById(id)?.classList.add('open');}
  function closeModal(modal){modal?.classList.remove('open');}
  window.fortressOpenModal=openModal;

  let toastTimer; function toast(message){let node=document.querySelector('.toast');if(!node){node=document.createElement('div');node.className='toast';document.body.appendChild(node);}node.textContent=message;node.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>node.classList.remove('show'),2400);} window.fortressToast=toast;
  window.fortressSound=()=>{if(localStorage.getItem('fortress-setting-sound')==='false')return;try{const C=window.AudioContext||window.webkitAudioContext;const c=new C();const o=c.createOscillator();const g=c.createGain();o.frequency.value=620;g.gain.setValueAtTime(.025,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+.08);o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+.08);}catch(_){}};
  function prettyMaterialName(v){return String(v||'').split('-').map(capitalize).join(' ');}
  function capitalize(v){return v?v[0].toUpperCase()+v.slice(1):v;}
})();
