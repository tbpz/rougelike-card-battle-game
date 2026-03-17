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
      // Route self-damage through the effect bus so War Tax fires correctly
      applyPlayerSelfDamage(state, recoil);
      log(`💀 <span class="log-blood">Blood Trade → ${dmg} damage to Golem, -${recoil} HP to you (true damage).</span>`);
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
};
