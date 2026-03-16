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
    getEffectText: () => {
      let dmg = 6;
      if (typeof state !== 'undefined' && state.player && globalPlayerBoons.includes('bloodlust') && state.player.hp <= (state.player.maxHp * 0.5)) {
        dmg += 3;
      }
      return `Deal ${dmg} damage.`;
    },
    quantity: 4,
    play(state) {
      let extraMult = 1;
      if (globalPlayerBoons.includes('momentum') && state.cardsPlayedThisTurn === 3) {
        extraMult = 1.5;
        log(`<span class="log-buff">⚡ Momentum activates! (×1.5 dmg)</span>`);
      }
      const isBloodlust = globalPlayerBoons.includes('bloodlust') && (state.player.hp <= state.player.maxHp * 0.5);
      const extraBase = isBloodlust ? 3 : 0;
      const dmg = Math.floor((6 + extraBase) * state.player.insightMultiplier * extraMult);
      dealDamageToEnemy(state, dmg);
      log(`⚔️ <span class="log-damage">Strike → ${dmg} damage to the Golem.</span>`);
    },
  },
  defend: {
    id: 'defend',
    name: 'Defend',
    type: 'defend',
    glyph: '🛡️',
    getEffectText: () => {
      const armor = globalPlayerBoons.includes('fortress') ? 8 : 6;
      let text = `Gain ${armor} Armor.`;
      if (globalPlayerBoons.includes('spikedArmor')) {
        text += '<br>Deal 3 damage.';
      }
      return text;
    },
    quantity: 4,
    play(state) {
      const isFortress = globalPlayerBoons.includes('fortress');
      const armorGain = isFortress ? 8 : 6;
      state.player.armor += armorGain;
      log(`🛡️ <span class="log-defend">Defend → +${armorGain} Armor. (Total: ${state.player.armor})</span>`);
      if (globalPlayerBoons.includes('spikedArmor')) {
        dealDamageToEnemy(state, 3);
        log(`🛡️ <span class="log-damage">Spiked Armor → 3 damage to Golem.</span>`);
      }
      updatePlayerUI(state);
    },
  },
  bloodTrade: {
    id: 'bloodTrade',
    name: 'Blood Trade',
    type: 'blood',
    glyph: '💀',
    getEffectText: () => {
      const dmg = globalPlayerBoons.includes('hemorrhage') ? 16 : 12;
      const hpLoss = globalPlayerBoons.includes('thickBlood') ? 1 : 3;
      return `Deal ${dmg} dmg. Lose ${hpLoss} HP.`;
    },
    quantity: 2,
    play(state) {
      let extraMult = 1;
      if (globalPlayerBoons.includes('momentum') && state.cardsPlayedThisTurn === 3) {
        extraMult = 1.5;
        log(`<span class="log-buff">⚡ Momentum activates! (×1.5 dmg)</span>`);
      }
      const extraBase = globalPlayerBoons.includes('hemorrhage') ? 4 : 0;
      const dmg = Math.floor((12 + extraBase) * state.player.insightMultiplier * extraMult);
      dealDamageToEnemy(state, dmg);
      
      const recoil = globalPlayerBoons.includes('thickBlood') ? 1 : 3;
      state.player.hp = Math.max(0, state.player.hp - recoil);
      log(`💀 <span class="log-blood">Blood Trade → ${dmg} damage to Golem, -${recoil} HP to you (true damage).</span>`);
      if (recoil > 0 && globalPlayerBoons.includes('warTax')) {
        dealDamageToEnemy(state, 2);
        log(`⚖️ <span class="log-damage">War Tax → 2 damage returned to Golem!</span>`);
      }
      applyLastRitesIfNeeded(state);
      updatePlayerUI(state);
    },
  },
  insight: {
    id: 'insight',
    name: 'Insight',
    type: 'buff',
    glyph: '✨',
    getEffectText: () => globalPlayerBoons.includes('enduringInsight') ? 'Attack cards deal ×1.5 for 2 turns.' : 'Attack cards deal ×1.5 this turn.',
    quantity: 2,
    play(state) {
      state.player.insightMultiplier *= 1.5;
      state.player.insightActiveDuration = globalPlayerBoons.includes('enduringInsight') ? 2 : 1;
      state.player.insightActive = true;
      if (globalPlayerBoons.includes('enduringInsight')) {
        log(`✨ <span class="log-buff">Enduring Insight → Attacks deal ×1.5 this turn AND next turn! (Mult: ${state.player.insightMultiplier.toFixed(2)})</span>`);
      } else {
        log(`✨ <span class="log-buff">Insight → All attacks this turn deal ×1.5! (Mult: ${state.player.insightMultiplier.toFixed(2)})</span>`);
      }
      updatePlayerUI(state);
    },
  },
};

