'use strict';

/* ══════════════════════════════════════════
   ENTRY POINT — main.js
   Bootstraps the game and wires all event listeners.
   This is the only file that responds to user input events.

   Overlay screens → ui/overlayManager.js
   Turn flow       → engine/turnManager.js
   Card play       → engine/cardPlayManager.js
══════════════════════════════════════════ */

// ─── Game Init ─────────────────────────────────────────

/**
 * Initializes (or re-initializes) a battle for the current level.
 * Resets state, builds & shuffles the deck, then starts the first turn.
 */
function initGame() {
  const levelConfig = LEVELS[RunState.levelIndex];

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

// ─── Event Listeners ───────────────────────────────────

document.getElementById('btn-show-rules').addEventListener('click', () => {
  showIntroOverlay(true);
});

document.getElementById('blood-surge-btn').addEventListener('click', () => {
  if (state.phase !== 'player') return;
  if (typeof triggerBloodSurge === 'function') {
    triggerBloodSurge();
  }
});

document.getElementById('play-selected-btn').addEventListener('click', () => {
  if (state.phase !== 'player') return;
  if (state.selectedCards.length === 0) return;
  playSelectedCards();
});

document.getElementById('end-turn-btn').addEventListener('click', () => {
  if (state.phase !== 'player') return;
  endTurn(state);
});

// ─── Glossary Events ───────────────────────────────────
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
