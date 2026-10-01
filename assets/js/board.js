/* ================================================================
   Fortress — Interactive Board
   ----------------------------------------------------------------
   This file creates an 85-hex board (9 / 10 alternating rows), renders
   real piece silhouettes instead of placeholder letters, and provides a
   complete local turn loop against a lightweight bot.

   Interaction layer for board selection, movement, support, combat preview and turn feedback.
   ================================================================ */

(() => {
  'use strict';

  const board = document.querySelector('[data-hex-board]');
  if (!board) return;

  const params = new URLSearchParams(window.location.search);
  const spectatorMode = params.get('spectate') === '1';
  const rowLengths = [9, 10, 9, 10, 9, 10, 9, 10, 9]; // 85 hexes total
  const cells = new Map();
  const pieceMap = new Map();
  const initialPieces = createInitialPieces();
  const botProfiles = {
    Aria: { rating: 800, badge: 'A' }, Maya: { rating: 1100, badge: 'M' },
    Nova: { rating: 1400, badge: 'N' }, Kai: { rating: 1700, badge: 'K' },
    Zen: { rating: 2000, badge: 'Z' }, Vex: { rating: 2300, badge: 'V' },
    Apex: { rating: 2450, badge: 'A' }
  };

  const settingOn = (name, defaultValue=true) => {
    const saved = localStorage.getItem(`fortress-setting-${name}`);
    return saved === null ? defaultValue : saved === 'true';
  };

  let selectedKey = null;
  let movesUsed = 0;
  let playerSnapshot = null;
  let activeSide = 'you';
  let turnNumber = 1;
  let overlaysVisible = true;
  let gameOver = false;
  let promotionPending = null;
  let youClock = 15 * 60;
  let enemyClock = 15 * 60;
  let botTimer = null;
  let spectatorTimer = null;

  const selectedBot = localStorage.getItem('fortress-bot') || 'Nova';
  const botProfile = botProfiles[selectedBot] || botProfiles.Nova;
  setText('[data-bot-name]', selectedBot);
  document.querySelector('.player-black')?.replaceChildren(document.createTextNode(botProfile.badge));
  const enemyMeta = document.querySelector('.player-block.right .player-meta');
  if (enemyMeta) enemyMeta.textContent = `${botProfile.rating} · Black`;

  buildBoard();
  resetPieces();
  applySavedTheme();
  updateAllUI();
  startClock();

  if (spectatorMode) {
    board.classList.add('spectator-board');
    setText('[data-live-label]', 'Spectating');
    setText('[data-turn-title]', 'Spectator mode');
    setText('[data-turn-subtitle]', 'Spectator view follows both sides');
    document.querySelector('.action-bar')?.classList.add('spectator-actions');
    logEvent('Spectator mode started. The preview will auto-play both sides.');
    scheduleSpectatorTurn();
  }

  /* --------------------------- Board setup --------------------------- */
  function buildBoard() {
    board.innerHTML = '';
    rowLengths.forEach((length, rowIndex) => {
      const row = document.createElement('div');
      row.className = `hex-row ${length === 9 ? 'short-row' : 'long-row'}`;
      row.dataset.row = rowIndex;

      for (let col = 0; col < length; col += 1) {
        const key = cellKey(rowIndex, col);
        const cell = document.createElement('button');
        cell.type = 'button';
        const tone = (rowIndex + col) % 2 === 0 ? 'tone-a' : 'tone-b';
        cell.className = `hex ${tone}`;
        cell.dataset.key = key;
        cell.setAttribute('aria-label', `Board hex row ${rowIndex + 1}, column ${col + 1}`);
        cell.addEventListener('click', () => handleCellClick(key));
        row.appendChild(cell);
        cells.set(key, cell);
      }
      board.appendChild(row);
    });
  }

  function createInitialPieces() {
    const map = new Map();
    const topTypes = ['wall', 'bastion', 'tower', 'turret', 'keep', 'turret', 'tower', 'bastion', 'wall'];
    const secondCols = [0, 1, 3, 5, 7, 8, 9];

    topTypes.forEach((type, col) => map.set(cellKey(0, col), piece('enemy', type)));
    secondCols.forEach(col => map.set(cellKey(1, col), piece('enemy', 'wall')));
    secondCols.forEach(col => map.set(cellKey(7, col), piece('you', 'wall')));
    topTypes.forEach((type, col) => map.set(cellKey(8, col), piece('you', type)));
    return map;
  }

  function piece(side, type) {
    const strengths = { keep: 9, tower: 7, bastion: 6, turret: 4, wall: 3 };
    return { side, type, strength: strengths[type] };
  }

  function resetPieces() {
    pieceMap.clear();
    initialPieces.forEach((value, key) => pieceMap.set(key, { ...value }));
    selectedKey = cellKey(7, 3);
    movesUsed = 0;
    playerSnapshot = null;
    activeSide = 'you';
    turnNumber = 1;
    gameOver = false;
    promotionPending = null;
    document.getElementById('promotionModal')?.classList.remove('open');
    youClock = 15 * 60;
    enemyClock = 15 * 60;
    refreshBoard();
    updateTacticalPreview(selectedKey);
  }

  /* --------------------------- Interaction --------------------------- */
  function handleCellClick(key) {
    if (gameOver || promotionPending || spectatorMode || activeSide !== 'you') return;

    const clickedPiece = pieceMap.get(key);

    if (selectedKey && legalMoves(selectedKey, 'you').includes(key)) {
      movePiece(selectedKey, key, 'you', true);
      return;
    }

    if (clickedPiece?.side === 'you') {
      selectedKey = key;
      refreshBoard();
      updateTacticalPreview(key);
      return;
    }

    selectedKey = null;
    refreshBoard();
    updatePanel('Select one of your white pieces. Enemy pieces can only be targeted from a legal adjacent hex.');
  }

  function movePiece(from, to, side, countMove) {
    if (gameOver) return false;
    const movingPiece = pieceMap.get(from);
    if (!movingPiece || movingPiece.side !== side) return false;

    if (side === 'you' && countMove && movesUsed >= 2) {
      window.fortressToast?.('Two moves are already used. Confirm the turn or undo.');
      return false;
    }

    const targetPiece = pieceMap.get(to);
    if (targetPiece?.side === side) return false;

    if (side === 'you' && countMove && !playerSnapshot) playerSnapshot = cloneMap(pieceMap);

    let capturedType = null;
    let mutualDestruction = false;
    if (targetPiece && targetPiece.side !== side) {
      const attacker = effectiveStrength(from, side);
      const defender = effectiveStrength(to, targetPiece.side);
      if (attacker < defender) {
        if (side === 'you') {
          logEvent(`Attack held: ${capitalize(movingPiece.type)} ${attacker} vs ${capitalize(targetPiece.type)} ${defender}.`);
          window.fortressToast?.('Attack cancelled — insufficient supported strength.');
        }
        return false;
      }
      capturedType = targetPiece.type;

      // Equal effective strength destroys both units. This makes the Learn-page
      // “mutual destruction” end state playable instead of decorative only.
      if (attacker === defender) {
        mutualDestruction = true;
        pieceMap.delete(from);
        pieceMap.delete(to);
        logEvent(`Mutual destruction: ${capitalize(movingPiece.type)} ${attacker} and ${capitalize(targetPiece.type)} ${defender} were removed.`);
      } else {
        pieceMap.delete(to);
        pieceMap.delete(from);
        pieceMap.set(to, movingPiece);
        logEvent(`${side === 'you' ? 'You' : selectedBot} captured a ${targetPiece.type} (${attacker} vs ${defender}).`);
      }
    } else {
      pieceMap.delete(from);
      pieceMap.set(to, movingPiece);
      logEvent(`${side === 'you' ? 'You' : selectedBot} moved ${capitalize(movingPiece.type)}.`);
    }

    if (side === 'you' && countMove) {
      movesUsed += 1;
      selectedKey = mutualDestruction ? null : to;
      window.fortressToast?.(`Move ${movesUsed} of 2 committed`);
      window.fortressSound?.();
    }

    refreshBoard();
    updateAllUI();
    if (side === 'you' && !mutualDestruction && pieceMap.has(to)) updateTacticalPreview(to);

    if (resolveKeepState()) return true;

    // Promotion is intentionally surfaced in the action flow, matching the Learn page.
    // In this prototype, Wall/Turret/Bastion units become eligible on the far rank.
    if (!mutualDestruction && pieceMap.has(to)) {
      if (side === 'you') maybeOfferPromotion(to, side);
      else autoPromoteIfEligible(to, side);
    }
    return true;
  }

  /* --------------------------- Hex geometry --------------------------- */
  function legalMoves(key, side) {
    return neighbors(key)
      .filter(next => cells.has(next))
      .filter(next => pieceMap.get(next)?.side !== side);
  }

  function neighbors(key) {
    const [row, col] = parseKey(key);
    const same = [[row, col - 1], [row, col + 1]];
    const vertical = row % 2 === 0
      ? [[row - 1, col], [row - 1, col + 1], [row + 1, col], [row + 1, col + 1]]
      : [[row - 1, col - 1], [row - 1, col], [row + 1, col - 1], [row + 1, col]];

    return [...same, ...vertical]
      .filter(([r, c]) => r >= 0 && r < rowLengths.length && c >= 0 && c < rowLengths[r])
      .map(([r, c]) => cellKey(r, c));
  }

  function adjacentSupport(key, side) {
    return neighbors(key).filter(next => pieceMap.get(next)?.side === side).length;
  }

  function effectiveStrength(key, side) {
    const unit = pieceMap.get(key);
    if (!unit) return 0;
    return unit.strength + adjacentSupport(key, side);
  }

  /* --------------------------- Render board --------------------------- */
  function refreshBoard() {
    cells.forEach((cell, key) => {
      cell.classList.remove('selected', 'legal', 'attack', 'support');
      cell.innerHTML = '';
      const unit = pieceMap.get(key);
      cell.classList.toggle('occupied', Boolean(unit));
      if (unit) {
        cell.appendChild(renderPiece(unit));
        cell.appendChild(renderStrengthBadge(unit.strength, unit.side));
      }
    });

    if (!selectedKey || !overlaysVisible || activeSide !== 'you' || spectatorMode) return;
    cells.get(selectedKey)?.classList.add('selected');

    if (settingOn('legal-markers', true)) {
      legalMoves(selectedKey, 'you').forEach(key => {
        const target = pieceMap.get(key);
        cells.get(key)?.classList.add(target?.side === 'enemy' ? 'attack' : 'legal');
      });
    }
    if (settingOn('support', true)) {
      neighbors(selectedKey).forEach(key => {
        if (pieceMap.get(key)?.side === 'you') cells.get(key)?.classList.add('support');
      });
    }
  }

  function renderPiece(unit) {
    const node = document.createElement('div');
    node.className = `piece piece-v2 ${unit.side} ${unit.type}`;
    const sideName = unit.side === 'you' ? 'white' : 'black';
    node.setAttribute('aria-label', `${capitalize(unit.type)}, strength ${unit.strength}`);
    node.innerHTML = `<img src="assets/img/pieces/${sideName}-${unit.type}.svg" alt="" draggable="false">`;
    return node;
  }

  function renderStrengthBadge(strength, side) {
    const badge = document.createElement('span');
    badge.className = `hex-strength ${side}`;
    badge.textContent = strength;
    badge.setAttribute('aria-hidden', 'true');
    return badge;
  }

  /* --------------------------- Tactical panel --------------------------- */
  function updateTacticalPreview(key) {
    const unit = pieceMap.get(key);
    if (!unit) return;
    const rawSupport = adjacentSupport(key, 'you');
    const support = settingOn('support', true) ? rawSupport : 0;
    const effective = unit.strength + rawSupport;
    const combatPreviewOn = settingOn('combat-preview', true);
    const neighborKeys = neighbors(key);
    const enemyKeys = neighborKeys.filter(next => pieceMap.get(next)?.side === 'enemy');
    const enemyKey = enemyKeys[0];
    const enemy = enemyKey ? pieceMap.get(enemyKey) : null;
    const enemyEffective = enemyKey ? effectiveStrength(enemyKey, 'enemy') : null;

    setText('[data-selected-unit]', `${capitalize(unit.type)} · STR ${unit.strength}`);
    setText('[data-support-count]', `+${support}`);
    setText('[data-effective-str]', combatPreviewOn ? effective : '—');
    setText('[data-legal-count]', legalMoves(key, 'you').length);
    setText('[data-contact-count]', enemyKeys.length);
    setText('[data-support-sources]', rawSupport);
    setText('[data-combat-copy]', combatPreviewOn
      ? (enemy ? `${capitalize(enemy.type)} nearby · ${effective >= enemyEffective ? 'favorable' : 'risky'} contact (${effective} vs ${enemyEffective})` : 'No immediate enemy contact. Highlighted hexes are legal destinations.')
      : 'Combat preview is disabled in Profile & settings.');

    const preview = document.querySelector('[data-piece-preview]');
    if (preview) preview.innerHTML = `<img src="assets/img/pieces/white-${unit.type}.svg" alt="Selected ${unit.type}"><span><strong>${capitalize(unit.type)}</strong><small>Base ${unit.strength} · Support +${support}</small></span>`;

    const meter = document.querySelector('[data-combat-meter]');
    if (meter) meter.style.width = `${Math.min(100, 28 + effective * 7)}%`;
  }

  function updatePanel(message) {
    setText('[data-combat-copy]', message);
    setText('[data-selected-unit]', 'No unit selected');
    setText('[data-support-count]', '+0');
    setText('[data-effective-str]', '—');
    setText('[data-legal-count]', '0');
    setText('[data-contact-count]', '0');
    setText('[data-support-sources]', '0');
    const preview = document.querySelector('[data-piece-preview]');
    if (preview) preview.innerHTML = '<span>Select a white piece</span>';
    const meter = document.querySelector('[data-combat-meter]');
    if (meter) meter.style.width = '28%';
  }

  function updateAllUI() {
    setText('[data-move-count]', `${movesUsed} / 2`);
    setText('[data-turn-number]', `Turn ${turnNumber}`);
    setText('[data-you-pieces]', countPieces('you'));
    setText('[data-enemy-pieces]', countPieces('enemy'));
    updateClockUI();

    if (!spectatorMode) {
      const yourTurn = activeSide === 'you';
      setText('[data-turn-title]', yourTurn ? 'Your turn' : `${selectedBot}'s turn`);
      const turnSubtitle = !yourTurn
        ? 'Opponent is calculating a response'
        : movesUsed === 0
          ? 'Choose up to two moves, then confirm'
          : movesUsed === 1
            ? 'One move remains — or confirm now'
            : 'Two moves ready — confirm your turn';
      setText('[data-turn-subtitle]', turnSubtitle);
      setText('[data-action-title]', yourTurn ? `Move ${Math.min(movesUsed + 1, 2)} of 2` : `${selectedBot} is moving`);
      setText('[data-action-status]', yourTurn
        ? (movesUsed === 0 ? 'Choose a highlighted hex.' : (movesUsed < 2 ? 'One move remains, or confirm the turn now.' : 'Two moves are ready. Confirm your turn.'))
        : 'Waiting for the opponent response…');
      document.querySelector('[data-confirm-turn]')?.toggleAttribute('disabled', !yourTurn || movesUsed === 0);
      document.querySelector('[data-undo-move]')?.toggleAttribute('disabled', !yourTurn || !playerSnapshot);
    }
  }

  /* --------------------------- Turn controls --------------------------- */
  document.querySelector('[data-undo-move]')?.addEventListener('click', () => {
    if (activeSide !== 'you' || spectatorMode) return;
    if (!playerSnapshot) {
      window.fortressToast?.('Nothing to undo yet.');
      return;
    }
    restoreMap(playerSnapshot);
    playerSnapshot = null;
    movesUsed = 0;
    selectedKey = cellKey(7, 3);
    refreshBoard();
    updateAllUI();
    updateTacticalPreview(selectedKey);
    logEvent('Your current turn was reset.');
  });

  document.querySelector('[data-toggle-overlays]')?.addEventListener('click', event => {
    overlaysVisible = !overlaysVisible;
    board.classList.toggle('hide-overlays', !overlaysVisible);
    event.currentTarget.classList.toggle('active', overlaysVisible);
    refreshBoard();
    window.fortressToast?.(`Tactical overlays ${overlaysVisible ? 'on' : 'off'}`);
  });

  document.querySelector('[data-confirm-turn]')?.addEventListener('click', () => {
    if (spectatorMode || activeSide !== 'you' || gameOver || promotionPending) return;
    if (movesUsed === 0) {
      window.fortressToast?.('Make at least one move before confirming.');
      return;
    }
    window.fortressSound?.();
    beginBotTurn();
  });

  document.querySelector('[data-restart-game]')?.addEventListener('click', () => {
    document.getElementById('gameOverModal')?.classList.remove('open');
    clearTimeout(botTimer);
    clearTimeout(spectatorTimer);
    resetPieces();
    updateAllUI();
    logEvent('New local match started.');
    if (spectatorMode) scheduleSpectatorTurn();
  });

  function beginBotTurn() {
    if (checkStalemate('enemy')) return;
    playerSnapshot = null;
    selectedKey = null;
    movesUsed = 0;
    activeSide = 'enemy';
    refreshBoard();
    updatePanel(`${selectedBot} is considering the position.`);
    updateAllUI();
    logEvent(`Turn ${turnNumber}: ${selectedBot} is responding.`);
    let botMoves = 0;

    const doMove = () => {
      if (gameOver) return;
      const moved = makeAutomatedMove('enemy');
      botMoves += moved ? 1 : 2;
      if (botMoves < 2 && moved) {
        botTimer = setTimeout(doMove, 620);
      } else {
        botTimer = setTimeout(endBotTurn, 520);
      }
    };
    botTimer = setTimeout(doMove, 650);
  }

  function endBotTurn() {
    if (gameOver) return;
    activeSide = 'you';
    turnNumber += 1;
    movesUsed = 0;
    selectedKey = null;
    refreshBoard();
    updatePanel('Your turn. Select a white piece to continue.');
    updateAllUI();
    logEvent(`Turn ${turnNumber}: your move.`);
    checkStalemate('you');
  }

  /* --------------------------- Match outcomes & promotion --------------------------- */
  document.querySelector('[data-resign-match]')?.addEventListener('click', () => {
    if (gameOver || spectatorMode) return;
    const confirmed = window.confirm('Resign this practice match?');
    if (!confirmed) return;
    finishGame('enemy', 'You resigned the match.');
  });

  document.querySelector('[data-offer-draw]')?.addEventListener('click', () => {
    if (gameOver || spectatorMode) return;
    logEvent('You offered a draw.');
    const difference = Math.abs(totalMaterial('you') - totalMaterial('enemy'));
    const accepted = turnNumber >= 4 && difference <= 3;
    if (accepted) {
      finishGame('draw', `${selectedBot} accepted the draw offer.`);
    } else {
      window.fortressToast?.(`${selectedBot} declined the draw offer.`);
      logEvent(`${selectedBot} declined the draw offer.`);
    }
  });

  document.querySelector('[data-skip-promotion]')?.addEventListener('click', () => completePromotion(null));
  document.querySelector('[data-promotion-options]')?.addEventListener('click', event => {
    const button = event.target.closest('[data-promote-to]');
    if (!button) return;
    completePromotion(button.dataset.promoteTo);
  });

  function promotionChoices(type) {
    if (type === 'wall') return ['turret', 'bastion', 'tower'];
    if (type === 'turret') return ['bastion', 'tower'];
    if (type === 'bastion') return ['tower'];
    return [];
  }

  function promotionEligible(key, side) {
    const unit = pieceMap.get(key);
    if (!unit || unit.side !== side) return false;
    const [row] = parseKey(key);
    const farRank = side === 'you' ? 0 : rowLengths.length - 1;
    return row === farRank && promotionChoices(unit.type).length > 0;
  }

  function maybeOfferPromotion(key, side) {
    if (!promotionEligible(key, side) || spectatorMode) return false;
    const unit = pieceMap.get(key);
    const choices = promotionChoices(unit.type);
    const wrap = document.querySelector('[data-promotion-options]');
    if (!wrap) return false;
    promotionPending = { key, side };
    wrap.innerHTML = choices.map(type => {
      const str = piece(side, type).strength;
      return `<button class="btn promotion-choice" type="button" data-promote-to="${type}"><strong>${capitalize(type)}</strong><span class="promo-str">STR ${str}</span><small>Promote from ${capitalize(unit.type)}</small></button>`;
    }).join('');
    document.getElementById('promotionModal')?.classList.add('open');
    logEvent(`${capitalize(unit.type)} reached the far rank — promotion available.`);
    return true;
  }

  function autoPromoteIfEligible(key, side) {
    if (!promotionEligible(key, side)) return false;
    const unit = pieceMap.get(key);
    const choices = promotionChoices(unit.type);
    const nextType = choices[choices.length - 1];
    if (!nextType) return false;
    pieceMap.set(key, piece(side, nextType));
    logEvent(`${selectedBot} promoted ${capitalize(unit.type)} to ${capitalize(nextType)}.`);
    refreshBoard();
    return true;
  }

  function completePromotion(nextType) {
    if (!promotionPending) return;
    const { key, side } = promotionPending;
    const unit = pieceMap.get(key);
    if (unit && nextType && promotionChoices(unit.type).includes(nextType)) {
      pieceMap.set(key, piece(side, nextType));
      logEvent(`You promoted ${capitalize(unit.type)} to ${capitalize(nextType)}.`);
      window.fortressToast?.(`${capitalize(nextType)} promoted`);
    } else if (unit) {
      logEvent(`${capitalize(unit.type)} remained in its current role.`);
    }
    promotionPending = null;
    document.getElementById('promotionModal')?.classList.remove('open');
    selectedKey = pieceMap.has(key) ? key : null;
    refreshBoard();
    updateAllUI();
    if (selectedKey) updateTacticalPreview(selectedKey);
  }

  function resolveKeepState() {
    const youKeep = [...pieceMap.values()].some(unit => unit.side === 'you' && unit.type === 'keep');
    const enemyKeep = [...pieceMap.values()].some(unit => unit.side === 'enemy' && unit.type === 'keep');
    if (!youKeep && !enemyKeep) {
      finishGame('draw', 'Both Keeps fell in the same combat — mutual destruction.');
      return true;
    }
    if (!enemyKeep) {
      finishGame('you', 'The opposing Keep was captured.');
      return true;
    }
    if (!youKeep) {
      finishGame('enemy', 'Your Keep was captured.');
      return true;
    }
    return false;
  }

  function hasAnyLegalAction(side) {
    const opponent = side === 'enemy' ? 'you' : 'enemy';
    for (const [from, unit] of pieceMap.entries()) {
      if (unit.side !== side) continue;
      for (const to of legalMoves(from, side)) {
        const target = pieceMap.get(to);
        if (!target || effectiveStrength(from, side) >= effectiveStrength(to, opponent)) return true;
      }
    }
    return false;
  }

  function checkStalemate(side) {
    if (gameOver || hasAnyLegalAction(side)) return false;
    finishGame('draw', `${side === 'you' ? 'White' : 'Black'} has no legal move — stalemate.`);
    return true;
  }

  function totalMaterial(side) {
    let total = 0;
    pieceMap.forEach(unit => { if (unit.side === side) total += unit.strength; });
    return total;
  }

  /* --------------------------- Lightweight bot --------------------------- */
  function makeAutomatedMove(side) {
    const opponent = side === 'enemy' ? 'you' : 'enemy';
    const candidates = [];
    pieceMap.forEach((unit, from) => {
      if (unit.side !== side) return;
      legalMoves(from, side).forEach(to => {
        const target = pieceMap.get(to);
        const attackPossible = !target || effectiveStrength(from, side) >= effectiveStrength(to, opponent);
        if (!attackPossible) return;
        let score = Math.random() * 3;
        if (target) score += target.type === 'keep' ? 1000 : 80 + target.strength * 5;
        score += positionalScore(from, to, side);
        candidates.push({ from, to, score });
      });
    });

    candidates.sort((a, b) => b.score - a.score);
    const move = candidates[0];
    if (!move) return false;
    return movePiece(move.from, move.to, side, false);
  }

  function positionalScore(from, to, side) {
    const [fromRow, fromCol] = parseKey(from);
    const [toRow, toCol] = parseKey(to);
    const goalRow = side === 'enemy' ? 8 : 0;
    const rowProgress = Math.abs(fromRow - goalRow) - Math.abs(toRow - goalRow);
    const centre = 4.5;
    const centreGain = Math.abs(fromCol - centre) - Math.abs(toCol - centre);
    return rowProgress * 7 + centreGain * 1.2;
  }

  /* --------------------------- Spectator demo --------------------------- */
  function scheduleSpectatorTurn() {
    if (!spectatorMode || gameOver) return;
    spectatorTimer = setTimeout(() => {
      makeAutomatedMove(activeSide);
      spectatorTimer = setTimeout(() => {
        makeAutomatedMove(activeSide);
        activeSide = activeSide === 'you' ? 'enemy' : 'you';
        if (activeSide === 'you') turnNumber += 1;
        updateAllUI();
        setText('[data-turn-title]', activeSide === 'you' ? 'White to move' : 'Black to move');
        setText('[data-turn-subtitle]', `Auto-playing local spectator demo · Turn ${turnNumber}`);
        scheduleSpectatorTurn();
      }, 560);
    }, 900);
  }

  /* --------------------------- Timer --------------------------- */
  function startClock() {
    window.setInterval(() => {
      if (gameOver) return;
      if (activeSide === 'you') youClock = Math.max(0, youClock - 1);
      else enemyClock = Math.max(0, enemyClock - 1);
      updateClockUI();
      if (youClock === 0) finishGame('enemy', 'Your clock expired.');
      if (enemyClock === 0) finishGame('you', `${selectedBot}'s clock expired.`);
    }, 1000);
  }

  function updateClockUI() {
    setText('[data-you-clock]', formatClock(youClock));
    setText('[data-enemy-clock]', formatClock(enemyClock));
    const youBar = document.querySelector('[data-you-clock-bar]');
    const enemyBar = document.querySelector('[data-enemy-clock-bar]');
    if (youBar) youBar.style.width = `${(youClock / 900) * 100}%`;
    if (enemyBar) enemyBar.style.width = `${(enemyClock / 900) * 100}%`;
  }

  /* --------------------------- Game result --------------------------- */
  function finishGame(winner, reason) {
    if (gameOver) return;
    gameOver = true;
    clearTimeout(botTimer);
    clearTimeout(spectatorTimer);
    selectedKey = null;
    refreshBoard();
    setText('[data-result-title]', winner === 'draw' ? 'Draw' : (winner === 'you' ? 'Victory' : 'Defeat'));
    setText('[data-result-copy]', reason);
    document.getElementById('gameOverModal')?.classList.add('open');
    logEvent(`Match complete — ${winner === 'draw' ? 'draw' : (winner === 'you' ? 'you win' : `${selectedBot} wins`)}.`);
  }

  /* --------------------------- Theme selector --------------------------- */
  document.querySelector('[data-board-theme]')?.addEventListener('change', event => {
    applyBoardTheme(event.target.value);
    localStorage.setItem('fortress-board-theme', event.target.value);
  });

  function applySavedTheme() {
    const saved = localStorage.getItem('fortress-board-theme') || 'slate';
    applyBoardTheme(saved);
    const select = document.querySelector('[data-board-theme]');
    if (select) select.value = [...select.options].some(option => option.value === saved) ? saved : 'slate';
  }

  function applyBoardTheme(value) {
    [...board.classList]
      .filter(name => name.startsWith('board-theme-'))
      .forEach(name => board.classList.remove(name));

    board.classList.add(`board-theme-${value}`);
    board.dataset.activeTheme = value;
    const themeNames = {slate:'Honed Slate',iron:'Forged Iron',charcoal:'Charcoal',concrete:'Cast Concrete',alloy:'Machined Alloy',carbon:'Carbon Fiber',obsidian:'Obsidian Glass',bronze:'Aged Bronze',copper:'Oxidised Copper',granite:'Granite',limestone:'Limestone',grass:'Forest Moss',wood:'Dark Oak',sandstone:'Sandstone',basalt:'Basalt',ice:'Frosted Stone',quartz:'Quartz',marble:'Marble',clay:'Red Clay',moss:'Moss Stone'};
    setText('[data-board-material-label]', themeNames[value] || 'Honed Slate');

    // Keep the control and stored value synchronized even when the theme
    // was changed on Theme Lab/Profile before opening the Play page.
    const select = document.querySelector('[data-board-theme]');
    if (select && select.value !== value &&
        [...select.options].some(option => option.value === value)) {
      select.value = value;
    }
  }

  /* --------------------------- Helpers --------------------------- */
  function countPieces(side) {
    let count = 0;
    pieceMap.forEach(unit => { if (unit.side === side) count += 1; });
    return count;
  }

  function cloneMap(source) {
    const next = new Map();
    source.forEach((value, key) => next.set(key, { ...value }));
    return next;
  }

  function restoreMap(source) {
    pieceMap.clear();
    source.forEach((value, key) => pieceMap.set(key, { ...value }));
  }

  function logEvent(message) {
    const log = document.querySelector('[data-game-log]');
    if (!log) return;
    const item = document.createElement('div');
    item.className = 'log-item';
    const stamp = document.createElement('time');
    const eventClock = activeSide === 'you' ? youClock : enemyClock;
    stamp.textContent = formatClock(eventClock);
    stamp.dateTime = `PT${Math.max(0, 900 - eventClock)}S`;
    const copy = document.createElement('span');
    copy.textContent = message;
    item.append(stamp, copy);
    log.prepend(item);
    while (log.children.length > 9) log.lastElementChild.remove();
  }

  function cellKey(row, col) { return `${row}-${col}`; }
  function parseKey(key) { return key.split('-').map(Number); }
  function capitalize(value) { return value[0].toUpperCase() + value.slice(1); }
  function formatClock(seconds) { return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`; }
  function setText(selector, value) { const node = document.querySelector(selector); if (node) node.textContent = value; }
})();
