/* Home-page board preview. Uses the same geometry, starting layout, piece assets
   and saved board material as play.html, but stays non-interactive. */
(() => {
  'use strict';
  /* V42: the approved Home hero board is a static visual source. Add the
     gameplay STR numbers as responsive DOM overlays so the hero keeps the
     exact approved board/piece placement while matching Play information. */
  const staticShell = document.querySelector('.home-board-static-shell');
  if (staticShell && !staticShell.querySelector('.home-strength-layer')) {
    const layer = document.createElement('div');
    layer.className = 'home-strength-layer';
    layer.setAttribute('aria-hidden','true');

    // Exact registration against assets/img/scenes/home-board-live.webp
    // (1140 x 875). These coordinates sit on the physical piece bodies,
    // not on the hex centres, so the STR badge reads as part of the piece.
    const topX = [22.54,30.26,37.98,45.70,53.42,61.14,68.77,76.49,84.21];
    const longX = [14.91,22.54,30.26,37.98,45.70,53.42,61.14,68.77,76.49,84.21];
    const major = [3,6,7,4,9,4,7,6,3];
    const wallCols = [0,1,3,5,7,8,9];

    const add = (x,y,value,side) => {
      const badge = document.createElement('span');
      badge.className = `home-strength ${side}`;
      badge.textContent = value;
      badge.style.left = `${x}%`;
      badge.style.top = `${y}%`;
      layer.appendChild(badge);
    };

    // Enemy major row + enemy walls.
    topX.forEach((x,i) => add(x,18.05,major[i],'enemy'));
    wallCols.forEach(i => add(longX[i],25.85,3,'enemy'));

    // White walls + white major row.
    wallCols.forEach(i => add(longX[i],73.45,3,'you'));
    topX.forEach((x,i) => add(x,81.55,major[i],'you'));

    staticShell.appendChild(layer);
  }

  const board = document.querySelector('[data-home-board-preview]');
  if (!board) return;

  const rowLengths = [9,10,9,10,9,10,9,10,9];
  const topTypes = ['wall','bastion','tower','turret','keep','turret','tower','bastion','wall'];
  const secondCols = new Set([0,1,3,5,7,8,9]);

  const savedTheme = localStorage.getItem('fortress-board-theme') || 'slate';
  [...board.classList].filter(n => n.startsWith('board-theme-')).forEach(n => board.classList.remove(n));
  board.classList.add(`board-theme-${savedTheme}`);

  rowLengths.forEach((length,rowIndex) => {
    const row = document.createElement('div');
    row.className = `hex-row ${length === 9 ? 'short-row' : 'long-row'}`;
    row.dataset.row = rowIndex;
    for (let col=0; col<length; col++) {
      const slot = document.createElement('div');
      slot.className = 'home-hex-slot';
      const cell = document.createElement('div');
      cell.className = `hex ${(rowIndex+col)%2===0 ? 'tone-a':'tone-b'}`;
      slot.appendChild(cell);
      const unit = pieceAt(rowIndex,col);
      if (unit) {
        slot.classList.add('occupied');
        slot.appendChild(renderPiece(unit.side,unit.type));
      }
      row.appendChild(slot);
    }
    board.appendChild(row);
  });

  // Tactical preview markers mirror the visual language of the actual game.
  const allCells = board.querySelectorAll('.hex');
  [39,40,49].forEach(i => allCells[i]?.classList.add('legal'));
  allCells[48]?.classList.add('selected');

  function pieceAt(row,col){
    if (row === 0) return {side:'enemy',type:topTypes[col]};
    if (row === 1 && secondCols.has(col)) return {side:'enemy',type:'wall'};
    if (row === 7 && secondCols.has(col)) return {side:'you',type:'wall'};
    if (row === 8) return {side:'you',type:topTypes[col]};
    return null;
  }

  function renderPiece(side,type){
    const el=document.createElement('div');
    el.className=`piece piece-v2 ${side} ${type}`;
    const color=side==='you'?'white':'black';
    const strengths={keep:9,tower:7,bastion:6,turret:4,wall:3};
    el.innerHTML=`<img src="assets/img/pieces/${color}-${type}.svg" alt="" draggable="false"><span class="piece-strength">${strengths[type]}</span>`;
    return el;
  }
})();

/* Home V4: live match cards + realistic mobile Play previews.
   These use the same 9/10-row, 85-cell board geometry and the same local
   Fortress piece assets as play.html. */