// ─────────────────────────────────────────
// 2. LEVEL CONFIGURATIONS
// ─────────────────────────────────────────
const LEVELS = [
  {
    title: 'Level 1: The Awakening',
    flavor: 'The Golem is dormant. Learn the Vow without pressure.',
    rules: [
      '🛡️ Extra Defends in deck',
      '📉 Enemy deals reduced damage',
      '⏱️ Safe "Recharge" turn every 3rd turn',
      '💤 Enrages at 10 HP'
    ],
    playerHp: 35, enemyHp: 35,
    cycle: ['bash', 'shatter', 'recharge'],
    bashDmg: 5, shatterDmg: 8, enrageAt: 10, fatalDmg: 10,
    deck: { strike: 4, defend: 5, bloodTrade: 2, insight: 2 }
  },
  {
    title: 'Level 2: Calibrated Pressure',
    flavor: 'The original Vow. Block carefully or be broken.',
    rules: [
      '⚖️ Standard 3/5 Vow deck ratios',
      '💥 Shatter requires 2 Defends to block fully',
      '⏱️ Safe "Recharge" turn every 3rd turn',
      '⚡ Enrages at 15 HP'
    ],
    playerHp: 30, enemyHp: 50,
    cycle: ['bash', 'shatter', 'recharge'],
    bashDmg: 8, shatterDmg: 12, enrageAt: 15, fatalDmg: 15,
    deck: { strike: 4, defend: 4, bloodTrade: 2, insight: 2 }
  },
  {
    title: 'Level 3: The Relentless',
    flavor: 'The Golem abandons rest. You must find your own openings.',
    rules: [
      '🚫 No "Recharge" turn (Bash → Shatter → Bash)',
      '🩸 1 fewer Blood Trade in deck',
      '⚠️ Enrages earlier (at 20 HP)'
    ],
    playerHp: 28, enemyHp: 55,
    cycle: ['bash', 'shatter', 'bash'],
    bashDmg: 9, shatterDmg: 14, enrageAt: 20, fatalDmg: 16,
    deck: { strike: 4, defend: 4, bloodTrade: 1, insight: 2 }
  },
  {
    title: 'Level 4: Iron Vow',
    flavor: 'The deck floods with blood. Pain is your only fuel.',
    rules: [
      '💀 Deck replaced: Heavy Blood Trade (+3 self-damage)',
      '🗡️ Start at only 25 Max HP',
      '🔥 Enrages very early (at 25 HP)'
    ],
    playerHp: 25, enemyHp: 60,
    cycle: ['bash', 'shatter', 'bash'],
    bashDmg: 10, shatterDmg: 15, enrageAt: 25, fatalDmg: 18,
    deck: { strike: 3, defend: 3, bloodTrade: 3, insight: 2 }
  },
  {
    title: 'Level 5: The Final Vow',
    flavor: 'The absolute limit of the Vow. One mistake is fatal.',
    rules: [
      '✨ Volatile Deck: 4 Insights, only 2 Defends',
      '💔 Start at bare minimum 22 Max HP',
      '☠️ Enrages at 30 HP (over half health!)',
      '🏴‍☠️ Fatal Strike deals 20 damage'
    ],
    playerHp: 22, enemyHp: 65,
    cycle: ['bash', 'shatter', 'bash'],
    bashDmg: 11, shatterDmg: 16, enrageAt: 30, fatalDmg: 20,
    deck: { strike: 3, defend: 2, bloodTrade: 3, insight: 4 }
  }
];

