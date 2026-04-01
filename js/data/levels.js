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
      '⚡ 3 VP per turn — spend wisely',
      '📉 Enemy deals reduced damage',
      '⏱️ Safe "Recharge" turn every 3rd turn',
      '💤 Enrages at 8 HP'
    ],
    enemyHp: 30,
    enemyId: 'ancient_golem',
    baseVP: 3,
    bashDmg: 3, shatterDmg: 5, enrageAt: 8, fatalDmg: 6
  },
  {
    title: 'Level 2: First Blood',
    flavor: 'The Golem stirs. Your first real opponent.',
    rules: [
      '⚡ 3 VP per turn — spend wisely',
      '⚠️ Enemy prepares a massive attack. Defend or be broken.',
      '⏱️ Safe "Recharge" turn every 3rd turn',
      '⚡ Enrages at 10 HP'
    ],
    enemyHp: 40,
    enemyId: 'ancient_golem',
    baseVP: 3,
    bashDmg: 5, shatterDmg: 8, enrageAt: 10, fatalDmg: 8
  },
  {
    title: 'Level 3: Calibrated Pressure',
    flavor: 'The original Vow. Block carefully or be broken.',
    rules: [
      '🛡️ Enemy gains Fortify (Armor)',
      '⚠️ Enrages at 15 HP'
    ],
    enemyHp: 55,
    enemyId: 'ancient_golem',
    baseVP: 3,
    bashDmg: 7, shatterDmg: 12, enrageAt: 15, fatalDmg: 12, shieldArmor: 6
  },
  {
    title: 'Level 4: The Crucible',
    flavor: 'Survival alone won\'t save you. You need a plan.',
    rules: [
      '💀 Expect a longer battle',
      '⚠️ Enrages at 18 HP'
    ],
    enemyHp: 65,
    enemyId: 'ancient_golem',
    baseVP: 3,
    bashDmg: 8, shatterDmg: 14, enrageAt: 18, fatalDmg: 14, shieldArmor: 8
  },
  {
    title: 'Level 5: The Relentless',
    flavor: 'The Golem abandons rest. You must find your own openings.',
    rules: [
      '🚫 No "Recharge" turn (Bash → Shatter → Bash)',
      '⚠️ Enrages at 28 HP'
    ],
    enemyHp: 75,
    enemyId: 'ancient_golem',
    baseVP: 3,
    bashDmg: 9, shatterDmg: 15, enrageAt: 28, fatalDmg: 16, shieldArmor: 8
  },
  {
    title: 'Level 6: Blood Meridian',
    flavor: 'Pain is inevitable. Choose whose.',
    rules: [
      '🔥 Punishing damage numbers',
      '⚠️ Enrages at 35 HP'
    ],
    enemyHp: 85,
    enemyId: 'ancient_golem',
    baseVP: 3,
    bashDmg: 10, shatterDmg: 16, enrageAt: 35, fatalDmg: 18, shieldArmor: 10
  },
  {
    title: 'Level 7: Iron Vow',
    flavor: 'The deck floods with blood. Pain is your only fuel.',
    rules: [
      '🗡️ Lethal if unblocked',
      '☠️ Enrages at 45 HP (Half health)'
    ],
    enemyHp: 95,
    enemyId: 'ancient_golem',
    baseVP: 3,
    bashDmg: 11, shatterDmg: 18, enrageAt: 45, fatalDmg: 22, shieldArmor: 10
  },
  {
    title: 'Level 8: The Final Vow',
    flavor: 'The absolute limit. One mistake is fatal.',
    rules: [
      '🏴‍☠️ Maximum brutality',
      '☠️ Enrages at 60 HP (Over half health!)'
    ],
    enemyHp: 110,
    enemyId: 'ancient_golem',
    baseVP: 3,
    bashDmg: 12, shatterDmg: 20, enrageAt: 60, fatalDmg: 26, shieldArmor: 12
  }
];
