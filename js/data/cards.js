'use strict';

/* ══════════════════════════════════════════
   DATA — Card Catalog
   Each entry is a card prototype. play() functions call
   into effectBus.js for damage routing and state mutation.
   Adding a new card = adding one entry here.
══════════════════════════════════════════ */

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
      const levelConfig = typeof LEVELS !== 'undefined' ? LEVELS[globalLevelIndex] : null;
      const baseCost    = levelConfig ? (levelConfig.bloodTradeCost || 3) : 3;
      const dmg         = globalPlayerBoons.includes('hemorrhage') ? 16 : 12;
      const hpLoss      = globalPlayerBoons.includes('thickBlood')
                            ? Math.max(1, baseCost - 2)
                            : baseCost;
      const debtInfo    = globalPlayerBoons.includes('hemorrhage') ? ' (+2 Debt)' : ' (+1 Debt)';
      return `Deal ${dmg} dmg. Lose ${hpLoss} HP.${debtInfo}`;
    },
    quantity: 2,
    play(state) {
      // ── Damage ──────────────────────────────────────
      let extraMult = 1;
      if (globalPlayerBoons.includes('momentum') && state.cardsPlayedThisTurn === 3) {
        extraMult = 1.5;
        log(`<span class="log-buff">⚡ Momentum activates! (×1.5 dmg)</span>`);
      }
      const extraBase = globalPlayerBoons.includes('hemorrhage') ? 4 : 0;
      const dmg = Math.floor((12 + extraBase) * state.player.insightMultiplier * extraMult);
      dealDamageToEnemy(state, dmg);

      // ── Instant HP cost (level-scaled, Thick Blood reduces by 2) ──
      const levelConfig = typeof LEVELS !== 'undefined' ? LEVELS[globalLevelIndex] : null;
      const baseCost    = levelConfig ? (levelConfig.bloodTradeCost || 3) : 3;
      const recoil      = globalPlayerBoons.includes('thickBlood')
                            ? Math.max(1, baseCost - 2)
                            : baseCost;
      applyPlayerSelfDamage(state, recoil);
      log(`💀 <span class="log-blood">Blood Trade → ${dmg} dmg to Golem, -${recoil} HP (true damage).</span>`);

      // ── Blood Debt accumulation ──────────────────────
      const isFirstThisTurn = !state.player.bloodTradePlayedThisTurn;
      const hasThickBlood   = globalPlayerBoons.includes('thickBlood');
      const hasHemorrhage   = globalPlayerBoons.includes('hemorrhage');

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
      updatePlayerUI(state);
    },
  },

  insight: {
    id: 'insight',
    name: 'Insight',
    type: 'buff',
    glyph: '✨',
    getEffectText: () => globalPlayerBoons.includes('enduringInsight')
      ? 'Attack cards deal ×1.5 for 2 turns.'
      : 'Attack cards deal ×1.5 this turn.',
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

  adrenaline: {
    id: 'adrenaline',
    name: 'Adrenaline',
    type: 'skill',
    glyph: '⚡',
    getEffectText: () => 'Draw 2 cards.',
    quantity: 0,
    play(state) {
      drawCards(state, 2);
      log(`⚡ <span class="log-system">Adrenaline → Drew 2 cards.</span>`);
    },
  },

  transfusion: {
    id: 'transfusion',
    name: 'Transfusion',
    type: 'skill',
    glyph: '🧪',
    getEffectText: () => 'Heal 8 HP. (+1 Debt)',
    quantity: 0,
    play(state) {
      state.player.hp = Math.min(state.player.maxHp, state.player.hp + 8);
      state.player.bloodDebt += 1;
      log(`🧪 <span class="log-buff">Transfusion → Healed 8 HP. Blood Debt increases by 1 (Total: ${state.player.bloodDebt}).</span>`);
      updatePlayerUI(state);
    },
  },

  scavenge: {
    id: 'scavenge',
    name: 'Scavenge',
    type: 'skill',
    glyph: '♻️',
    getEffectText: () => 'Return 1 random card from Exhaust Pile to your hand.',
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

  bloodShield: {
    id: 'bloodShield',
    name: 'Blood Shield',
    type: 'defend',
    glyph: '🩸',
    getEffectText: () => 'Gain 12 Armor. Lose 4 HP.',
    quantity: 0,
    play(state) {
      state.player.armor += 12;
      applyPlayerSelfDamage(state, 4);
      log(`🩸 <span class="log-defend">Blood Shield → +12 Armor. -4 HP (true damage).</span>`);
      applyLastRitesIfNeeded(state);
      updatePlayerUI(state);
    },
  },

  absolution: {
    id: 'absolution',
    name: 'Absolution',
    type: 'skill',
    glyph: '🕊️',
    getEffectText: () => 'Remove 1 Blood Debt.',
    quantity: 0,
    play(state) {
      if (state.player.bloodDebt > 0) {
        state.player.bloodDebt -= 1;
        log(`🕊️ <span class="log-buff">Absolution → Blood Debt reduced by 1 (Total: ${state.player.bloodDebt}).</span>`);
      } else {
        log(`🕊️ <span class="log-system">Absolution → Blood Debt is already 0.</span>`);
      }
      updatePlayerUI(state);
    },
  },

  martyr: {
    id: 'martyr',
    name: 'Martyr',
    type: 'attack',
    glyph: '💣',
    getEffectText: () => {
      const debt = (typeof state !== 'undefined' && state.player) ? state.player.bloodDebt : 0;
      return `Deal ${debt * 4} damage.<br>(4x Blood Debt)`;
    },
    quantity: 0,
    play(state) {
      const dmg = state.player.bloodDebt * 4;
      dealDamageToEnemy(state, dmg);
      log(`💣 <span class="log-damage">Martyr → Dealt ${dmg} damage from ${state.player.bloodDebt} Blood Debt.</span>`);
    },
  },

  leechStrike: {
    id: 'leechStrike',
    name: 'Leech Strike',
    type: 'attack',
    glyph: '🦇',
    getEffectText: () => 'Deal 4 damage. Heal 4 HP.',
    quantity: 0,
    play(state) {
      dealDamageToEnemy(state, 4);
      state.player.hp = Math.min(state.player.maxHp, state.player.hp + 4);
      log(`🦇 <span class="log-damage">Leech Strike → Dealt 4 damage, healed 4 HP.</span>`);
      updatePlayerUI(state);
    },
  },

  shieldBash: {
    id: 'shieldBash',
    name: 'Shield Bash',
    type: 'attack',
    glyph: '💥',
    getEffectText: () => {
      const armor = (typeof state !== 'undefined' && state.player) ? state.player.armor : 0;
      return `Deal ${armor} damage. Remove all Armor.`;
    },
    quantity: 0,
    play(state) {
      const dmg = state.player.armor;
      state.player.armor = 0;
      dealDamageToEnemy(state, dmg);
      log(`💥 <span class="log-damage">Shield Bash → Expended armor to deal ${dmg} damage.</span>`);
      updatePlayerUI(state);
    },
  },
};
