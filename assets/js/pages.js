/* ================================================================
   Fortress Redesign — Page-Specific Enhancements
   ----------------------------------------------------------------
   Small behaviors that do not belong to the core game board. Everything
   is dependency-free and stored locally where a server is not required.
   ================================================================ */

(() => {
  'use strict';

  /* Watch page filters. */
  document.querySelectorAll('[data-match-filter]').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('[data-match-filter]').forEach(item => item.classList.remove('active'));
      button.classList.add('active');
      const filter = button.dataset.matchFilter;
      document.querySelectorAll('[data-match-card]').forEach(card => {
        card.hidden = !(filter === 'all' || card.dataset.mode === filter);
      });
    });
  });

  /* Theme Lab: save website backgrounds and board materials. */
  const liveThemeBoard = document.querySelector('[data-theme-live-board]');

  /* Theme Lab live board: same 85-cell Fortress geometry and piece family
     as Play. Each unit is a sibling of the clipped hex instead of a child of
     it, so the crystal pieces stay full-size and can never be clipped by the
     hexagon mask or overlapping rows. */
  if (liveThemeBoard && liveThemeBoard.classList.contains('theme-live-board-full') && !liveThemeBoard.children.length) {
    const rowLengths = [9,10,9,10,9,10,9,10,9];
    const topTypes = ['wall','bastion','tower','turret','keep','turret','tower','bastion','wall'];
    const supportCols = new Set([0,1,3,5,7,8,9]);

    rowLengths.forEach((length,rowIndex) => {
      const row = document.createElement('div');
      row.className = `hex-row ${length === 9 ? 'short-row' : 'long-row'}`;
      row.dataset.row = rowIndex;

      for (let col=0; col<length; col += 1) {
        const key = `${rowIndex}-${col}`;
        const slot = document.createElement('div');
        slot.className = 'theme-board-slot';
        slot.dataset.themeSlot = key;

        const cell = document.createElement('div');
        cell.className = `hex ${(rowIndex+col)%2===0 ? 'tone-a' : 'tone-b'}`;
        cell.dataset.themeCell = key;
        slot.appendChild(cell);

        const unit = themePreviewPiece(rowIndex,col,topTypes,supportCols);
        if (unit) {
          slot.classList.add('occupied');
          const piece = document.createElement('div');
          piece.className = `piece piece-v2 ${unit.side} ${unit.type}`;
          const colour = unit.side === 'you' ? 'white' : 'black';
          const strength = ({keep:9,tower:7,bastion:6,turret:4,wall:3})[unit.type];
          piece.setAttribute('aria-label', `${unit.type}, strength ${strength}`);
          piece.innerHTML = `<img src="assets/img/pieces/${colour}-${unit.type}.svg" alt="" draggable="false">`;
          slot.appendChild(piece);
          const badge = document.createElement('span');
          badge.className = `hex-strength ${unit.side}`;
          badge.textContent = strength;
          badge.setAttribute('aria-hidden','true');
          slot.appendChild(badge);
        }

        row.appendChild(slot);
      }
      liveThemeBoard.appendChild(row);
    });

    const previewCells = liveThemeBoard.querySelectorAll('.hex');
    [39,40,49].forEach(i => previewCells[i]?.classList.add('legal'));
    previewCells[48]?.classList.add('selected');
  }

  function themePreviewPiece(row,col,topTypes,supportCols) {
    if (row === 0) return {side:'enemy',type:topTypes[col]};
    if (row === 1 && supportCols.has(col)) return {side:'enemy',type:'wall'};
    if (row === 7 && supportCols.has(col)) return {side:'you',type:'wall'};
    if (row === 8) return {side:'you',type:topTypes[col]};
    return null;
  }

  function updateLiveThemeBoard(value) {
    if (!liveThemeBoard || !value) return;
    [...liveThemeBoard.classList].filter(name => name.startsWith('board-theme-')).forEach(name => liveThemeBoard.classList.remove(name));
    liveThemeBoard.classList.add(`board-theme-${value}`);
  }

  document.querySelectorAll('[data-bg-choice]').forEach(card => {
    card.addEventListener('click', () => {
      const value = card.dataset.bgChoice;
      document.body.dataset.bg = value;
      localStorage.setItem('fortress-bg', value);
      markSelected('[data-bg-choice]', value, 'bgChoice');
      updateThemeSelectionA11y();
      window.fortressToast?.(`${pretty(value)} background selected`);
    });
  });

  document.querySelectorAll('[data-board-choice]').forEach(card => {
    card.addEventListener('click', () => {
      const value = card.dataset.boardChoice;
      localStorage.setItem('fortress-board-theme', value);
      markSelected('[data-board-choice]', value, 'boardChoice');
      updateLiveThemeBoard(value);
      updateThemeSelectionA11y();
      window.fortressToast?.(`${pretty(value)} board material selected`);
    });
  });

  const savedBg = localStorage.getItem('fortress-bg') || document.body.dataset.bg || 'gunmetal';
  const savedBoard = localStorage.getItem('fortress-board-theme') || 'slate';
  markSelected('[data-bg-choice]', savedBg, 'bgChoice');
  markSelected('[data-board-choice]', savedBoard, 'boardChoice');
  updateLiveThemeBoard(savedBoard);
  updateThemeSelectionA11y();

  function markSelected(selector, value, datasetKey) {
    document.querySelectorAll(selector).forEach(item => item.classList.toggle('selected-theme', item.dataset[datasetKey] === value));
  }

  function updateThemeSelectionA11y() {
    document.querySelectorAll('[data-bg-choice], [data-board-choice]').forEach(item => {
      item.setAttribute('aria-pressed', item.classList.contains('selected-theme') ? 'true' : 'false');
    });
  }

  /* Rules page sticky topic navigation. */
  const ruleLinks = [...document.querySelectorAll('.rules-nav a')];
  const ruleSections = [...document.querySelectorAll('[data-rule-section]')];
  if (ruleLinks.length && ruleSections.length) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        ruleLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`));
      });
    }, { rootMargin: '-25% 0px -60% 0px' });
    ruleSections.forEach(section => observer.observe(section));
  }

  /* Demo forms validate locally; production can replace this with API calls. */
  document.querySelectorAll('[data-demo-form]').forEach(form => {
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const key = form.dataset.storageKey;
      if (key) {
        const values = Object.fromEntries(new FormData(form).entries());
        delete values.password; // never persist demo passwords
        localStorage.setItem(key, JSON.stringify(values));
      }
      window.fortressToast?.(form.dataset.success || 'Saved successfully');
    });
  });

  /* Settings switches persist locally so refresh does not reset the demo. */
  document.querySelectorAll('.switch[data-setting]').forEach(toggle => {
    const key = `fortress-setting-${toggle.dataset.setting}`;
    const saved = localStorage.getItem(key);
    if (saved !== null) toggle.classList.toggle('on', saved === 'true');
    toggle.setAttribute('aria-pressed', toggle.classList.contains('on'));

    toggle.addEventListener('click', () => {
      toggle.classList.toggle('on');
      const on = toggle.classList.contains('on');
      toggle.setAttribute('aria-pressed', on);
      localStorage.setItem(key, String(on));
    });
  });

  const themeSetting = document.querySelector('[data-profile-theme]');
  if (themeSetting) {
    const savedTheme = localStorage.getItem('fortress-theme') || 'dark';
    themeSetting.value = savedTheme;
    themeSetting.addEventListener('change', () => {
      document.documentElement.dataset.theme = themeSetting.value;
      localStorage.setItem('fortress-theme', themeSetting.value);
    });
  }

  const boardSetting = document.querySelector('[data-profile-board]');
  if (boardSetting) {
    boardSetting.value = localStorage.getItem('fortress-board-theme') || 'slate';
    boardSetting.addEventListener('change', () => {
      localStorage.setItem('fortress-board-theme', boardSetting.value);
      window.fortressToast?.(`${pretty(boardSetting.value)} board material saved`);
    });
  }

  function pretty(value) {
    return value.split('-').map(word => word[0].toUpperCase() + word.slice(1)).join(' ');
  }
})();

/* ------------------------------------------------------------------------
   Home hero preview: an 85-hex mini board with actual local SVG pieces.
   ------------------------------------------------------------------------ */
(() => {
  'use strict';
  const grid = document.querySelector('[data-mini-grid]');
  if (!grid) return;

  const rowLengths = [9,10,9,10,9,10,9,10,9];
  const whitePieces = new Map([
    ['7-0','wall'],['7-1','wall'],['7-3','wall'],['7-5','wall'],['7-7','wall'],['7-8','wall'],['7-9','wall'],
    ['8-0','wall'],['8-1','bastion'],['8-2','tower'],['8-3','turret'],['8-4','keep'],['8-5','turret'],['8-6','tower'],['8-7','bastion'],['8-8','wall']
  ]);
  const blackPieces = new Map([
    ['0-0','wall'],['0-1','bastion'],['0-2','tower'],['0-3','turret'],['0-4','keep'],['0-5','turret'],['0-6','tower'],['0-7','bastion'],['0-8','wall'],
    ['1-0','wall'],['1-1','wall'],['1-3','wall'],['1-5','wall'],['1-7','wall'],['1-8','wall'],['1-9','wall']
  ]);

  rowLengths.forEach((length, rowIndex) => {
    const row = document.createElement('div');
    row.className = `mini-row ${length === 9 ? 'short' : ''}`;
    for (let col = 0; col < length; col += 1) {
      const key = `${rowIndex}-${col}`;
      const cell = document.createElement('div');
      cell.className = 'mini-cell-v2';
      if (['4-4','4-5','5-4'].includes(key)) cell.classList.add('tactical');

      const white = whitePieces.get(key);
      const black = blackPieces.get(key);
      const type = white || black;
      if (type) {
        const img = document.createElement('img');
        img.alt = '';
        img.src = `assets/img/pieces/${white ? 'white' : 'black'}-${type}.svg`;
        cell.appendChild(img);
      }
      row.appendChild(cell);
    }
    grid.appendChild(row);
  });
})();

/* ================================================================
   Fortress V40 — UX completion pass
   Survey wizard, auth demo state, feedback, notifications, settings
   behavior and product-state previews based on the original site flow.
   ================================================================ */
(() => {
  'use strict';

  /* True four-step survey. Original questions are preserved. */
  const survey = document.querySelector('[data-survey-wizard]');
  if (survey) {
    document.querySelectorAll('.scale-js').forEach(scale => {
      const name = scale.dataset.scale;
      scale.innerHTML = [1,2,3,4,5].map(n => `<label><input type="radio" name="${name}" value="${n}" ${n===1?'required':''}><span>${n}</span></label>`).join('');
    });
    const steps=[...survey.querySelectorAll('[data-survey-step]')];
    const progress=[...document.querySelectorAll('[data-survey-jump]')];
    const back=survey.querySelector('[data-survey-back]');
    const next=survey.querySelector('[data-survey-next]');
    const submit=survey.querySelector('[data-survey-submit]');
    const status=survey.querySelector('[data-survey-status]');
    let index=0;

    const show = target => {
      index=Math.max(0,Math.min(steps.length-1,target));
      steps.forEach((step,i)=>step.classList.toggle('active',i===index));
      progress.forEach((button,i)=>{button.classList.toggle('active',i===index);button.classList.toggle('complete',i<index);});
      back.disabled=index===0;
      next.hidden=index===steps.length-1;
      submit.hidden=index!==steps.length-1;
      if(status) status.textContent=`Step ${index+1} of ${steps.length}`;
      survey.scrollIntoView({behavior:document.documentElement.classList.contains('reduced-motion')?'auto':'smooth',block:'start'});
    };
    const validateCurrent=()=>{
      const required=[...steps[index].querySelectorAll('[required]')];
      for(const field of required){
        if(field.type==='radio'){
          if(!steps[index].querySelector(`[name="${field.name}"]:checked`)){field.reportValidity();return false;}
        } else if(!field.checkValidity()){field.reportValidity();return false;}
      }
      return true;
    };
    next?.addEventListener('click',()=>{if(validateCurrent()) show(index+1);});
    back?.addEventListener('click',()=>show(index-1));
    progress.forEach((button,i)=>button.addEventListener('click',()=>{if(i<=index || validateCurrent()) show(i);}));
    survey.addEventListener('submit',event=>{
      event.preventDefault();
      if(!validateCurrent()) return;
      const data={};
      new FormData(survey).forEach((value,key)=>{if(data[key]) data[key]=[].concat(data[key],value); else data[key]=value;});
      localStorage.setItem('fortress-survey',JSON.stringify(data));
      window.fortressToast?.('Feedback saved locally — thank you');
      survey.classList.add('survey-complete');
      setTimeout(()=>show(0),700);
    });
    show(0);
  }

  /* Feedback page mirrors the production categories, stored locally. */
  const feedbackForm=document.querySelector('[data-feedback-form]');
  if(feedbackForm){
    const textarea=feedbackForm.querySelector('textarea');
    const count=feedbackForm.querySelector('[data-feedback-count]');
    const user=document.querySelector('[data-feedback-user]');
    let profile={}; try{profile=JSON.parse(localStorage.getItem('fortress-demo-account')||'{}')||{};}catch(_){}
    if(user) user.textContent=localStorage.getItem('fortress-auth')==='true'?(profile.name||'You'):'Guest';
    const sync=()=>{if(count) count.textContent=`${textarea.value.length} / 4000`;};
    textarea?.addEventListener('input',sync); sync();
    feedbackForm.addEventListener('submit',event=>{
      event.preventDefault(); if(!feedbackForm.reportValidity()) return;
      const payload=Object.fromEntries(new FormData(feedbackForm).entries());
      payload.page=location.pathname.split('/').pop()||'feedback.html'; payload.theme=document.documentElement.dataset.theme;
      localStorage.setItem('fortress-feedback-last',JSON.stringify(payload));
      window.fortressToast?.('Feedback saved locally — ready for API handoff');
      feedbackForm.reset(); sync();
    });
  }

  document.querySelector('[data-mark-read]')?.addEventListener('click',()=>{
    document.querySelectorAll('.notification-item').forEach(item=>item.classList.remove('unread'));
    localStorage.setItem('fortress-notifications-read','true');
    window.fortressToast?.('Notifications marked as read');
  });
  if(localStorage.getItem('fortress-notifications-read')==='true') document.querySelectorAll('.notification-item').forEach(item=>item.classList.remove('unread'));

  /* Login / signup create a coherent authenticated demo shell. */
  document.querySelector('body[data-page="login"] [data-demo-form]')?.addEventListener('submit',()=>{
    localStorage.setItem('fortress-auth','true');
    if(!localStorage.getItem('fortress-demo-account')) localStorage.setItem('fortress-demo-account',JSON.stringify({name:'You'}));
    setTimeout(()=>location.href='profile.html',450);
  });
  document.querySelector('body[data-page="signup"] [data-demo-form]')?.addEventListener('submit',event=>{
    const values=Object.fromEntries(new FormData(event.currentTarget).entries()); delete values.password;
    localStorage.setItem('fortress-auth','true'); localStorage.setItem('fortress-demo-account',JSON.stringify(values));
    setTimeout(()=>location.href='profile.html',450);
  });

  /* Settings now do something visible, not just persist. */
  const applySettings=()=>{
    document.documentElement.classList.toggle('reduced-motion',localStorage.getItem('fortress-setting-reduced-motion')==='true');
    document.body.classList.toggle('setting-no-combat-preview',localStorage.getItem('fortress-setting-combat-preview')==='false');
    document.body.classList.toggle('setting-no-legal-markers',localStorage.getItem('fortress-setting-legal-markers')==='false');
    document.body.classList.toggle('setting-no-support',localStorage.getItem('fortress-setting-support')==='false');
  };
  applySettings();
  document.querySelectorAll('.switch[data-setting]').forEach(toggle=>toggle.addEventListener('click',()=>setTimeout(applySettings,0)));

  /* Theme Lab distinguishes recommended defaults from the user's live choice. */
  const currentPairing=document.querySelector('[data-current-pairing]');
  const bgLabels={
    'gunmetal':'Brushed Gunmetal','slate':'Layered Slate','concrete':'Cast Concrete','iron':'Forged Iron',
    'carbon':'Carbon Fiber','obsidian':'Obsidian Glass','bronze':'Aged Bronze','alloy':'Machined Alloy',
    'etched':'Etched Plate','dark-steel':'Blackened Steel','walnut':'Black Walnut','oak':'Smoked Oak',
    'basalt':'Basalt Rock','sandstone':'Sandstone','earth':'Packed Earth','river-rock':'River Rock',
    'granite':'Granite','forest':'Forest Slate','clay':'Fired Clay','limestone':'Limestone'
  };
  const boardLabels={
    'slate':'Honed Slate','iron':'Forged Iron','charcoal':'Charcoal','concrete':'Cast Concrete',
    'alloy':'Machined Alloy','carbon':'Carbon Weave','obsidian':'Obsidian','bronze':'Aged Bronze',
    'copper':'Oxidised Copper','granite':'Granite','limestone':'Limestone','grass':'Moss Field',
    'wood':'Dark Oak','sandstone':'Sandstone','basalt':'Basalt','ice':'Frosted Stone',
    'quartz':'Quartz','marble':'Marble','clay':'Red Clay','moss':'Moss Stone'
  };
  const syncPairing=()=>{
    if(!currentPairing) return;
    const bg=localStorage.getItem('fortress-bg')||'gunmetal';
    const board=localStorage.getItem('fortress-board-theme')||'slate';
    currentPairing.textContent=`Current selection: ${bgLabels[bg]||pretty(bg)} + ${boardLabels[board]||pretty(board)}`;
  };
  syncPairing();
  document.querySelectorAll('[data-bg-choice],[data-board-choice]').forEach(item=>item.addEventListener('click',()=>setTimeout(syncPairing,0)));

  /* Watch includes the real product's empty-state behavior. */
  const emptyToggle=document.querySelector('[data-watch-empty-toggle]');
  const emptyState=document.querySelector('[data-watch-empty]');
  const matchList=document.querySelector('.match-list');
  const feature=document.querySelector('.watch-feature-card');
  if(new URLSearchParams(location.search).get('empty')==='1') setWatchEmpty(true);
  emptyToggle?.addEventListener('click',()=>setWatchEmpty(emptyState?.hidden !== false));
  function setWatchEmpty(on){
    if(!emptyState) return; emptyState.hidden=!on; if(matchList) matchList.hidden=on; if(feature) feature.hidden=on;
    if(emptyToggle) emptyToggle.textContent=on?'Show sample matches':'Preview empty state';
  }

  function pretty(value){return String(value).split('-').map(w=>w?`${w[0].toUpperCase()}${w.slice(1)}`:'').join(' ');}
})();
