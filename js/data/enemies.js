'use strict';

/* ══════════════════════════════════════════
   DATA — Enemy Intent Definitions
   Intents are derived from a level config's damage values.
   Adding a new enemy type = add a new function here.
══════════════════════════════════════════ */

/**
 * Builds the intent object map for a given level config.
 * @param {object} levelConfig - A level entry from LEVELS
 * @returns {object} Map of intent key → intent definition
 */
function getLevelIntents(levelConfig) {
  return {
    bash:        { name: 'Bash',         damage: levelConfig.bashDmg,    icon: '⚡', type: 'normal' },
    shatter:     { name: 'Shatter',      damage: levelConfig.shatterDmg, icon: '💥', type: 'normal' },
    recharge:    { name: 'Recharge',     damage: 0,                      icon: '⚙️', type: 'safe'   },
    shield:      { name: 'Shield',       damage: 0,                      icon: '🛡️', type: 'shield' },
    fatalStrike: { name: 'Fatal Strike', damage: levelConfig.fatalDmg,   icon: '☠️', type: 'enrage' },
  };
}
