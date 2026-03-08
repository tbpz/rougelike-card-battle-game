/* ══════════════════════════════════════════
   LOGIC ECHO — Game Logic
   Project: Logic Echo (MVP v0.2)
══════════════════════════════════════════ */

'use strict';

// ─────────────────────────────────────────
// 1. CARD CATALOG
// ─────────────────────────────────────────
const CARD_CATALOG = {
  strike: {
    id: 'strike',
    name: 'Strike',
    type: 'attack',
    glyph: '⚔️',
    effectText: 'Deal 6 damage.',
    quantity: 4,
    play(state) {
      const dmg = Math.floor(6 * (state.player.insightMultiplier));
      dealDamageToEnemy(state, dmg);
      log(`⚔️ <span class="log-damage">Strike → ${dmg} damage to the Golem.</span>`);
    },
  },
  defend: {
    id: 'defend',
    name: 'Defend',
    type: 'defend',
    glyph: '🛡️',
    effectText: 'Gain 6 Armor.',
    quantity: 4,
    play(state) {
      state.player.armor += 6;
      log(`🛡️ <span class="log-defend">Defend → +6 Armor. (Total: ${state.player.armor})</span>`);
      updatePlayerUI(state);
    },
  },
  bloodTrade: {
    id: 'bloodTrade',
    name: 'Blood Trade',
    type: 'blood',
    glyph: '💀',
    effectText: 'Deal 12 dmg. Lose 3 HP.',
    quantity: 2,
    play(state) {
      const dmg = Math.floor(12 * (state.player.insightMultiplier));
      dealDamageToEnemy(state, dmg);
      // True damage to self — ignores armor
      state.player.hp = Math.max(0, state.player.hp - 3);
      log(`💀 <span class="log-blood">Blood Trade → ${dmg} damage to Golem, -3 HP to you (true damage).</span>`);
      updatePlayerUI(state);
    },
  },
  insight: {
    id: 'insight',
    name: 'Insight',
    type: 'buff',
    glyph: '✨',
    effectText: 'Attack cards deal ×1.5 this turn.',
    quantity: 2,
    play(state) {
      state.player.insightMultiplier = 1.5;
      state.player.insightActive = true;
      log(`✨ <span class="log-buff">Insight → All attacks this turn deal ×1.5!</span>`);
      updatePlayerUI(state);
    },
  },
};

// ─────────────────────────────────────────
// 2. GAME STATE
// ─────────────────────────────────────────
let state = {};

function createInitialState() {
  return {
    turn: 1,
    phase: 'player',   // 'player' | 'enemy' | 'over'
    player: {
      maxHp: 30,
      hp: 30,
      armor: 0,
      insightActive: false,
      insightMultiplier: 1,
    },
    enemy: {
      maxHp: 50,
      hp: 50,
      turnIndex: 0,   // 0=Bash, 1=Shatter, 2=Recharge
      enraged: false,
    },
    deck: {
      drawPile: [],
      discardPile: [],
      hand: [],
    },
    cardsPlayedThisTurn: 0,
    selectedCards: [],   // indices into hand[]
  };
}

