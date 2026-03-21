'use strict';

/* ══════════════════════════════════════════
   ENTRY POINT — main.js
   Bootstraps the game: wires event listeners,
   manages overlay screens (intro, boon selection).
   This is the only file that responds to user input events.
══════════════════════════════════════════ */

// ─── Game Init ─────────────────────────────────────────

/**
 * Initializes (or re-initializes) a battle for the current level.
 * Resets state, builds & shuffles the deck, then starts the first turn.
 */
function initGame() {
  const levelConfig = LEVELS[globalLevelIndex];

  logEl = document.getElementById('turn-log');
  logEl.innerHTML = `
    <div class="log-entry" style="color: var(--blue-light); text-align: center; margin-bottom: 8px; font-weight: 600;">
      :: Beginning ${levelConfig.title} ::
    </div>
  `;

  state = createInitialState(levelConfig);
  state.deck.drawPile = shuffle(buildDeck(levelConfig));

  // Reset enrage visual from previous battle
  document.getElementById('enemy-panel').classList.remove('enraged');
  document.getElementById('result-overlay').classList.add('hidden');

  startTurn(state);
}

// ─── Overlay Screens ───────────────────────────────────

/**
 * Shows and populates the level intro/rules overlay.
 * Rebuilds its content each time so it reflects the current level.
 */
function showIntroOverlay(isReopen = false) {
  const overlay     = document.getElementById('intro-overlay');
  const levelConfig = LEVELS[globalLevelIndex];

  const rulesHtml = levelConfig.rules.map(r => `<div class="rule-item">${r}</div>`).join('');

  const modal = document.getElementById('intro-modal');
  const btnText = isReopen ? 'Resume Battle' : 'Begin the Battle';

  modal.innerHTML = `
    <h2 class="intro-title">${levelConfig.title}</h2>
    <p class="intro-flavour">${levelConfig.flavor}</p>
    <div class="intro-rules">
      ${globalLevelIndex === 0 ? `<div class="rule-item" style="color:#aaa;"><em>Reminder: You draw 5 cards, but may only play 3.</em></div>` : ''}
      ${rulesHtml}
    </div>
    <button id="start-btn" class="btn-primary">${btnText}</button>
  `;

  // Re-attach click listener since we replaced the innerHTML
  document.getElementById('start-btn').addEventListener('click', () => {
    overlay.classList.add('hidden');
    if (!isReopen) {
      initGame();
    }
  });

  overlay.classList.remove('hidden');
}

/**
 * Shows the between-level boon selection overlay.
 * Picks 2 random un-owned boons for the player to choose from.
 */
function showBoonSelection() {
  const overlay   = document.getElementById('boon-overlay');
  const container = document.getElementById('boon-options-container');

  const available = Object.keys(BOONS_CATALOG).filter(k => !globalPlayerBoons.includes(k));
  const options   = shuffle(available).slice(0, 2);

  if (options.length === 0) {
    // No boons left to offer — skip straight to next level intro
    showIntroOverlay();
    return;
  }

  container.innerHTML = '';
  options.forEach(boonId => {
    const boon = BOONS_CATALOG[boonId];
    const el   = document.createElement('div');
    el.className = 'boon-card';
    el.innerHTML = `
      <div class="boon-glyph">${boon.glyph}</div>
      <div class="boon-name">${boon.name}</div>
      <div class="boon-desc">${boon.desc}</div>
    `;
    el.onclick = () => {
      globalPlayerBoons.push(boonId);
      overlay.classList.add('hidden');
      updateActiveBoonsUI();
      showIntroOverlay();
    };
    container.appendChild(el);
  });

  overlay.classList.remove('hidden');
}

// ─── Event Listeners ───────────────────────────────────

document.getElementById('btn-show-rules').addEventListener('click', () => {
  showIntroOverlay(true);
});

document.getElementById('play-selected-btn').addEventListener('click', () => {
  if (state.phase !== 'player') return;
  if (state.selectedCards.length === 0) return;
  playSelectedCards();
});

document.getElementById('end-turn-btn').addEventListener('click', () => {
  if (state.phase !== 'player') return;
  if (state.cardsPlayedThisTurn < 3) return; // safety guard
  endTurn(state);
});

// ─── Glossary Events ───
document.getElementById('term-draw').addEventListener('click', () => {
  if (state && state.deck) showDeckGlossary('drawPile');
});
document.getElementById('term-discard').addEventListener('click', () => {
  if (state && state.deck) showDeckGlossary('discardPile');
});
document.getElementById('term-exhaust').addEventListener('click', () => {
  if (state && state.deck) showDeckGlossary('exhaustPile');
});
document.getElementById('close-glossary-btn').addEventListener('click', () => {
  hideDeckGlossary();
});

// ─── Boot ──────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  showIntroOverlay();
});
