'use strict';

/* ══════════════════════════════════════════
   ENGINE — Effect Bus
   The single gateway for all HP mutations and reactive effects.
   ALL damage to player or enemy must route through here.
   This ensures triggered boons (War Tax, Thorns, Last Rites)
   always fire reliably regardless of damage source.
══════════════════════════════════════════ */

/**
 * Deals damage to the enemy, applies flash animation.
 * ALWAYS use this instead of mutating state.enemy.hp directly.
 * @param {object} state
 * @param {number} dmg - Raw damage amount (before any caps)
 */
function dealDamageToEnemy(state, dmg) {
  state.enemy.hp = Math.max(0, state.enemy.hp - dmg);
  const panel = document.getElementById('enemy-panel');
  panel.classList.add('flash-damage');
  panel.addEventListener('animationend', () => panel.classList.remove('flash-damage'), { once: true });
  updateEnemyUI(state);
}

/**
 * Applies self-inflicted damage to the player (true damage, ignores armor).
 * Routes through the effect bus so War Tax fires correctly.
 * @param {object} state
 * @param {number} amount - HP to remove
 */
function applyPlayerSelfDamage(state, amount) {
  if (amount <= 0) return;
  state.player.hp = Math.max(0, state.player.hp - amount);
  // War Tax: self-damage also triggers it
  if (globalPlayerBoons.includes('warTax')) {
    dealDamageToEnemy(state, 2);
    log(`⚖️ <span class="log-damage">War Tax → 2 damage returned to Golem!</span>`);
  }
}

/**
 * Applies enemy-attack damage to the player, respecting armor.
 * Triggers Thorns and War Tax reactions if applicable.
 * @param {object} state
 * @param {object} intent - The enemy intent that caused the damage
 */
function applyEnemyAttackDamage(state, intent) {
  const blocked    = Math.min(state.player.armor, intent.damage);
  const realDamage = intent.damage - blocked;
  state.player.armor = Math.max(0, state.player.armor - intent.damage);
  state.player.hp    = Math.max(0, state.player.hp - realDamage);

  if (blocked > 0) {
    log(`<span class="log-enemy">💥 Golem uses ${intent.name} for ${intent.damage}. ${blocked} blocked → ${realDamage} damage.</span>`);
  } else {
    log(`<span class="log-enemy">💥 Golem uses ${intent.name} for ${intent.damage} damage!</span>`);
  }

  // Reactive boons — only trigger on real (unblocked) damage
  if (realDamage > 0 && globalPlayerBoons.includes('thorns')) {
    dealDamageToEnemy(state, 3);
    log(`🌵 <span class="log-damage">Thorns → 3 damage returned to Golem!</span>`);
  }
  if (realDamage > 0 && globalPlayerBoons.includes('warTax')) {
    dealDamageToEnemy(state, 2);
    log(`⚖️ <span class="log-damage">War Tax → 2 damage returned to Golem!</span>`);
  }
}

/**
 * Checks and applies the Last Rites survival boon.
 * Must be called AFTER any HP change that could bring player to 0,
 * and BEFORE checkLose() is evaluated.
 * @param {object} state
 */
function applyLastRitesIfNeeded(state) {
  if (
    state.player.hp <= 0 &&
    globalPlayerBoons.includes('lastRites') &&
    !globalConsumedBoons.includes('lastRites')
  ) {
    state.player.hp = 1;
    globalConsumedBoons.push('lastRites');
    log(`⚰️ <span class="log-buff">Last Rites activates! You survive at 1 HP!</span>`);
    updateActiveBoonsUI();
  }
}
