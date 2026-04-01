'use strict';

/* ══════════════════════════════════════════
   DATA — Card Catalog
   Each entry is a card prototype. play() functions call
   into effectBus.js for damage routing and state mutation.
   Adding a new card = adding one entry here.

   Refactoring notes:
   - Numeric values are now explicit card properties (baseDamage, etc.)
     so they can be read by getEffectText() without hardcoding.
   - getEffectText() uses safePlayerState() instead of verbose
     `typeof state !== 'undefined'` guards.
   - Redundant updatePlayerUI() calls at the end of play() removed —
     playSelectedCards() calls updateAllUI() after every card.
   - overflow card now routes through dealArmorPiercingDamage()
     instead of directly mutating state.enemy.hp + DOM.
══════════════════════════════════════════ */

const CARD_CATALOG = {
  // ── STARTING DECK CARDS ───────────────────────────────

  strike: {
    id: 'strike',
    name: 'Strike',
    type: 'attack',
    glyph: '⚔️',
    vpCost: 1,
    baseDamage: 6,
    getEffectText() {
      const p = safePlayerState();
      let dmg = this.baseDamage;
      if (p && RunState.playerBoons.includes('bloodlust') && p.hp <= (p.maxHp * 0.5)) {
        dmg += 3;
      }
      return `Deal ${dmg} damage.`;
    },
    quantity: 4,
    play(state) {
      let extraMult = 1;
      if (RunState.playerBoons.includes('momentum') && state.cardsPlayedThisTurn === 3) {
        extraMult = 1.5;
        log(`<span class="log-buff">⚡ Momentum activates! (×1.5 dmg)</span>`);
      }
      const isBloodlust = RunState.playerBoons.includes('bloodlust') && (state.player.hp <= state.player.maxHp * 0.5);
      const extraBase = isBloodlust ? 3 : 0;
      const dmg = Math.floor((this.baseDamage + extraBase) * state.player.insightMultiplier * extraMult);
      dealDamageToEnemy(state, dmg);
      log(`⚔️ <span class="log-damage">Strike → ${dmg} damage to the Golem.</span>`);
    },
  },

  defend: {
    id: 'defend',
    name: 'Defend',
    type: 'defend',
    glyph: '🛡️',
    vpCost: 1,
    baseArmor: 6,
    getEffectText() {
      const armor = RunState.playerBoons.includes('fortress') ? 8 : this.baseArmor;
      let text = `Gain ${armor} Armor.`;
      if (RunState.playerBoons.includes('spikedArmor')) {
        text += '<br>Deal 3 damage.';
      }
      return text;
    },
    quantity: 4,
    play(state) {
      const isFortress = RunState.playerBoons.includes('fortress');
      const armorGain = isFortress ? 8 : this.baseArmor;
      state.player.armor += armorGain;
      log(`🛡️ <span class="log-defend">Defend → +${armorGain} Armor. (Total: ${state.player.armor})</span>`);
      if (RunState.playerBoons.includes('spikedArmor')) {
        dealDamageToEnemy(state, 3);
        log(`🛡️ <span class="log-damage">Spiked Armor → 3 damage to Golem.</span>`);
      }
    },
  },

  bloodTrade: {
    id: 'bloodTrade',
    name: 'Blood Trade',
    type: 'blood',
    glyph: '💀',
    vpCost: 1,
    baseDamage: 12,
    baseHpCost: 2,
    getEffectText() {
      const dmg     = RunState.playerBoons.includes('hemorrhage') ? this.baseDamage + 4 : this.baseDamage;
      const hpLoss  = RunState.playerBoons.includes('thickBlood')
                        ? Math.max(1, this.baseHpCost - 2)
                        : this.baseHpCost;
      const debtInfo = RunState.playerBoons.includes('hemorrhage') ? ' (+2 Debt)' : ' (+1 Debt)';
      return `Deal ${dmg} dmg. Lose ${hpLoss} HP.${debtInfo}`;
    },
    quantity: 2,
    play(state) {
      // ── Damage ──────────────────────────────────────
      let extraMult = 1;
      if (RunState.playerBoons.includes('momentum') && state.cardsPlayedThisTurn === 3) {
        extraMult = 1.5;
        log(`<span class="log-buff">⚡ Momentum activates! (×1.5 dmg)</span>`);
      }
      const extraBase = RunState.playerBoons.includes('hemorrhage') ? 4 : 0;
      const dmg = Math.floor((this.baseDamage + extraBase) * state.player.insightMultiplier * extraMult);
      dealDamageToEnemy(state, dmg);

      // ── Instant HP cost (Thick Blood reduces by 2) ──
      const recoil = RunState.playerBoons.includes('thickBlood')
                       ? Math.max(1, this.baseHpCost - 2)
                       : this.baseHpCost;
      applyPlayerSelfDamage(state, recoil);
      log(`💀 <span class="log-blood">Blood Trade → ${dmg} dmg to Golem, -${recoil} HP (true damage).</span>`);

      // ── Blood Debt accumulation ──────────────────────
      const isFirstThisTurn = !state.player.bloodTradePlayedThisTurn;
      const hasThickBlood   = RunState.playerBoons.includes('thickBlood');
      const hasHemorrhage   = RunState.playerBoons.includes('hemorrhage');

      let debtGain = hasHemorrhage ? 2 : 1;

      // Thick Blood: first Blood Trade each turn generates no Debt
      if (hasThickBlood && isFirstThisTurn) {
        debtGain = 0;
        log(`<span class="log-buff">🩸 Thick Blood — no Debt for first Blood Trade this turn.</span>`);
      }

      if (debtGain > 0) {
        state.player.bloodDebt += debtGain;
        log(`<span class="log-blood">🩸 Blood Debt: +${debtGain} → Total: ${state.player.bloodDebt}</span>`);
      }

      state.player.bloodTradePlayedThisTurn = true;
      applyLastRitesIfNeeded(state);
    },
  },

  insight: {
    id: 'insight',
    name: 'Insight',
    type: 'buff',
    glyph: '✨',
    vpCost: 1,
    getEffectText() {
      return RunState.playerBoons.includes('enduringInsight')
        ? 'Attack cards deal ×1.5 for 2 turns.'
        : 'Attack cards deal ×1.5 this turn.';
    },
    quantity: 2,
    play(state) {
      state.player.insightMultiplier *= 1.5;
      state.player.insightActiveDuration = RunState.playerBoons.includes('enduringInsight') ? 2 : 1;
      state.player.insightActive = true;
      if (RunState.playerBoons.includes('enduringInsight')) {
        log(`✨ <span class="log-buff">Enduring Insight → Attacks deal ×1.5 this turn AND next turn! (Mult: ${state.player.insightMultiplier.toFixed(2)})</span>`);
      } else {
        log(`✨ <span class="log-buff">Insight → All attacks this turn deal ×1.5! (Mult: ${state.player.insightMultiplier.toFixed(2)})</span>`);
      }
    },
  },

  // ── TIER 1 DRAFT CARDS ────────────────────────────────

  adrenaline: {
    id: 'adrenaline',
    name: 'Adrenaline',
    type: 'skill',
    glyph: '⚡',
    vpCost: 0,
    drawCount: 2,
    getEffectText() { return `[Free] Draw ${this.drawCount} cards.`; },
    quantity: 0,
    play(state) {
      drawCards(state, this.drawCount);
      log(`⚡ <span class="log-system">Adrenaline → Drew ${this.drawCount} cards.</span>`);
    },
  },

  leechStrike: {
    id: 'leechStrike',
    name: 'Leech Strike',
    type: 'attack',
    glyph: '🦇',
    vpCost: 1,
    baseDamage: 4,
    healAmount: 4,
    getEffectText() { return `Deal ${this.baseDamage} damage. Heal ${this.healAmount} HP.`; },
    quantity: 0,
    play(state) {
      dealDamageToEnemy(state, this.baseDamage);
      state.player.hp = Math.min(state.player.maxHp, state.player.hp + this.healAmount);
      log(`🦇 <span class="log-damage">Leech Strike → Dealt ${this.baseDamage} damage, healed ${this.healAmount} HP.</span>`);
    },
  },

  bloodShield: {
    id: 'bloodShield',
    name: 'Blood Shield',
    type: 'defend',
    glyph: '🩸',
    vpCost: 1,
    baseArmor: 12,
    selfDamage: 4,
    getEffectText() { return `Gain ${this.baseArmor} Armor. Lose ${this.selfDamage} HP.`; },
    quantity: 0,
    play(state) {
      state.player.armor += this.baseArmor;
      applyPlayerSelfDamage(state, this.selfDamage);
      log(`🩸 <span class="log-defend">Blood Shield → +${this.baseArmor} Armor. -${this.selfDamage} HP (true damage).</span>`);
      applyLastRitesIfNeeded(state);
    },
  },

  foresight: {
    id: 'foresight',
    name: 'Foresight',
    type: 'skill',
    glyph: '🔮',
    vpCost: 1,
    peekCount: 3,
    getEffectText() { return `Look at top ${this.peekCount} cards of draw pile. Add 1 to hand.`; },
    quantity: 0,
    play(state) {
      const pile = state.deck.drawPile;
      if (pile.length === 0) {
        log(`🔮 <span class="log-system">Foresight → Draw pile is empty. Nothing to see.</span>`);
        return;
      }
      const count = Math.min(this.peekCount, pile.length);
      const peeked = pile.splice(pile.length - count, count);
      log(`🔮 <span class="log-buff">Foresight → Choose 1 of ${count} cards to add to your hand.</span>`);
      showForesightModal(state, peeked);
    },
  },

  shatterGuard: {
    id: 'shatterGuard',
    name: 'Shatter Guard',
    type: 'attack',
    glyph: '💥',
    vpCost: 1,
    retainedArmor: 3,
    getEffectText() {
      const p = safePlayerState();
      const armor = p ? p.armor : 0;
      return `Deal ${armor} damage. Set Armor to ${this.retainedArmor}.`;
    },
    quantity: 0,
    play(state) {
      const dmg = state.player.armor;
      state.player.armor = this.retainedArmor;
      dealDamageToEnemy(state, dmg);
      log(`💥 <span class="log-damage">Shatter Guard → Expended ${dmg} armor to deal ${dmg} damage. Retains ${this.retainedArmor} armor.</span>`);
    },
  },

  openingGambit: {
    id: 'openingGambit',
    name: 'Opening Gambit',
    type: 'skill',
    glyph: '🎯',
    vpCost: 0,
    drawFirst: 2,
    drawOther: 1,
    getEffectText() { return `[Free] Draw ${this.drawFirst} if played first this turn, else Draw ${this.drawOther}.`; },
    quantity: 0,
    play(state) {
      const isFirst = state.cardsPlayedThisTurn === 0;
      const drawCount = isFirst ? this.drawFirst : this.drawOther;
      drawCards(state, drawCount);
      log(`🎯 <span class="log-system">Opening Gambit → Drew ${drawCount} card${drawCount > 1 ? 's' : ''}${isFirst ? ' (first card bonus!)' : ''}.</span>`);
    },
  },

  // ── TIER 2 DRAFT CARDS ────────────────────────────────

  execution: {
    id: 'execution',
    name: 'Execution',
    type: 'attack',
    glyph: '🗡️',
    vpCost: 1,
    baseDamage: 4,
    finisherDamage: 12,
    getEffectText() { return `Deal ${this.baseDamage} dmg. If last card played (0 VP left after), deal ${this.finisherDamage} instead.`; },
    quantity: 0,
    play(state) {
      // vpRemaining is decremented before play() is called
      const vpAfter = state.vpRemaining - getCardVPCost(this);
      const isFinisher = vpAfter <= 0;
      const dmg = Math.floor((isFinisher ? this.finisherDamage : this.baseDamage) * state.player.insightMultiplier);
      dealDamageToEnemy(state, dmg);
      if (isFinisher) {
        log(`🗡️ <span class="log-damage">Execution — FINISHER! → ${dmg} damage to the Golem!</span>`);
      } else {
        log(`🗡️ <span class="log-damage">Execution → ${dmg} damage (${vpAfter} VP remain).</span>`);
      }
    },
  },

  ritualBlade: {
    id: 'ritualBlade',
    name: 'Ritual Blade',
    type: 'attack',
    glyph: '🔪',
    vpCost: 1,
    damagePerCard: 3,
    getEffectText() {
      const p = safePlayerState();
      const played = p ? state.cardsPlayedThisTurn : 0;
      return `Deal ${played * this.damagePerCard} damage (${this.damagePerCard}× cards played before this).`;
    },
    quantity: 0,
    play(state) {
      const cardsBefore = Math.max(0, state.cardsPlayedThisTurn - 1);
      const dmg = Math.floor(cardsBefore * this.damagePerCard * state.player.insightMultiplier);
      dealDamageToEnemy(state, dmg);
      log(`🔪 <span class="log-damage">Ritual Blade → ${cardsBefore} cards before it × ${this.damagePerCard} = ${dmg} damage.</span>`);
    },
  },

  echo: {
    id: 'echo',
    name: 'Echo',
    type: 'skill',
    glyph: '📣',
    vpCost: 2,
    getEffectText() { return '[2 VP] The next card you play this turn is played twice.'; },
    quantity: 0,
    play(state) {
      state.player.echoActive = true;
      log(`📣 <span class="log-buff">Echo → The next card played this turn will activate twice!</span>`);
    },
  },

  desperation: {
    id: 'desperation',
    name: 'Desperation',
    type: 'attack',
    glyph: '😤',
    vpCost: 1,
    getEffectText() {
      const p = safePlayerState();
      const missing = p ? (p.maxHp - p.hp) : 0;
      return `Deal damage equal to missing HP (${missing} dmg).`;
    },
    quantity: 0,
    play(state) {
      const dmg = Math.floor((state.player.maxHp - state.player.hp) * state.player.insightMultiplier);
      dealDamageToEnemy(state, dmg);
      log(`😤 <span class="log-damage">Desperation → ${dmg} damage (missing ${state.player.maxHp - state.player.hp} HP).</span>`);
    },
  },

  hollowGuard: {
    id: 'hollowGuard',
    name: 'Hollow Guard',
    type: 'defend',
    glyph: '🫀',
    vpCost: 1,
    armorPerDebt: 3,
    debtCost: 1,
    getEffectText() {
      const p = safePlayerState();
      const debt = p ? p.bloodDebt : 0;
      return `Gain ${debt * this.armorPerDebt} Armor (${this.armorPerDebt}× Blood Debt). +${this.debtCost} Debt.`;
    },
    quantity: 0,
    play(state) {
      const armorGain = state.player.bloodDebt * this.armorPerDebt;
      state.player.armor += armorGain;
      state.player.bloodDebt += this.debtCost;
      log(`🫀 <span class="log-defend">Hollow Guard → +${armorGain} Armor from ${state.player.bloodDebt - 1} Debt. Debt rises to ${state.player.bloodDebt}.</span>`);
    },
  },

  overflow: {
    id: 'overflow',
    name: 'Overflow',
    type: 'attack',
    glyph: '🌊',
    vpCost: 1,
    baseDamage: 5,
    armorPierceThreshold: 10,
    getEffectText() {
      const p = safePlayerState();
      const armor = p ? p.armor : 0;
      if (armor >= this.armorPierceThreshold) return `Deal ${this.baseDamage} damage. Ignores enemy armor (≥${this.armorPierceThreshold} Armor bonus active).`;
      return `Deal ${this.baseDamage} damage. (Gain armor-pierce at ≥${this.armorPierceThreshold} Armor — currently ${armor})`;
    },
    quantity: 0,
    play(state) {
      const hasBonus = state.player.armor >= this.armorPierceThreshold;
      const dmg = Math.floor(this.baseDamage * state.player.insightMultiplier);
      if (hasBonus) {
        // Route through effectBus armor-piercing function — no direct HP mutation
        dealArmorPiercingDamage(state, dmg);
        log(`🌊 <span class="log-damage">Overflow — ARMOR PIERCE! → ${dmg} damage (ignores Golem's armor).</span>`);
      } else {
        dealDamageToEnemy(state, dmg);
        log(`🌊 <span class="log-damage">Overflow → ${dmg} damage to the Golem.</span>`);
      }
    },
  },

  // ── TIER 3 DRAFT CARDS ────────────────────────────────

  allIn: {
    id: 'allIn',
    name: 'All In',
    type: 'attack',
    glyph: '🎰',
    vpCost: 0,
    baseDamage: 20,
    getEffectText() { return `[Free] Deal ${this.baseDamage} damage. End your turn immediately.`; },
    quantity: 0,
    play(state) {
      const dmg = Math.floor(this.baseDamage * state.player.insightMultiplier);
      dealDamageToEnemy(state, dmg);
      log(`🎰 <span class="log-damage">All In → ${dmg} damage! Turn ends immediately.</span>`);
      // cardPlayManager.playSelectedCards() checks card.id === 'allIn' to force endTurn
    },
  },

  lifeTap: {
    id: 'lifeTap',
    name: 'Life Tap',
    type: 'skill',
    glyph: '💉',
    vpCost: 0,
    selfDamage: 4,
    vpGain: 2,
    getEffectText() { return `[Free] Lose ${this.selfDamage} HP. Gain +${this.vpGain} VP this turn.`; },
    quantity: 0,
    play(state) {
      applyPlayerSelfDamage(state, this.selfDamage);
      state.vpRemaining += this.vpGain;
      state.vpMax += this.vpGain;
      log(`💉 <span class="log-blood">Life Tap → Lost ${this.selfDamage} HP. Gained +${this.vpGain} VP (now ${state.vpRemaining} VP remaining).</span>`);
      applyLastRitesIfNeeded(state);
      if (typeof updatePlayCounter === 'function') updatePlayCounter(state);
    },
  },

  smolder: {
    id: 'smolder',
    name: 'Smolder',
    type: 'attack',
    glyph: '🔥',
    vpCost: 1,
    baseDamage: 3,
    delayedDamage: 6,
    getEffectText() { return `Deal ${this.baseDamage} damage now. Deal ${this.delayedDamage} more at the start of your next turn.`; },
    quantity: 0,
    play(state) {
      dealDamageToEnemy(state, this.baseDamage);
      state.player.smolderDamage = (state.player.smolderDamage || 0) + this.delayedDamage;
      log(`🔥 <span class="log-damage">Smolder → ${this.baseDamage} damage now. ${this.delayedDamage} more damage queued for next turn start.</span>`);
    },
  },

  crimsonTide: {
    id: 'crimsonTide',
    name: 'Crimson Tide',
    type: 'attack',
    glyph: '🌊',
    vpCost: 2,
    damagePerDebt: 3,
    getEffectText() {
      const p = safePlayerState();
      const debt = p ? p.bloodDebt : 0;
      return `[2 VP] Deal ${debt * this.damagePerDebt} damage (${this.damagePerDebt}× Blood Debt).`;
    },
    quantity: 0,
    play(state) {
      const dmg = Math.floor(state.player.bloodDebt * this.damagePerDebt * state.player.insightMultiplier);
      dealDamageToEnemy(state, dmg);
      log(`🌊 <span class="log-damage">Crimson Tide → ${dmg} damage from ${state.player.bloodDebt} Debt (×${this.damagePerDebt}).</span>`);
    },
  },

  volatileFlask: {
    id: 'volatileFlask',
    name: 'Volatile Flask',
    type: 'attack',
    glyph: '⚗️',
    vpCost: 1,
    outcomes: [
      { dmg: 18, self: 0,  label: 'PERFECT' },
      { dmg: 12, self: 3,  label: 'PARTIAL' },
      { dmg: 6,  self: 6,  label: 'BACKFIRE' },
    ],
    getEffectText() { return 'Chaotic: Deal 18/12/6 dmg (equal chance). Take 0/3/6 self-damage.'; },
    quantity: 0,
    play(state) {
      const roll = Math.floor(Math.random() * this.outcomes.length);
      const outcome = this.outcomes[roll];
      const dmg = Math.floor(outcome.dmg * state.player.insightMultiplier);
      dealDamageToEnemy(state, dmg);
      if (outcome.self > 0) {
        applyPlayerSelfDamage(state, outcome.self);
        applyLastRitesIfNeeded(state);
      }
      log(`⚗️ <span class="log-damage">Volatile Flask [${outcome.label}] → ${dmg} damage to Golem${outcome.self > 0 ? `, -${outcome.self} HP self` : ''}.</span>`);
    },
  },

  penance: {
    id: 'penance',
    name: 'Penance',
    type: 'skill',
    glyph: '🕊️',
    vpCost: 1,
    dmgPerDebtRemoved: 2,
    getEffectText() {
      const p = safePlayerState();
      const debt = p ? p.bloodDebt : 0;
      return `Remove ALL Blood Debt. Take ${debt * this.dmgPerDebtRemoved} HP (${this.dmgPerDebtRemoved}× Debt removed).`;
    },
    quantity: 0,
    play(state) {
      const removed = state.player.bloodDebt;
      const selfDmg = removed * this.dmgPerDebtRemoved;
      state.player.bloodDebt = 0;
      if (selfDmg > 0) {
        applyPlayerSelfDamage(state, selfDmg);
        applyLastRitesIfNeeded(state);
      }
      log(`🕊️ <span class="log-buff">Penance → Removed ${removed} Blood Debt. Took ${selfDmg} HP in payment.</span>`);
    },
  },

  // ── TIER 4 DRAFT CARDS ────────────────────────────────

  transfusion: {
    id: 'transfusion',
    name: 'Transfusion',
    type: 'skill',
    glyph: '🧪',
    vpCost: 1,
    healAmount: 8,
    debtCost: 1,
    getEffectText() { return `Heal ${this.healAmount} HP. (+${this.debtCost} Debt)`; },
    quantity: 0,
    play(state) {
      state.player.hp = Math.min(state.player.maxHp, state.player.hp + this.healAmount);
      state.player.bloodDebt += this.debtCost;
      log(`🧪 <span class="log-buff">Transfusion → Healed ${this.healAmount} HP. Blood Debt increases by ${this.debtCost} (Total: ${state.player.bloodDebt}).</span>`);
    },
  },

  scavenge: {
    id: 'scavenge',
    name: 'Scavenge',
    type: 'skill',
    glyph: '♻️',
    vpCost: 1,
    getEffectText() { return 'Return 1 random card from Exhaust Pile to your hand.'; },
    quantity: 0,
    play(state) {
      if (state.deck.exhaustPile.length > 0) {
        const idx = Math.floor(Math.random() * state.deck.exhaustPile.length);
        const card = state.deck.exhaustPile.splice(idx, 1)[0];
        state.deck.hand.push(card);
        log(`♻️ <span class="log-system">Scavenge → Retrieved [${card.name}] from the Exhaust Pile!</span>`);
      } else {
        log(`♻️ <span class="log-system">Scavenge → Exhaust Pile is empty. Nothing to retrieve.</span>`);
      }
    },
  },

  absolution: {
    id: 'absolution',
    name: 'Absolution',
    type: 'skill',
    glyph: '🕊️',
    vpCost: 1,
    debtReduction: 1,
    getEffectText() { return `Remove ${this.debtReduction} Blood Debt.`; },
    quantity: 0,
    play(state) {
      if (state.player.bloodDebt > 0) {
        state.player.bloodDebt -= this.debtReduction;
        log(`🕊️ <span class="log-buff">Absolution → Blood Debt reduced by ${this.debtReduction} (Total: ${state.player.bloodDebt}).</span>`);
      } else {
        log(`🕊️ <span class="log-system">Absolution → Blood Debt is already 0.</span>`);
      }
    },
  },

  martyr: {
    id: 'martyr',
    name: 'Martyr',
    type: 'attack',
    glyph: '💣',
    vpCost: 1,
    damagePerDebt: 4,
    getEffectText() {
      const p = safePlayerState();
      const debt = p ? p.bloodDebt : 0;
      return `Deal ${debt * this.damagePerDebt} damage.<br>(${this.damagePerDebt}x Blood Debt)`;
    },
    quantity: 0,
    play(state) {
      const dmg = Math.floor(state.player.bloodDebt * this.damagePerDebt * state.player.insightMultiplier);
      dealDamageToEnemy(state, dmg);
      log(`💣 <span class="log-damage">Martyr → Dealt ${dmg} damage from ${state.player.bloodDebt} Blood Debt.</span>`);
    },
  },

  bloodTithe: {
    id: 'bloodTithe',
    name: 'Blood Tithe',
    type: 'skill',
    glyph: '🗡️',
    vpCost: 1,
    maxDebtRemoval: 2,
    hpCostPerDebt: 5,
    getEffectText() {
      const p = safePlayerState();
      const debt = p ? p.bloodDebt : 0;
      const reduction = Math.min(this.maxDebtRemoval, debt);
      return `Remove ${this.maxDebtRemoval} Blood Debt. Lose ${reduction * this.hpCostPerDebt} HP (${this.hpCostPerDebt}× per Debt removed).`;
    },
    quantity: 0,
    play(state) {
      const reduction = Math.min(this.maxDebtRemoval, state.player.bloodDebt);
      state.player.bloodDebt -= reduction;
      const selfDmg = reduction * this.hpCostPerDebt;
      if (selfDmg > 0) {
        applyPlayerSelfDamage(state, selfDmg);
        applyLastRitesIfNeeded(state);
      }
      log(`🗡️ <span class="log-buff">Blood Tithe → Removed ${reduction} Debt. Paid ${selfDmg} HP. (Total Debt: ${state.player.bloodDebt})</span>`);
    },
  },

  shieldBash: {
    id: 'shieldBash',
    name: 'Shield Bash',
    type: 'attack',
    glyph: '💥',
    vpCost: 1,
    getEffectText() {
      const p = safePlayerState();
      const armor = p ? p.armor : 0;
      return `Deal ${armor} damage. Remove all Armor.`;
    },
    quantity: 0,
    play(state) {
      const dmg = state.player.armor;
      state.player.armor = 0;
      dealDamageToEnemy(state, dmg);
      log(`💥 <span class="log-damage">Shield Bash → Expended armor to deal ${dmg} damage.</span>`);
    },
  },
};