const ARCHETYPES = {
  berserker: { id: 'berserker', name: 'Berserker', glyph: '⚔️', desc: 'Embrace aggression. Boons favor striking hard and living on the edge.' },
  bloodPriest: { id: 'bloodPriest', name: 'Blood Priest', glyph: '🩸', desc: 'Embrace sacrifice. Boons favor massive damage spikes and self-harm.' },
  ironSentinel: { id: 'ironSentinel', name: 'Iron Sentinel', glyph: '🛡️', desc: 'Embrace endurance. Boons favor impenetrable armor and counter-attacks.' }
};

const BOONS_CATALOG = {
  // Berserker
  momentum: { archetype: 'berserker', name: 'Momentum', glyph: '⚡', desc: 'The 3rd card played in a turn has a ×1.5 damage multiplier.' },
  vampiricStrike: { archetype: 'berserker', name: 'Vampiric Strike', glyph: '💖', desc: 'If you play exactly 3 [Strike] cards in a turn, heal 3 HP.' },
  bloodlust: { archetype: 'berserker', name: 'Bloodlust', glyph: '🔥', desc: '[Strike] deals +3 damage if your HP is at or below 50%.' },
  warTax: { archetype: 'berserker', name: 'War Tax', glyph: '⚖️', desc: 'Every time you lose HP, deal 2 damage to the Golem.' },
  
  // Blood Priest
  thickBlood: { archetype: 'bloodPriest', name: 'Thick Blood', glyph: '🩸', desc: '[Blood Trade] costs 1 HP instead of 3.' },
  enduringInsight: { archetype: 'bloodPriest', name: 'Enduring Insight', glyph: '✨', desc: '[Insight] lasts for two turns instead of one.' },
  hemorrhage: { archetype: 'bloodPriest', name: 'Hemorrhage', glyph: '🥀', desc: '[Blood Trade] deals +4 damage.' },
  lastRites: { archetype: 'bloodPriest', name: 'Last Rites', glyph: '⚰️', desc: 'Once per run, survive a killing blow at 1 HP.' },
  
  // Iron Sentinel
  spikedArmor: { archetype: 'ironSentinel', name: 'Spiked Armor', glyph: '🛡️', desc: 'Playing [Defend] deals 3 damage to the Golem.' },
  fortress: { archetype: 'ironSentinel', name: 'Fortress', glyph: '🏰', desc: '[Defend] grants 8 Armor instead of 6.' },
  thorns: { archetype: 'ironSentinel', name: 'Thorns', glyph: '🌵', desc: 'Whenever you lose HP to an enemy attack, deal 3 damage to the Golem.' },
  grit: { archetype: 'ironSentinel', name: 'Grit', glyph: '💪', desc: 'At the start of each turn, gain 3 Armor.' },
};

let globalLevelIndex = 0; // Tracks player progression from 0 to 4
let globalPlayerBoons = []; // Array of boon IDs acquired
let globalConsumedBoons = []; // Array of boon IDs that were single-use and consumed

// ─────────────────────────────────────────
// 3. GAME STATE
// ─────────────────────────────────────────
let state = {};

