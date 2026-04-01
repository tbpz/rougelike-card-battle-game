'use strict';

/* ══════════════════════════════════════════
   UI — Renderer
   All DOM rendering lives here. Functions receive
   state as a parameter and only READ from it — never mutate.
   Adding a new UI panel = add a new update function here.

   Also includes: showResultOverlay() (extracted from combatEngine)
   and processPendingEffects() (consumes state._pendingEffects).
══════════════════════════════════════════ */

// ─── Hand ──────────────────────────────────────────────
function renderHand(state) {
  const container = document.getElementById('hand-container');
  container.innerHTML = '';

  const stagedVP    = getStagedVPCost(state);
  const availableVP = state.vpRemaining - stagedVP;

  state.deck.hand.forEach((card, idx) => {
    const selOrder   = state.selectedCards.indexOf(idx);
    const isSelected = selOrder !== -1;
    const cardVP     = getCardVPCost(card);
    const isDisabled = !isSelected && cardVP > availableVP;

    const el = document.createElement('div');
    el.className = `card ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`;
    el.dataset.type = card.type;
    el.style.animationDelay = `${idx * 60}ms`;
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', `${card.name}: ${card.getEffectText()}`);
    el.title = card.getEffectText();

    const badgeHtml = isSelected
      ? `<div class="card-sel-badge">${selOrder + 1}</div>`
      : '';

    const vpClass = cardVP === 0 ? 'vp-free' : cardVP >= 2 ? 'vp-heavy' : 'vp-normal';
    const vpLabel = cardVP === 0 ? 'FREE' : `${cardVP} VP`;
    const vpBadgeHtml = `<div class="card-vp-badge ${vpClass}">${vpLabel}</div>`;

    el.innerHTML = `
      ${badgeHtml}
      ${vpBadgeHtml}
      <div class="card-glyph">${card.glyph}</div>
      <div class="card-name">${card.name}</div>
      <div class="card-effect">${card.getEffectText()}</div>
      <div class="card-type-bar"></div>
    `;

    if (!isDisabled) {
      el.addEventListener('click', () => toggleCardSelection(idx));
    }

    container.appendChild(el);
  });
}

// ─── Player Panel ──────────────────────────────────────
function updatePlayerUI(state) {
  const p   = state.player;
  const pct = Math.max(0, p.hp / p.maxHp * 100);

  document.getElementById('player-hp').textContent     = p.hp;
  document.getElementById('player-max-hp').textContent = p.maxHp;

  const bar = document.getElementById('player-hp-bar');
  bar.style.width = pct + '%';
  if (pct > 50)      { bar.className = 'hp-bar'; }
  else if (pct > 25) { bar.className = 'hp-bar warn'; }
  else               { bar.className = 'hp-bar danger'; }

  document.getElementById('player-armor').textContent = p.armor;
  const armorBadge = document.getElementById('player-armor-badge');
  armorBadge.style.opacity = p.armor > 0 ? '1' : '0.35';

  const insightBadge = document.getElementById('insight-badge');
  if (p.insightActive) {
    insightBadge.classList.remove('hidden');
  } else {
    insightBadge.classList.add('hidden');
  }

  const debtBadge = document.getElementById('blood-debt-badge');
  if (p.bloodDebt > 0) {
    document.getElementById('blood-debt-count').textContent = p.bloodDebt;
    debtBadge.classList.remove('hidden');
  } else {
    debtBadge.classList.add('hidden');
  }

  const smolderBadge = document.getElementById('smolder-badge');
  if (smolderBadge) {
    if ((p.smolderDamage || 0) > 0) {
      document.getElementById('smolder-count').textContent = p.smolderDamage;
      smolderBadge.classList.remove('hidden');
    } else {
      smolderBadge.classList.add('hidden');
    }
  }
}

