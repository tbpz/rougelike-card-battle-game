'use strict';

/* ══════════════════════════════════════════
   UI — Renderer
   All DOM rendering lives here. Functions receive
   state as a parameter and only READ from it — never mutate.
   Adding a new UI panel = add a new update function here.
══════════════════════════════════════════ */

// ─── Hand ──────────────────────────────────────────────
function renderHand(state) {
  const container = document.getElementById('hand-container');
  container.innerHTML = '';

  state.deck.hand.forEach((card, idx) => {
    const selOrder   = state.selectedCards.indexOf(idx); // -1 if not selected
    const isSelected = selOrder !== -1;
    const isDisabled = !isSelected && state.cardsPlayedThisTurn >= 3;

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

    el.innerHTML = `
      ${badgeHtml}
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
}

// ─── Enemy Panel ───────────────────────────────────────
function updateEnemyUI(state) {
  const e   = state.enemy;
  const pct = Math.max(0, e.hp / e.maxHp * 100);

  document.getElementById('enemy-hp').textContent     = Math.max(0, e.hp);
  document.getElementById('enemy-max-hp').textContent = e.maxHp;
  document.getElementById('enemy-hp-bar').style.width = pct + '%';

  const intent      = getIntent(state);
  const dmgEl       = document.getElementById('intent-dmg');
  document.getElementById('intent-icon').textContent = intent.icon;
  document.getElementById('intent-name').textContent = intent.name;
  if (intent.damage > 0) {
    dmgEl.textContent = `${intent.damage} dmg`;
    dmgEl.className   = 'intent-dmg' + (intent.type === 'enrage' ? ' enrage' : '');
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
  document.getElementById('played-count').textContent = state.cardsPlayedThisTurn;
}

function updateTurnCounter(state) {
  document.getElementById('turn-num').textContent = state.turn;
}

function updateLevelCounter() {
  document.getElementById('level-num').textContent = globalLevelIndex + 1;
}

// ─── Buttons ───────────────────────────────────────────
function updateEndTurnBtn() {
  const btn = document.getElementById('end-turn-btn');
  if (!btn) return;
  btn.disabled = state.cardsPlayedThisTurn < 3;
}

function updatePlaySelectedBtn() {
  const btn = document.getElementById('play-selected-btn');
  if (!btn) return;
  const n = state.selectedCards.length;
  if (n === 0 || state.cardsPlayedThisTurn >= 3) {
    btn.classList.add('hidden');
  } else {
    btn.classList.remove('hidden');
    btn.textContent = `Play ${n} Card${n > 1 ? 's' : ''} ✓`;
  }
}

// ─── Boons Sidebar ─────────────────────────────────────
function updateActiveBoonsUI() {
  const container = document.getElementById('active-boons-list');
  if (!container) return;
  container.innerHTML = '';
  globalPlayerBoons.forEach(bId => {
    const boon = BOONS_CATALOG[bId];
    const el   = document.createElement('span');
    el.className = 'active-boon-icon';
    if (globalConsumedBoons.includes(bId)) {
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

// ─── Glossary / Terms ──────────────────────────────────
function showDeckGlossary(pileType) {
  const overlay = document.getElementById('glossary-overlay');
  const titleEl = document.getElementById('glossary-title');
  const descEl = document.getElementById('glossary-desc');
  const listEl = document.getElementById('glossary-card-list');
  
  let title = '';
  let desc = '';
  let cards = [];

  if (pileType === 'drawPile') {
    title = 'Draw Pile';
    desc = 'Cards you will draw in upcoming turns. When this is empty and you need to draw, the Discard Pile is shuffled and becomes the new Draw Pile.';
    cards = state.deck.drawPile;
  } else if (pileType === 'discardPile') {
    title = 'Discard Pile';
    desc = 'Cards you have played or discarded this combat. They will be shuffled back into your Draw Pile when you run out of cards to draw.';
    cards = state.deck.discardPile;
  } else if (pileType === 'exhaustPile') {
    title = 'Exhaust Pile';
    desc = 'Cards removed from play for the remainder of this combat. They will return to your deck after the battle.';
    cards = state.deck.exhaustPile;
  }

  titleEl.textContent = title;
  descEl.textContent = desc;
  listEl.innerHTML = '';

  if (cards.length === 0) {
    listEl.innerHTML = '<span style="color: var(--text-muted); font-style: italic;">(Empty)</span>';
  } else {
    cards.forEach((card, idx) => {
      const el = document.createElement('div');
      el.className = 'card';
      el.dataset.type = card.type;
      // Glossary cards shouldn't be playable or have hover animations ideally, but reusing .card is easiest.
      // We can add inline styles to disable pointer events.
      el.style.pointerEvents = 'none';
      el.style.transform = 'scale(0.9)';
      el.style.margin = '-5px'; // Adjust for scale

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
  const overlay = document.getElementById('glossary-overlay');
  overlay.classList.add('hidden');
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
}