// ─────────────────────────────────────────
// 3. DECK MANAGEMENT
// ─────────────────────────────────────────
function buildDeck() {
  const deck = [];
  for (const [, card] of Object.entries(CARD_CATALOG)) {
    for (let i = 0; i < card.quantity; i++) {
      deck.push({ ...card });
    }
  }
  return deck;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function drawCards(state, n) {
  for (let i = 0; i < n; i++) {
    if (state.deck.drawPile.length === 0) {
      if (state.deck.discardPile.length === 0) break;
      state.deck.drawPile = shuffle(state.deck.discardPile);
      state.deck.discardPile = [];
      log(`<span class="log-system">↻ Draw pile empty — discard reshuffled.</span>`);
    }
    state.deck.hand.push(state.deck.drawPile.pop());
  }
}

function discardHand(state) {
  state.deck.discardPile.push(...state.deck.hand);
  state.deck.hand = [];
  state.selectedCards = [];
}

// ─────────────────────────────────────────
// 4. ENEMY AI
// ─────────────────────────────────────────
const INTENTS = {
  bash: { name: 'Bash', damage: 8, icon: '⚡', type: 'normal' },
  shatter: { name: 'Shatter', damage: 12, icon: '💥', type: 'normal' },
  recharge: { name: 'Recharge', damage: 0, icon: '⚙️', type: 'safe' },
  fatalStrike: { name: 'Fatal Strike', damage: 15, icon: '☠️', type: 'enrage' },
};

const INTENT_CYCLE = ['bash', 'shatter', 'recharge'];

function getIntent(state) {
  if (state.enemy.enraged) return INTENTS.fatalStrike;
  return INTENTS[INTENT_CYCLE[state.enemy.turnIndex % 3]];
}

function enemyAct(state) {
  const intent = getIntent(state);
  if (intent.damage > 0) {
    const blocked = Math.min(state.player.armor, intent.damage);
    const realDamage = intent.damage - blocked;
    state.player.armor = Math.max(0, state.player.armor - intent.damage);
    state.player.hp = Math.max(0, state.player.hp - realDamage);
    if (blocked > 0) {
      log(`<span class="log-enemy">💥 Golem uses ${intent.name} for ${intent.damage}. ${blocked} blocked → ${realDamage} damage.</span>`);
    } else {
      log(`<span class="log-enemy">💥 Golem uses ${intent.name} for ${intent.damage} damage!</span>`);
    }
  } else {
    log(`<span class="log-system">⚙️ Golem recharges. Nothing happens.</span>`);
  }
  if (!state.enemy.enraged) {
    state.enemy.turnIndex++;
  }
}

function checkEnrage(state) {
  if (!state.enemy.enraged && state.enemy.hp <= 15) {
    state.enemy.enraged = true;
    log(`<span class="log-blood">☠️ The Golem ENRAGES! Fatal Strike every turn!</span>`);
    document.getElementById('enemy-panel').classList.add('enraged');
    triggerShake();
  }
}

// ─────────────────────────────────────────
// 5. WIN / LOSE CHECKS
// ─────────────────────────────────────────
function checkWin(state) {
  return state.enemy.hp <= 0;
}
function checkLose(state) {
  return state.player.hp <= 0;
}

// ─────────────────────────────────────────
// 6. GAME LOOP
// ─────────────────────────────────────────
function startTurn(state) {
  state.phase = 'player';
  state.cardsPlayedThisTurn = 0;
  state.selectedCards = [];

  // Reset player turn-start state
  state.player.armor = 0;
  state.player.insightActive = false;
  state.player.insightMultiplier = 1;

  // Check enrage at start of player's turn (per PRD: "at the start of its turn")
  checkEnrage(state);

  // Draw 5 cards
  drawCards(state, 5);

  // Log turn header
  const intent = getIntent(state);
  logTurnHeader(state.turn, intent);

  // Keep End Turn disabled until 3 cards have been played
  document.getElementById('end-turn-btn').disabled = true;
  updatePlaySelectedBtn();

  updateAllUI(state);
}

function endTurn(state) {
  if (state.phase !== 'player') return;
  state.phase = 'enemy';

  // Discard remaining hand
  discardHand(state);
  state.selectedCards = [];

  // Check win before enemy acts (player may have killed golem)
  if (checkWin(state)) {
    endGame(state, true);
    return;
  }

  // Enemy acts
  setTimeout(() => {
    enemyAct(state);
    updateAllUI(state);

    if (checkLose(state)) {
      endGame(state, false);
      return;
    }

    // Next turn
    state.turn++;
    setTimeout(() => startTurn(state), 600);
  }, 500);
}

function endGame(state, playerWon) {
  state.phase = 'over';
  const overlay = document.getElementById('result-overlay');
  const icon = document.getElementById('result-icon');
  const title = document.getElementById('result-title');
  const msg = document.getElementById('result-message');

  overlay.classList.remove('hidden');
  if (playerWon) {
    icon.textContent = '🏆';
    title.textContent = 'Victory!';
    title.className = 'win';
    msg.textContent = `The Ancient Golem crumbles to dust. You survived ${state.turn} turns.`;
  } else {
    icon.textContent = '💀';
    title.textContent = 'Defeated.';
    title.className = 'lose';
    msg.textContent = `The Golem's power overwhelms you. The Vow remains unbroken. Try again.`;
  }
}

// ─────────────────────────────────────────
// 7. CARD PLAY LOGIC
// ─────────────────────────────────────────
function toggleCardSelection(handIndex) {
  if (state.phase !== 'player') return;
  if (state.cardsPlayedThisTurn >= 3) return;

  const idx = state.selectedCards.indexOf(handIndex);
  if (idx !== -1) {
    // Already selected → deselect
    state.selectedCards.splice(idx, 1);
  } else {
    // Not selected
    if (state.selectedCards.length >= 3) {
      // FIFO: drop the oldest selection to make room
      state.selectedCards.shift();
    }
    state.selectedCards.push(handIndex);
  }

  renderHand(state);
  updatePlaySelectedBtn();
}

function playSelectedCards() {
  if (state.selectedCards.length === 0) return;

  const toPlay = [...state.selectedCards].sort((a, b) => b - a); // reverse for splicing
  const played = toPlay.map(i => state.deck.hand[i]);

  // Apply effects in the ORDER the player selected them (reconstruction)
  const ordered = [...state.selectedCards].sort((a, b) => a - b).map(i => state.deck.hand[i]);

  // Remove from hand (reverse order to preserve indices)
  for (const i of toPlay) {
    state.deck.discardPile.push(state.deck.hand[i]);
    state.deck.hand.splice(i, 1);
  }

  state.selectedCards = [];
  state.cardsPlayedThisTurn += ordered.length;

  for (const card of ordered) {
    card.play(state);
    updateAllUI(state);

    if (checkWin(state)) {
      // Golem died during player turn
      setTimeout(() => endGame(state, true), 400);
      return;
    }
    if (checkLose(state)) {
      // Blood Trade self-kill edge case
      setTimeout(() => endGame(state, false), 400);
      return;
    }
  }

  renderHand(state);
  updateDeckUI(state);
  updatePlayCounter(state);
  updatePlaySelectedBtn();
  updateEndTurnBtn();
}

// ─────────────────────────────────────────
// 8. UI RENDERING
// ─────────────────────────────────────────
function renderHand(state) {
  const container = document.getElementById('hand-container');
  container.innerHTML = '';

  state.deck.hand.forEach((card, idx) => {
    const selOrder = state.selectedCards.indexOf(idx); // -1 if not selected
    const isSelected = selOrder !== -1;
    const isDisabled = !isSelected && state.cardsPlayedThisTurn >= 3;

    const el = document.createElement('div');
    el.className = `card ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`;
    el.dataset.type = card.type;
    el.style.animationDelay = `${idx * 60}ms`;
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', `${card.name}: ${card.effectText}`);
    el.title = card.effectText;

    const badgeHtml = isSelected
      ? `<div class="card-sel-badge">${selOrder + 1}</div>`
      : '';

    el.innerHTML = `
      ${badgeHtml}
      <div class="card-glyph">${card.glyph}</div>
      <div class="card-name">${card.name}</div>
      <div class="card-effect">${card.effectText}</div>
      <div class="card-type-bar"></div>
    `;

    if (!isDisabled) {
      el.addEventListener('click', () => toggleCardSelection(idx));
    }

    container.appendChild(el);
  });
}

function updatePlayerUI(state) {
  const p = state.player;
  const pct = Math.max(0, p.hp / p.maxHp * 100);

  document.getElementById('player-hp').textContent = p.hp;
  const bar = document.getElementById('player-hp-bar');
  bar.style.width = pct + '%';
  if (pct > 50) { bar.className = 'hp-bar'; }
  else if (pct > 25) { bar.className = 'hp-bar warn'; }
  else { bar.className = 'hp-bar danger'; }

  document.getElementById('player-armor').textContent = p.armor;
  const armorBadge = document.getElementById('player-armor-badge');
  armorBadge.style.opacity = p.armor > 0 ? '1' : '0.35';

  const insightBadge = document.getElementById('insight-badge');
  if (p.insightActive) {
    insightBadge.classList.remove('hidden');
  } else {
    insightBadge.classList.add('hidden');
  }
}

function updateEnemyUI(state) {
  const e = state.enemy;
  const pct = Math.max(0, e.hp / e.maxHp * 100);

  document.getElementById('enemy-hp').textContent = Math.max(0, e.hp);
  const bar = document.getElementById('enemy-hp-bar');
  bar.style.width = pct + '%';

  // Update intent display
  const intent = getIntent(state);
  document.getElementById('intent-icon').textContent = intent.icon;
  document.getElementById('intent-name').textContent = intent.name;
  const dmgEl = document.getElementById('intent-dmg');
  if (intent.damage > 0) {
    dmgEl.textContent = `${intent.damage} dmg`;
    dmgEl.className = 'intent-dmg' + (intent.type === 'enrage' ? ' enrage' : '');
  } else {
    dmgEl.textContent = '(no dmg)';
    dmgEl.className = 'intent-dmg safe';
  }
}

function updateDeckUI(state) {
  document.getElementById('draw-count').textContent = state.deck.drawPile.length;
  document.getElementById('discard-count').textContent = state.deck.discardPile.length;
}

function updatePlayCounter(state) {
  document.getElementById('played-count').textContent = state.cardsPlayedThisTurn;
}

function updateTurnCounter(state) {
  document.getElementById('turn-num').textContent = state.turn;
}

function updateAllUI(state) {
  updatePlayerUI(state);
  updateEnemyUI(state);
  updateDeckUI(state);
  updatePlayCounter(state);
  updateTurnCounter(state);
  renderHand(state);
  updatePlaySelectedBtn();
  updateEndTurnBtn();
}

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

// ─────────────────────────────────────────
// 9. LOGGING
// ─────────────────────────────────────────
let logEl;

function log(html) {
  if (!logEl) logEl = document.getElementById('turn-log');
  const entry = document.createElement('div');
  entry.className = 'log-entry';
  entry.innerHTML = html;
  logEl.appendChild(entry);
  logEl.scrollTop = logEl.scrollHeight;
}

function logTurnHeader(turn, intent) {
  const header = document.createElement('div');
  header.className = 'log-turn-header';
  header.innerHTML = `— Turn ${turn} — Golem intends: ${intent.icon} ${intent.name}${intent.damage > 0 ? ` (${intent.damage} dmg)` : ''} —`;
  logEl.appendChild(header);
  logEl.scrollTop = logEl.scrollHeight;
}

// ─────────────────────────────────────────
// 10. EFFECTS
// ─────────────────────────────────────────
function triggerShake() {
  const arena = document.getElementById('battle-arena');
  arena.classList.add('shake');
  arena.addEventListener('animationend', () => arena.classList.remove('shake'), { once: true });
}

function dealDamageToEnemy(state, dmg) {
  state.enemy.hp = Math.max(0, state.enemy.hp - dmg);
  const panel = document.getElementById('enemy-panel');
  panel.classList.add('flash-damage');
  panel.addEventListener('animationend', () => panel.classList.remove('flash-damage'), { once: true });
  updateEnemyUI(state);
}

// ─────────────────────────────────────────
// 11. BOOTSTRAP
// ─────────────────────────────────────────
function initGame() {
  logEl = document.getElementById('turn-log');
  logEl.innerHTML = '';

  state = createInitialState();
  state.deck.drawPile = shuffle(buildDeck());

  // Reset enemy enrage visual
  document.getElementById('enemy-panel').classList.remove('enraged');
  document.getElementById('result-overlay').classList.add('hidden');

  startTurn(state);
}

// ─────────────────────────────────────────
// 12. EVENT LISTENERS
// ─────────────────────────────────────────
document.getElementById('play-selected-btn').addEventListener('click', () => {
  if (state.phase !== 'player') return;
  if (state.selectedCards.length === 0) return;
  playSelectedCards();
});

document.getElementById('end-turn-btn').addEventListener('click', () => {
  if (state.phase !== 'player') return;
  if (state.cardsPlayedThisTurn < 3) return; // safety guard
  endTurn(state);
});

document.getElementById('start-btn').addEventListener('click', () => {
  document.getElementById('intro-overlay').classList.add('hidden');
  initGame();
});

document.getElementById('restart-btn').addEventListener('click', () => {
  initGame();
});