// ─── Enemy Panel ───────────────────────────────────────
function updateEnemyUI(state) {
  const e   = state.enemy;
  const pct = Math.max(0, e.hp / e.maxHp * 100);

  document.getElementById('enemy-hp').textContent     = Math.max(0, e.hp);
  document.getElementById('enemy-max-hp').textContent = e.maxHp;
  document.getElementById('enemy-hp-bar').style.width = pct + '%';

  // Apply enrage class based on state flag (not directly from combatEngine)
  const enemyPanel = document.getElementById('enemy-panel');
  if (e.enraged) {
    enemyPanel.classList.add('enraged');
  }

  const intent = getIntentForDisplay(state);
  const dmgEl  = document.getElementById('intent-dmg');
  document.getElementById('intent-icon').textContent = intent.icon;
  document.getElementById('intent-name').textContent = intent.name;

  if (intent.type === 'attack') {
    const dmgVal = typeof intent.displayDamage === 'number' ? intent.displayDamage : '??';
    dmgEl.textContent = dmgVal > 0 ? `${dmgVal} dmg` : '(no dmg)';
    dmgEl.className   = 'intent-dmg' + (intent.id === 'fatalStrike' ? ' enrage' : '');
  } else if (intent.type === 'defend' || intent.type === 'buff') {
    dmgEl.textContent = '(buff)';
    dmgEl.className   = 'intent-dmg safe';
  } else if (intent.type === 'debuff') {
    dmgEl.textContent = '(debuff)';
    dmgEl.className   = 'intent-dmg';
  } else {
    dmgEl.textContent = '(no dmg)';
    dmgEl.className   = 'intent-dmg safe';
  }

  const enemyArmorBadge = document.getElementById('enemy-armor-badge');
  if (e.armor > 0) {
    document.getElementById('enemy-armor').textContent = e.armor;
    enemyArmorBadge.classList.remove('hidden');
  } else {
    enemyArmorBadge.classList.add('hidden');
  }
}

// ─── Deck / Counter Panels ─────────────────────────────
function updateDeckUI(state) {
  document.getElementById('draw-count').textContent    = state.deck.drawPile.length;
  document.getElementById('discard-count').textContent = state.deck.discardPile.length;
  document.getElementById('exhaust-count').textContent = state.deck.exhaustPile.length;
}

function updatePlayCounter(state) {
  const vpRemainingEl = document.getElementById('vp-remaining');
  const vpMaxEl       = document.getElementById('vp-max');
  if (vpRemainingEl) vpRemainingEl.textContent = state.vpRemaining !== undefined ? state.vpRemaining : 3;
  if (vpMaxEl)       vpMaxEl.textContent       = state.vpMax       !== undefined ? state.vpMax       : 3;
}

function updateTurnCounter(state) {
  document.getElementById('turn-num').textContent = state.turn;
}

function updateLevelCounter() {
  document.getElementById('level-num').textContent = RunState.levelIndex + 1;
}

// ─── Buttons ───────────────────────────────────────────
function updateEndTurnBtn() {
  const btn = document.getElementById('end-turn-btn');
  if (!btn) return;

  if (typeof state === 'undefined' || state.phase !== 'player') {
    btn.disabled = true;
    return;
  }

  const canPlayAny = state.deck.hand.some(c => getCardVPCost(c) <= state.vpRemaining);
  btn.disabled = state.vpRemaining > 0 && canPlayAny;
}

function updateBloodSurgeBtn(state) {
  const btn = document.getElementById('blood-surge-btn');
  if (!btn) return;

  if (!RunState.playerBoons.includes('bloodSurge')) {
    btn.classList.add('hidden');
    return;
  }
  btn.classList.remove('hidden');

  btn.disabled = (state.phase !== 'player') || (state.player && state.player.bloodSurgeUsedThisTurn);
}

function updatePlaySelectedBtn() {
  const btn = document.getElementById('play-selected-btn');
  if (!btn) return;
  const n = state.selectedCards.length;

  if (n === 0) {
    btn.classList.add('hidden');
    return;
  }

  const totalVPCost = getStagedVPCost(state);

  btn.classList.remove('hidden');
  btn.textContent = `Play ${n} Card${n !== 1 ? 's' : ''} (${totalVPCost} VP) ✓`;
}

