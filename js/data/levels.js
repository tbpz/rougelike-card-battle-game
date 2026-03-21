'use strict';

/* ══════════════════════════════════════════
   DATA — Level Configurations
   Each object is a fully self-contained level definition.
   Adding a new level = adding one object to this array.
══════════════════════════════════════════ */

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
    cycle: ['bash', 'recharge', 'shatter'],
    bashDmg: 5, shatterDmg: 8, enrageAt: 10, fatalDmg: 10, bloodTradeCost: 3,
    deck: { strike: 4, defend: 5, bloodTrade: 2, insight: 2 }
  },
  {
    title: 'Level 2: Calibrated Pressure',
    flavor: 'The original Vow. Block carefully or be broken.',
    rules: [
      '⚖️ Standard 3/5 Vow deck ratios',
      '⚠️ Enemy prepares a massive attack. Defend or be broken.',
      '⏱️ Safe "Recharge" turn every 3rd turn',
      '⚡ Enrages at 15 HP'
    ],
    playerHp: 30, enemyHp: 60,
    cycle: ['shatter', 'bash', 'prepare'],
    bashDmg: 10, shatterDmg: 20, enrageAt: 22, fatalDmg: 15, bloodTradeCost: 4,
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
    playerHp: 28, enemyHp: 75,
    cycle: ['bash', 'shatter', 'bash', 'shield'],
    bashDmg: 9, shatterDmg: 14, enrageAt: 34, fatalDmg: 18, shieldArmor: 8, bloodTradeCost: 5,
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
    playerHp: 25, enemyHp: 85,
    cycle: ['bash', 'shatter', 'bash', 'shield'],
    bashDmg: 10, shatterDmg: 15, enrageAt: 47, fatalDmg: 22, shieldArmor: 10, bloodTradeCost: 6,
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
    playerHp: 22, enemyHp: 100,
    cycle: ['bash', 'shatter', 'bash', 'shield'],
    bashDmg: 11, shatterDmg: 16, enrageAt: 65, fatalDmg: 28, shieldArmor: 12, bloodTradeCost: 7,
    deck: { strike: 3, defend: 2, bloodTrade: 3, insight: 4 }
  }
];
