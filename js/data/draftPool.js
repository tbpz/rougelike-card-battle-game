'use strict';

/* ══════════════════════════════════════════
   DATA — Draft Pool Tiers
   Defines which cards become available to draft
   at each tier. Tier N unlocks after clearing
   level N (approximately every 2 levels).
   Consumed by deckManager.getDraftChoices().
══════════════════════════════════════════ */

// Tier N becomes available to draft after Level N is cleared.
// L1/L2 → Tier 1, L3/L4 → Tier 2, L5/L6 → Tier 3, L7 → Tier 4
const DRAFT_TIERS = {
  1: ['openingGambit', 'leechStrike', 'adrenaline', 'foresight', 'bloodShield', 'shatterGuard'],
  2: ['execution', 'ritualBlade', 'echo', 'desperation', 'hollowGuard', 'overflow'],
  3: ['allIn', 'lifeTap', 'smolder', 'crimsonTide', 'volatileFlask', 'penance'],
  4: ['bloodTithe', 'scavenge', 'absolution', 'transfusion', 'martyr', 'shieldBash'],
};