// ─── Boons Sidebar ─────────────────────────────────────
function updateActiveBoonsUI() {
  const container = document.getElementById('active-boons-list');
  if (!container) return;
  container.innerHTML = '';
  RunState.playerBoons.forEach(bId => {
    const boon = BOONS_CATALOG[bId];
    const el   = document.createElement('span');
    el.className = 'active-boon-icon';
    if (RunState.consumedBoons.includes(bId)) {
      el.classList.add('consumed');
    }
    el.textContent = boon.glyph;
    el.title = `${boon.name}: ${boon.desc}`;
    container.appendChild(el);
  });
}

// ─── Visual Effects ────────────────────────────────────
function triggerShake() {
  const arena = document.getElementById('battle-arena');
  arena.classList.add('shake');
  arena.addEventListener('animationend', () => arena.classList.remove('shake'), { once: true });
}

/**
 * Consumes and executes all pending visual effects from state._pendingEffects[].
 * Called at the end of updateAllUI() so animations are applied after state settles.
 * This is the only place that reads _pendingEffects — keeps DOM animation
 * fully out of the engine layer.
 * @param {object} state
 */
function processPendingEffects(state) {
  if (!state._pendingEffects || state._pendingEffects.length === 0) return;

  for (const effect of state._pendingEffects) {
    if (effect.type === 'flash-enemy') {
      const panel = document.getElementById('enemy-panel');
      if (panel) {
        panel.classList.add('flash-damage');
        panel.addEventListener('animationend', () => panel.classList.remove('flash-damage'), { once: true });
      }
    }
    // Future effect types can be added here (e.g., 'flash-player', 'screen-shake', etc.)
  }

  state._pendingEffects = [];
}

// ─── Glossary / Terms ──────────────────────────────────
function showDeckGlossary(pileType) {
  const overlay = document.getElementById('glossary-overlay');
  const titleEl = document.getElementById('glossary-title');
  const descEl  = document.getElementById('glossary-desc');
  const listEl  = document.getElementById('glossary-card-list');

  let title = '';
  let desc  = '';
  let cards = [];

  if (pileType === 'drawPile') {
    title = 'Draw Pile';
    desc  = 'Cards you will draw in upcoming turns. When this is empty and you need to draw, the Discard Pile is shuffled and becomes the new Draw Pile.';
    cards = state.deck.drawPile;
  } else if (pileType === 'discardPile') {
    title = 'Discard Pile';
    desc  = 'Cards you have played or discarded this combat. They will be shuffled back into your Draw Pile when you run out of cards to draw.';
    cards = state.deck.discardPile;
  } else if (pileType === 'exhaustPile') {
    title = 'Exhaust Pile';
    desc  = 'Cards removed from play for the remainder of this combat. They will return to your deck after the battle.';
    cards = state.deck.exhaustPile;
  }

  titleEl.textContent = title;
  descEl.textContent  = desc;
  listEl.innerHTML    = '';

  if (cards.length === 0) {
    listEl.innerHTML = '<span style="color: var(--text-muted); font-style: italic;">(Empty)</span>';
  } else {
    cards.forEach((card) => {
      const el = document.createElement('div');
      el.className = 'card';
      el.dataset.type = card.type;
      el.style.pointerEvents = 'none';
      el.style.transform = 'scale(0.9)';
      el.style.margin = '-5px';

      el.innerHTML = `
        <div class="card-glyph">${card.glyph}</div>
        <div class="card-name">${card.name}</div>
        <div class="card-effect">${card.getEffectText()}</div>
        <div class="card-type-bar"></div>
      `;
      listEl.appendChild(el);
    });
  }

  overlay.classList.remove('hidden');
}

function hideDeckGlossary() {
  document.getElementById('glossary-overlay').classList.add('hidden');
}

// ─── Foresight Modal ───────────────────────────────────

