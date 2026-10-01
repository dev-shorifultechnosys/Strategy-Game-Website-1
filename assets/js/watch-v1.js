
(() => {
  'use strict';
  if (document.body.dataset.page !== 'watch') return;

  const PIECES = {
    wt:'assets/img/pieces/white-tower.svg',
    ww:'assets/img/pieces/white-wall.svg',
    wk:'assets/img/pieces/white-keep.svg',
    wb:'assets/img/pieces/white-bastion.svg',
    bt:'assets/img/pieces/black-tower.svg',
    bw:'assets/img/pieces/black-wall.svg',
    bk:'assets/img/pieces/black-keep.svg',
    bb:'assets/img/pieces/black-bastion.svg'
  };
  const STR = {wt:7,ww:3,wk:9,wb:6,bt:7,bw:3,bk:9,bb:6};

  const configs = {
    featured:{legal:[39,40,48],selected:47,attack:[31],support:[46],white:[54,55,56,58,59,60,61,62,63,64],black:[0,1,2,3,4,5,6,7,8,9]},
    mason:{legal:[31,32],selected:40,attack:[23],support:[39],white:[45,46,47,49,50,51,52,53],black:[0,1,2,3,4,5,6,7]},
    hex:{legal:[38,39,40],selected:47,attack:[30,31],support:[46],white:[54,55,56,57,58,59,60,61,62],black:[0,1,2,3,4,5,6,7,8]},
    quiet:{legal:[37,38],selected:46,attack:[29],support:[45],white:[54,55,56,58,59,60,62,63],black:[0,1,2,3,4,5,7,8]}
  };

  function renderBoard(node){
    const cfg = configs[node.dataset.watchBoard] || configs.featured;
    const cells = 72;
    let index = 0;
    for(let r=0;r<8;r++){
      const row=document.createElement('div');
      row.className='watch-board-row '+(r%2?'short':'long');
      for(let c=0;c<9;c++,index++){
        const cell=document.createElement('span');
        cell.className='watch-cell '+(((r+c)%2)?'tone-b':'tone-a');
        if(cfg.legal.includes(index)) cell.classList.add('legal');
        if(cfg.selected===index) cell.classList.add('selected');
        if(cfg.attack.includes(index)) cell.classList.add('attack');
        if(cfg.support.includes(index)) cell.classList.add('support');

        let piece=null;
        if(cfg.white.includes(index)){
          const seq=['ww','ww','wb','wt','wk','wt','wb','ww','ww'];
          piece=seq[c%seq.length];
        } else if(cfg.black.includes(index)){
          const seq=['bw','bb','bt','bb','bk','bb','bt','bb','bw'];
          piece=seq[c%seq.length];
        }
        if(piece){
          const img=document.createElement('img');
          img.className='watch-piece';
          img.src=PIECES[piece];
          img.alt='';
          cell.appendChild(img);
          const strength=document.createElement('b');
          strength.className='watch-strength';
          strength.textContent=STR[piece];
          cell.appendChild(strength);
        }
        row.appendChild(cell);
      }
      node.appendChild(row);
    }
  }
  document.querySelectorAll('[data-watch-board]').forEach(renderBoard);

  // Spectator-specific right rail replaces the generic Quick Play rail on Watch only.
  const rail=document.querySelector('[data-right-rail]');
  if(rail) rail.innerHTML=`
    <div class="watch-rail-v1">
      <nav class="watch-rail-tabs" aria-label="Spectator sections">
        <a class="active" href="watch.html"><b>◉</b><span>Live</span></a>
        <a href="games.html"><b>☷</b><span>Finished</span></a>
        <a href="players.html"><b>♙</b><span>Players</span></a>
      </nav>
      <section class="card watch-rail-card">
        <div class="eyebrow">Live overview</div>
        <h3>4 matches live</h3>
        <p>Ranked and casual games currently available to spectate.</p>
        <div class="watch-rail-stat"><span><b>2</b><small>Ranked</small></span><span><b>2</b><small>Casual</small></span></div>
        <a class="btn btn-primary btn-block" href="#live-games">Browse live games</a>
      </section>
      <section class="card watch-rail-card">
        <div class="eyebrow">Following</div>
        <h3 data-follow-count>0 followed</h3>
        <p>Bookmark a match from the list and it will stay here for this demo session.</p>
      </section>
      <a class="watch-rail-link" href="play.html">
        <span><strong>Play instead</strong><small>Open the competitive board</small></span><b>›</b>
      </a>
      <a class="watch-rail-link" href="themes.html">
        <span><strong>Board materials</strong><small>Preview surfaces and themes</small></span><b>›</b>
      </a>
    </div>`;

  const section=document.querySelector('.watch-live-section');
  if(section) section.id='live-games';

  const filters=[...document.querySelectorAll('[data-watch-filter]')];
  const cards=[...document.querySelectorAll('[data-watch-card]')];
  const empty=document.querySelector('[data-watch-empty]');
  function applyFilter(mode){
    let visible=0;
    cards.forEach(card=>{
      const show=mode==='all'||card.dataset.mode===mode;
      card.hidden=!show;
      if(show) visible++;
    });
    if(empty) empty.hidden=visible>0;
    filters.forEach(btn=>btn.classList.toggle('active',btn.dataset.watchFilter===mode));
  }
  filters.forEach(btn=>btn.addEventListener('click',()=>applyFilter(btn.dataset.watchFilter)));
  document.querySelector('[data-watch-reset]')?.addEventListener('click',()=>applyFilter('all'));

  const followed=new Set(JSON.parse(localStorage.getItem('fortress-followed-matches')||'[]'));
  function syncFollows(){
    document.querySelectorAll('[data-follow-match]').forEach(btn=>{
      const active=followed.has(btn.dataset.followMatch);
      btn.classList.toggle('active',active);
      if(btn.classList.contains('watch-follow')) btn.textContent=active?'★':'☆';
      else btn.textContent=active?'Following':'Follow match';
    });
    const count=document.querySelector('[data-follow-count]');
    if(count) count.textContent=`${followed.size} followed`;
    localStorage.setItem('fortress-followed-matches',JSON.stringify([...followed]));
  }
  document.querySelectorAll('[data-follow-match]').forEach(btn=>btn.addEventListener('click',()=>{
    const name=btn.dataset.followMatch;
    followed.has(name)?followed.delete(name):followed.add(name);
    syncFollows();
    window.fortressToast?.(followed.has(name)?'Match added to your watch list':'Match removed from your watch list');
  }));
  syncFollows();
})();
