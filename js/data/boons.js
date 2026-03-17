'use strict';

/* ══════════════════════════════════════════
   DATA — Archetypes & Boons Catalog
   Pure data definitions. No logic here.
   Adding a new boon = adding one entry to BOONS_CATALOG.
══════════════════════════════════════════ */

const ARCHETYPES = {
  berserker:    { id: 'berserker',    name: 'Berserker',     glyph: '⚔️', desc: 'Embrace aggression. Boons favor striking hard and living on the edge.' },
  bloodPriest:  { id: 'bloodPriest',  name: 'Blood Priest',  glyph: '🩸', desc: 'Embrace sacrifice. Boons favor massive damage spikes and self-harm.' },
  ironSentinel: { id: 'ironSentinel', name: 'Iron Sentinel', glyph: '🛡️', desc: 'Embrace endurance. Boons favor impenetrable armor and counter-attacks.' }
};

const BOONS_CATALOG = {
  // ── Berserker ─────────────────────────────────────────
  momentum:       { archetype: 'berserker',    name: 'Momentum',        glyph: '⚡', desc: 'The 3rd card played in a turn has a ×1.5 damage multiplier.' },
  vampiricStrike: { archetype: 'berserker',    name: 'Vampiric Strike',  glyph: '💖', desc: 'If you play exactly 3 [Strike] cards in a turn, heal 3 HP.' },
  bloodlust:      { archetype: 'berserker',    name: 'Bloodlust',        glyph: '🔥', desc: '[Strike] deals +3 damage if your HP is at or below 50%.' },
  warTax:         { archetype: 'berserker',    name: 'War Tax',          glyph: '⚖️', desc: 'Every time you lose HP, deal 2 damage to the Golem.' },

  // ── Blood Priest ──────────────────────────────────────
  thickBlood:     { archetype: 'bloodPriest',  name: 'Thick Blood',      glyph: '🩸', desc: '[Blood Trade] costs 1 HP instead of 3.' },
  enduringInsight:{ archetype: 'bloodPriest',  name: 'Enduring Insight', glyph: '✨', desc: '[Insight] lasts for two turns instead of one.' },
  hemorrhage:     { archetype: 'bloodPriest',  name: 'Hemorrhage',       glyph: '🥀', desc: '[Blood Trade] deals +4 damage.' },
  lastRites:      { archetype: 'bloodPriest',  name: 'Last Rites',       glyph: '⚰️', desc: 'Once per run, survive a killing blow at 1 HP.' },

  // ── Iron Sentinel ─────────────────────────────────────
  spikedArmor:    { archetype: 'ironSentinel', name: 'Spiked Armor',     glyph: '🛡️', desc: 'Playing [Defend] deals 3 damage to the Golem.' },
  fortress:       { archetype: 'ironSentinel', name: 'Fortress',         glyph: '🏰', desc: '[Defend] grants 8 Armor instead of 6.' },
  thorns:         { archetype: 'ironSentinel', name: 'Thorns',           glyph: '🌵', desc: 'Whenever you lose HP to an enemy attack, deal 3 damage to the Golem.' },
  grit:           { archetype: 'ironSentinel', name: 'Grit',             glyph: '💪', desc: 'At the start of each turn, gain 3 Armor.' },
};