/**
 * Shows a mini modal letting the player pick 1 of the peeked cards.
 * The chosen card goes into hand; the rest return to the top of the draw pile.
 * @param {object} state
 * @param {object[]} peekedCards - Array of card objects removed from drawPile
 */
function showForesightModal(state, peekedCards) {
  const overlay   = document.getElementById('foresight-overlay');
  const container = document.getElementById('foresight-options-container');
  container.innerHTML = '';

  peekedCards.forEach((card, idx) => {
    const el = document.createElement('div');
    el.className = 'card';
    el.dataset.type = card.type;
    el.style.transform = 'scale(1.05)';
    el.style.margin = '8px 12px';
    el.style.cursor = 'pointer';

    el.innerHTML = `
      <div class="card-glyph">${card.glyph}</div>
      <div class="card-name">${card.name}</div>
      <div class="card-effect">${card.getEffectText()}</div>
      <div class="card-type-bar"></div>
    `;

    el.onclick = () => {
      state.deck.hand.push(card);
      log(`🔮 <span class="log-buff">Foresight → Added [${card.name}] to your hand.</span>`);

      const remaining = peekedCards.filter((_, i) => i !== idx);
      for (const c of remaining) {
        state.deck.drawPile.push(c);
      }

      overlay.classList.add('hidden');
      renderHand(state);
      updateDeckUI(state);
      updatePlaySelectedBtn();
    };

    container.appendChild(el);
  });

  overlay.classList.remove('hidden');
}

// ─── Result Overlay (Extracted from combatEngine.js) ───

/**
 * Populates and shows the win/lose result overlay.
 * Called by combatEngine.endGame() — keeps all DOM work in the UI layer.
 * @param {object} state
 * @param {boolean} playerWon
 */
function showResultOverlay(state, playerWon) {
  const overlay = document.getElementById('result-overlay');
  const icon    = document.getElementById('result-icon');
  const title   = document.getElementById('result-title');
  const msg     = document.getElementById('result-message');
  const btn     = document.getElementById('restart-btn');

  overlay.classList.remove('hidden');

  if (playerWon) {
    icon.textContent = '🏆';
    if (RunState.levelIndex < LEVELS.length - 1) {
      title.textContent = 'Victory!';
      title.className   = 'win';
      msg.textContent   = `The Golem's form shatters, but it begins to reassemble into something stronger... You survived ${state.turn} turns.`;
      btn.textContent   = 'Next Level ›';
      btn.onclick = () => {
        // Heal 20% of max HP between levels
        RunState.playerHp = Math.min(RunState.playerMaxHp, state.player.hp + Math.floor(RunState.playerMaxHp * 0.2));
        RunState.levelIndex++;
        overlay.classList.add('hidden');
        if (typeof showDraftSelection === 'function') {
          showDraftSelection();
        } else {
          showBoonSelection();
        }
      };
    } else {
      title.textContent = 'True Victory!';
      title.className   = 'win true-win';
      msg.textContent   = `You have broken the Final Vow. The Ancient Golem is no more. You are absolute.`;
      btn.textContent   = 'Play Again (Reset level 1)';
      btn.onclick = () => {
        _resetRun();
        overlay.classList.add('hidden');
        showIntroOverlay();
      };
    }
  } else {
    icon.textContent  = '💀';
    title.textContent = 'Defeated.';
    title.className   = 'lose';
    msg.textContent   = `The Golem's power overwhelms you. The Vow remains unbroken.`;
    btn.textContent   = 'Play Again (Reset level 1)';
    btn.onclick = () => {
      _resetRun();
      overlay.classList.add('hidden');
      showIntroOverlay();
    };
  }
}

// ─── Composite Update ──────────────────────────────────
function updateAllUI(state) {
  updatePlayerUI(state);
  updateEnemyUI(state);
  updateDeckUI(state);
  updatePlayCounter(state);
  updateTurnCounter(state);
  updateLevelCounter();
  renderHand(state);
  updatePlaySelectedBtn();
  updateEndTurnBtn();
  updateBloodSurgeBtn(state);
  processPendingEffects(state);  // Flush any queued visual effects last
}