(() => {
  'use strict';
  const rowLengths = [9,10,9,10,9,10,9,10,9];
  const major = ['wall','bastion','tower','turret','keep','turret','tower','bastion','wall'];
  const supportCols = new Set([0,1,3,5,7,8,9]);

  document.querySelectorAll('[data-mini-game]').forEach((board, index) => {
    buildMiniBoard(board, {variant:index, phone:false});
  });
  document.querySelectorAll('[data-phone-board]').forEach((board, index) => {
    buildMiniBoard(board, {variant:index + 3, phone:true});
  });

  function buildMiniBoard(board, {variant=0, phone=false}={}) {
    board.innerHTML='';
    rowLengths.forEach((len,rowIndex) => {
      const row=document.createElement('div');
      row.className=`mini-game-row ${len===10?'long':'short'}`;
      for(let col=0; col<len; col++){
        const key=`${rowIndex}-${col}`;
        const cell=document.createElement('div');
        cell.className=`mini-game-cell ${(rowIndex+col)%2?'alt':''}`;
        const unit=unitAt(rowIndex,col,variant,phone);
        if(unit){
          cell.classList.add(unit.side);
          const img=document.createElement('img');
          img.src=`assets/img/pieces/${unit.side==='you'?'white':'black'}-${unit.type}.svg`;
          img.alt=''; img.draggable=false;
          cell.appendChild(img);
        }
        const state=stateAt(rowIndex,col,variant,phone);
        if(state) cell.classList.add(state);
        row.appendChild(cell);
      }
      board.appendChild(row);
    });
  }

  function unitAt(row,col,variant,phone){
    // Full starting formation, identical to Play.
    let unit=null;
    if(row===0) unit={side:'enemy',type:major[col]};
    if(row===1 && supportCols.has(col)) unit={side:'enemy',type:'wall'};
    if(row===7 && supportCols.has(col)) unit={side:'you',type:'wall'};
    if(row===8) unit={side:'you',type:major[col]};

    // Live match cards show believable mid-game positions without changing
    // the mobile Play previews, which intentionally mirror the Play board.
    if(!phone){
      const removeSets=[
        new Set(['0-1','0-7','1-1','1-8','7-1','8-7']),
        new Set(['0-2','1-0','1-9','7-7','8-1','8-6']),
        new Set(['0-3','0-5','1-3','7-0','7-9','8-5'])
      ];
      if(removeSets[variant%3].has(`${row}-${col}`)) unit=null;
      const mids=[
        {'4-4':{side:'you',type:'tower'},'3-5':{side:'enemy',type:'wall'},'5-4':{side:'you',type:'wall'}},
        {'4-4':{side:'you',type:'bastion'},'4-5':{side:'enemy',type:'turret'},'5-5':{side:'you',type:'wall'}},
        {'3-4':{side:'enemy',type:'tower'},'4-5':{side:'you',type:'turret'},'5-4':{side:'you',type:'wall'}}
      ];
      unit=mids[variant%3][`${row}-${col}`] || unit;
    }
    return unit;
  }

  function stateAt(row,col,variant,phone){
    const key=`${row}-${col}`;
    if(phone){
      if(key==='6-3') return 'selected';
      if(['5-3','5-4','6-2','6-4'].includes(key)) return 'legal';
      return '';
    }
    const states=[
      {selected:'4-4',legal:['3-4','4-3','5-4'],attack:['3-5']},
      {selected:'4-4',legal:['3-4','3-5','5-4'],attack:['4-5']},
      {selected:'4-5',legal:['3-5','5-4','5-5'],attack:['3-4']}
    ][variant%3];
    if(key===states.selected) return 'selected';
    if(states.attack.includes(key)) return 'attack';
    if(states.legal.includes(key)) return 'legal';
    return '';
  }
})();

/* Home V8 material previews: compact board surfaces with real pieces. */
(() => {
  'use strict';
  document.querySelectorAll('[data-material-board]').forEach((board) => {
    const light = board.dataset.materialBoard === 'light';
    const rows = [6,7,6];
    const pieces = {
      '0-2': light ? ['white','wall'] : ['black','bastion'],
      '1-3': light ? ['white','bastion'] : ['white','wall'],
      '2-3': light ? ['white','tower'] : ['black','tower']
    };
    rows.forEach((len,r) => {
      const row = document.createElement('div');
      row.className = 'material-mini-row';
      for (let c=0;c<len;c++) {
        const cell = document.createElement('div');
        cell.className = `material-mini-cell ${(r+c)%2 ? 'alt' : ''}`;
        if (`${r}-${c}` === '1-3') cell.classList.add('selected');
        const unit = pieces[`${r}-${c}`];
        if (unit) {
          const img = document.createElement('img');
          img.className = 'material-mini-piece';
          img.src = `assets/img/pieces/${unit[0]}-${unit[1]}.svg`;
          img.alt = '';
          img.draggable = false;
          cell.appendChild(img);
        }
        row.appendChild(cell);
      }
      board.appendChild(row);
    });
  });
})();
