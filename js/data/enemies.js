'use strict';

/* ══════════════════════════════════════════
   DATA — Enemy Catalog
   Defines enemy archetypes with weighted intent pools
   and systemic overrides. The Intent Engine in
   intentEngine.js uses these to resolve each turn.

   Adding a new enemy archetype = add one entry here.
   Adding a new intent = add one entry to the archetype's intents[].
══════════════════════════════════════════ */

const ENEMY_CATALOG = {

  /* ─────────────────────────────────────────
     THE ANCIENT GOLEM
     Archetype: Tank. Relentlessly punishes turtling
     and blood-hungry players. Enrages late.
  ───────────────────────────────────────── */
  ancient_golem: {
    id:   'ancient_golem',
    name: 'Ancient Golem',

    /**
     * intents[]: The normal probability pool.
     * Fields:
     *   id       – unique action identifier
     *   name     – display name in UI
     *   type     – 'attack' | 'defend' | 'buff' | 'debuff' | 'safe'
     *   icon     – emoji glyph shown in intent box
     *   weight   – relative probability (higher = more likely)
     *   maxCooldown – turns this intent is locked after use (0 = no cooldown)
     *   execute(state, levelConfig) – performs the effect
     */
    intents: [
      {
        id: 'bash',
        name: 'Bash',
        type: 'attack',
        icon: '⚡',
        weight: 45,
        maxCooldown: 0,
        getDamage: (lc) => lc.bashDmg,
        execute(state, levelConfig) {
          applyEnemyAttackDamage(state, { name: 'Bash', damage: levelConfig.bashDmg });
        },
      },
      {
        id: 'shatter',
        name: 'Shatter',
        type: 'attack',
        icon: '💥',
        weight: 30,
        maxCooldown: 1, // Can't use Shatter two turns in a row
        getDamage: (lc) => lc.shatterDmg,
        execute(state, levelConfig) {
          applyEnemyAttackDamage(state, { name: 'Shatter', damage: levelConfig.shatterDmg });
        },
      },
      {
        id: 'fortify',
        name: 'Fortify',
        type: 'defend',
        icon: '🛡️',
        weight: 20,
        maxCooldown: 2, // Must rest 2 turns between each Fortify
        getDamage: (_lc) => 0,
        execute(state, levelConfig) {
          const armor = levelConfig.shieldArmor || 8;
          state.enemy.armor += armor;
          log(`<span class="log-system">🛡️ Golem Fortifies — gains ${armor} Armor. (Total: ${state.enemy.armor})</span>`);
          updateEnemyUI(state);
        },
      },
      {
        id: 'recharge',
        name: 'Recharge',
        type: 'safe',
        icon: '⚙️',
        weight: 5,
        maxCooldown: 0,
        getDamage: (_lc) => 0,
        execute(state, _levelConfig) {
          log(`<span class="log-system">⚙️ Golem recharges. Nothing happens.</span>`);
        },
      },
      // Invisible fallback — zero weight, never rolled normally.
      // Only fires if all other intents are locked out (safety net).
      {
        id: 'struggle',
        name: 'Struggle',
        type: 'attack',
        icon: '💢',
        weight: 0,
        maxCooldown: 0,
        getDamage: (_lc) => 1,
        execute(state, _levelConfig) {
          applyEnemyAttackDamage(state, { name: 'Struggle', damage: 1 });
          log(`<span class="log-system">💢 Golem struggles.</span>`);
        },
      },
    ],

    /**
     * overrides[]: Systemic reactions checked BEFORE the probability pool.
     * Highest-priority first. Each override has its own cooldown so
     * it cannot fire every single turn.
     *
     * Fields:
     *   condition(state, levelConfig) – returns true to trigger this override
     *   intentId                      – which intent to execute (must exist in intents[])
     *   maxCooldown                   – turns this override is locked after firing
     */
    overrides: [
      {
        // Enrage: permanently switch to Fatal Strike when HP drops low enough.
        // maxCooldown 99 ensures it fires only once per battle.
        condition: (state, levelConfig) =>
          !state.enemy.enraged && state.enemy.hp <= levelConfig.enrageAt,
        intentId: 'fatalStrike',
        maxCooldown: 99,
      },
      {
        // Blood Scent: punish reckless Blood Debt accumulation (levels 2+).
        condition: (state, levelConfig) =>
          state.player.bloodDebt >= 3 && (globalLevelIndex >= 1),
        intentId: 'bloodScent',
        maxCooldown: 3,
      },
      {
        // Armour Shatter: punish players who stack massive armour.
        condition: (state, _levelConfig) => state.player.armor >= 20,
        intentId: 'armorShatter',
        maxCooldown: 3,
      },
    ],

    /**
     * overrideIntents{}: Actions only accessible via overrides (not in normal pool).
     * This keeps the probability pool clean while still allowing unique punish actions.
     */
    overrideIntents: {
      fatalStrike: {
        id: 'fatalStrike',
        name: 'Fatal Strike',
        type: 'attack',
        icon: '☠️',
        getDamage: (lc) => lc.fatalDmg,
        execute(state, levelConfig) {
          state.enemy.enraged = true;
          applyEnemyAttackDamage(state, { name: 'Fatal Strike', damage: levelConfig.fatalDmg });
        },
      },
      bloodScent: {
        id: 'bloodScent',
        name: 'Blood Scent',
        type: 'attack',
        icon: '🩸',
        getDamage: (lc) => Math.floor(lc.bashDmg * 1.5),
        execute(state, levelConfig) {
          // Deals bash damage as true damage to player (bypasses armor).
          const dmg = Math.floor(levelConfig.bashDmg * 1.5);
          state.player.hp = Math.max(0, state.player.hp - dmg);
          log(`<span class="log-enemy">🩸 Golem smells blood! Blood Scent deals ${dmg} TRUE damage (ignores armor).</span>`);
          applyLastRitesIfNeeded(state);
          updatePlayerUI(state);
        },
      },
      armorShatter: {
        id: 'armorShatter',
        name: 'Armour Shatter',
        type: 'attack',
        icon: '🔨',
        getDamage: (lc) => lc.bashDmg,
        execute(state, levelConfig) {
          const strippedArmor = state.player.armor;
          state.player.armor = 0;
          const dmg = levelConfig.bashDmg;
          applyEnemyAttackDamage(state, { name: 'Armour Shatter', damage: dmg });
          log(`<span class="log-enemy">🔨 Golem shatters your armour! Stripped ${strippedArmor} armor.</span>`);
        },
      },
    },
  },
};