function createInitialState(levelConfig) {
  return {
    turn: 1,
    phase: 'player',   // 'player' | 'enemy' | 'over'
    player: {
      maxHp: levelConfig.playerHp,
      hp: levelConfig.playerHp,
      armor: 0,
      insightActive: false,
      insightActiveDuration: 0,
      insightMultiplier: 1,
    },
    enemy: {
      maxHp: levelConfig.enemyHp,
      hp: levelConfig.enemyHp,
      turnIndex: 0,
      enraged: false,
    },
    deck: {
      drawPile: [],
      discardPile: [],
      hand: [],
    },
    cardsPlayedThisTurn: 0,
    selectedCards: [],
  };
}

// ─────────────────────────────────────────
// 4. DECK MANAGEMENT
// ─────────────────────────────────────────
function buildDeck(levelConfig) {
  const deck = [];
  const reqs = levelConfig.deck;
  
  for (const [id, count] of Object.entries(reqs)) {
    const cardProto = CARD_CATALOG[id];
    for (let i = 0; i < count; i++) {
        deck.push({ ...cardProto });
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
// 5. ENEMY AI
// ─────────────────────────────────────────
function getLevelIntents(levelConfig) {
  return {
    bash: { name: 'Bash', damage: levelConfig.bashDmg, icon: '⚡', type: 'normal' },
    shatter: { name: 'Shatter', damage: levelConfig.shatterDmg, icon: '💥', type: 'normal' },
    recharge: { name: 'Recharge', damage: 0, icon: '⚙️', type: 'safe' },
    fatalStrike: { name: 'Fatal Strike', damage: levelConfig.fatalDmg, icon: '☠️', type: 'enrage' },
  };
}

function getIntent(state) {
  const levelConfig = LEVELS[globalLevelIndex];
  const intents = getLevelIntents(levelConfig);
  
  if (state.enemy.enraged) return intents.fatalStrike;
  
  const intentKey = levelConfig.cycle[state.enemy.turnIndex % levelConfig.cycle.length];
  return intents[intentKey];
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
    
    if (realDamage > 0 && globalPlayerBoons.includes('thorns')) {
      dealDamageToEnemy(state, 3);
      log(`🌵 <span class="log-damage">Thorns → 3 damage returned to Golem!</span>`);
    }
    if (realDamage > 0 && globalPlayerBoons.includes('warTax')) {
      dealDamageToEnemy(state, 2);
      log(`⚖️ <span class="log-damage">War Tax → 2 damage returned to Golem!</span>`);
    }
  } else {
    log(`<span class="log-system">⚙️ Golem recharges. Nothing happens.</span>`);
  }
  
  applyLastRitesIfNeeded(state);

  if (!state.enemy.enraged) {
    state.enemy.turnIndex++;
  }
}

function applyLastRitesIfNeeded(state) {
  if (state.player.hp <= 0 && globalPlayerBoons.includes('lastRites') && !globalConsumedBoons.includes('lastRites')) {
    state.player.hp = 1;
    globalConsumedBoons.push('lastRites');
    log(`⚰️ <span class="log-buff">Last Rites activates! You survive at 1 HP!</span>`);
    updateActiveBoonsUI();
  }
}

function checkEnrage(state) {
  const levelConfig = LEVELS[globalLevelIndex];
  if (!state.enemy.enraged && state.enemy.hp <= levelConfig.enrageAt) {
    state.enemy.enraged = true;
    log(`<span class="log-blood">☠️ The Golem ENRAGES! Fatal Strike every turn!</span>`);
    document.getElementById('enemy-panel').classList.add('enraged');
    triggerShake();
  }
}

// ─────────────────────────────────────────
// 6. WIN / LOSE CHECKS
// ─────────────────────────────────────────
function checkWin(state) {
  return state.enemy.hp <= 0;
}
function checkLose(state) {
  return state.player.hp <= 0;
}

// ─────────────────────────────────────────
// 7. GAME LOOP
// ─────────────────────────────────────────
function startTurn(state) {
  state.phase = 'player';
  state.cardsPlayedThisTurn = 0;
  state.selectedCards = [];

  // Reset player turn-start state
  state.player.armor = 0;
  
  if (globalPlayerBoons.includes('grit')) {
    state.player.armor += 3;
    log(`💪 <span class="log-defend">Grit → +3 Armor at start of turn.</span>`);
  }
  
  if (state.player.insightActiveDuration > 0) {
    state.player.insightActiveDuration--;
  }
  
  if (state.player.insightActiveDuration <= 0) {
    state.player.insightActive = false;
    state.player.insightMultiplier = 1;
  }

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
  const btn = document.getElementById('restart-btn');

  overlay.classList.remove('hidden');

  if (playerWon) {
    icon.textContent = '🏆';
    if (globalLevelIndex < LEVELS.length - 1) {
      title.textContent = 'Victory!';
      title.className = 'win';
      msg.textContent = `The Golem's form shatters, but it begins to reassemble into something stronger... You survived ${state.turn} turns.`;
      
      btn.textContent = 'Next Level ›';
      btn.onclick = () => {
        globalLevelIndex++;
        showBoonSelection();
        overlay.classList.add('hidden');
      };
    } else {
      title.textContent = 'True Victory!';
      title.className = 'win true-win';
      msg.textContent = `You have broken the Final Vow. The Ancient Golem is no more. You are absolute.`;
      
      btn.textContent = 'Play Again (Reset level 1)';
      btn.onclick = () => {
        globalLevelIndex = 0;
        globalPlayerBoons = [];
        globalConsumedBoons = [];
        updateActiveBoonsUI();
        showIntroOverlay();
        overlay.classList.add('hidden');
      };
    }
  } else {
    icon.textContent = '💀';
    title.textContent = 'Defeated.';
    title.className = 'lose';
    msg.textContent = `The Golem's power overwhelms you. The Vow remains unbroken.`;
    
    btn.textContent = 'Play Again (Reset level 1)';
    btn.onclick = () => {
      globalLevelIndex = 0;
      globalPlayerBoons = [];
      globalConsumedBoons = [];
      updateActiveBoonsUI();
      showIntroOverlay();
      overlay.classList.add('hidden');
    };
  }
}

// ─────────────────────────────────────────
// 8. CARD PLAY LOGIC
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
  const ordered = state.selectedCards.map(i => state.deck.hand[i]);

  // Remove from hand (reverse order to preserve indices)
  for (const i of toPlay) {
    state.deck.discardPile.push(state.deck.hand[i]);
    state.deck.hand.splice(i, 1);
  }

  state.selectedCards = [];
  
  let strikeCount = 0;

  for (const card of ordered) {
    state.cardsPlayedThisTurn += 1;
    if (card.id === 'strike') strikeCount++;
    
    card.play(state);
    updateAllUI(state);

    if (checkWin(state)) {
      setTimeout(() => endGame(state, true), 400);
      return;
    }
    if (checkLose(state)) {
      setTimeout(() => endGame(state, false), 400);
      return;
    }
  }
  
  if (globalPlayerBoons.includes('vampiricStrike') && ordered.length === 3 && strikeCount === 3) {
    state.player.hp = Math.min(state.player.maxHp, state.player.hp + 3);
    log(`💖 <span class="log-buff">Vampiric Strike → Restored 3 HP!</span>`);
    updatePlayerUI(state);
  }

  renderHand(state);
  updateDeckUI(state);
  updatePlayCounter(state);
  updatePlaySelectedBtn();
  updateEndTurnBtn();
}

// ─────────────────────────────────────────
// 9. UI RENDERING
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

function updatePlayerUI(state) {
  const p = state.player;
  const pct = Math.max(0, p.hp / p.maxHp * 100);

  document.getElementById('player-hp').textContent = p.hp;
  document.getElementById('player-max-hp').textContent = p.maxHp;
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
  document.getElementById('enemy-max-hp').textContent = e.maxHp;
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

function updateLevelCounter() {
  document.getElementById('level-num').textContent = globalLevelIndex + 1;
}

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
// 10. LOGGING
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
// 11. EFFECTS
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
// 12. BOOTSTRAP TO LEVEL
// ─────────────────────────────────────────
function showIntroOverlay() {
  const overlay = document.getElementById('intro-overlay');
  const levelConfig = LEVELS[globalLevelIndex];
  
  // Format the rules nicely
  const rulesHtml = levelConfig.rules.map(r => `<div class="rule-item">${r}</div>`).join('');
  
  // Create or update the modal content safely
  const modal = document.getElementById('intro-modal');
  modal.innerHTML = `
    <h2 class="intro-title">${levelConfig.title}</h2>
    <p class="intro-flavour">${levelConfig.flavor}</p>
    <div class="intro-rules">
      ${globalLevelIndex === 0 ? `<div class="rule-item" style="color:#aaa;"><em>Reminder: You draw 5 cards, but may only play 3.</em></div>` : ''}
      ${rulesHtml}
    </div>
    <button id="start-btn" class="btn-primary">Begin the Battle</button>
  `;
  
  // Reattach listener since we nuked the innerHTML
  document.getElementById('start-btn').addEventListener('click', () => {
    overlay.classList.add('hidden');
    initGame();
  });
  
  overlay.classList.remove('hidden');
}

function showBoonSelection() {
  const overlay = document.getElementById('boon-overlay');
  const container = document.getElementById('boon-options-container');
  
  // Pick boons that player doesn't have from the entire pool
  let available = Object.keys(BOONS_CATALOG).filter(k => 
    !globalPlayerBoons.includes(k)
  );
  
  const options = shuffle(available).slice(0, 2);
  
  if (options.length === 0) {
    // If we run out of boons, just skip the selection.
    showIntroOverlay();
    return;
  }
  
  container.innerHTML = '';
  options.forEach(boonId => {
    const boon = BOONS_CATALOG[boonId];
    const el = document.createElement('div');
    el.className = 'boon-card';
    el.innerHTML = `
      <div class="boon-glyph">${boon.glyph}</div>
      <div class="boon-name">${boon.name}</div>
      <div class="boon-desc">${boon.desc}</div>
    `;
    el.onclick = () => {
      globalPlayerBoons.push(boonId);
      overlay.classList.add('hidden');
      updateActiveBoonsUI();
      showIntroOverlay();
    };
    container.appendChild(el);
  });
  
  overlay.classList.remove('hidden');
}

function updateActiveBoonsUI() {
  const container = document.getElementById('active-boons-list');
  if (!container) return;
  container.innerHTML = '';
  globalPlayerBoons.forEach(bId => {
    const boon = BOONS_CATALOG[bId];
    const el = document.createElement('span');
    el.className = 'active-boon-icon';
    if (globalConsumedBoons.includes(bId)) {
      el.classList.add('consumed');
    }
    el.textContent = boon.glyph;
    el.title = `${boon.name}: ${boon.desc}`;
    container.appendChild(el);
  });
}

function initGame() {
  const levelConfig = LEVELS[globalLevelIndex];
  
  logEl = document.getElementById('turn-log');
  logEl.innerHTML = `
    <div class="log-entry" style="color: #64ffda; text-align: center; margin-bottom: 8px;">
      :: Beginning ${levelConfig.title} ::
    </div>
  `;

  state = createInitialState(levelConfig);
  state.deck.drawPile = shuffle(buildDeck(levelConfig));

  // Reset enemy enrage visual
  document.getElementById('enemy-panel').classList.remove('enraged');
  document.getElementById('result-overlay').classList.add('hidden');

  startTurn(state);
}

// ─────────────────────────────────────────
// 13. EVENT LISTENERS
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

// Remove old static start-btn listener as showIntroOverlay sets it per level.
// Remove direct restart-btn listener as endGame sets it per result.

// Kick off
window.addEventListener('DOMContentLoaded', () => {
  showIntroOverlay();
});
