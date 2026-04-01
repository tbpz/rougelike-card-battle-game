'use strict';

/* ══════════════════════════════════════════
   UI — Overlay Manager
   Manages all between-battle screen overlays:
   intro/rules, card draft, and boon selection.
   Extracted from main.js — these are UI concerns,
   not entry-point concerns.

   Depends on: RunState (state.js), LEVELS (levels.js),
               BOONS_CATALOG (boons.js), CARD_CATALOG (cards.js),
               deckManager.js (getDraftChoices, addCardToRunDeck)
══════════════════════════════════════════ */

/**
 * Shows and populates the level intro/rules overlay.
 * Rebuilds its content each time so it reflects the current level.
 * @param {boolean} [isReopen=false] - True when reopening during a battle (rules button)
 */
function showIntroOverlay(isReopen = false) {
  const overlay     = document.getElementById('intro-overlay');
  const levelConfig = LEVELS[RunState.levelIndex];

  const rulesHtml = levelConfig.rules.map(r => `<div class="rule-item">${r}</div>`).join('');

  const modal   = document.getElementById('intro-modal');
  const btnText = isReopen ? 'Resume Battle' : 'Begin the Battle';

  modal.innerHTML = `
    <h2 class="intro-title">${levelConfig.title}</h2>
    <p class="intro-flavour">${levelConfig.flavor}</p>
    <div class="intro-rules">
      ${RunState.levelIndex === 0 ? `<div class="rule-item" style="color:#aaa;"><em>Reminder: You draw 5 cards, but may only play 3.</em></div>` : ''}
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
 * Shows the Spoils of War Deck Growth selection overlay.
 * Presents 3 distinct cards to draft permanently into the run deck.
 */
function showDraftSelection() {
  const overlay   = document.getElementById('draft-overlay');
  const container = document.getElementById('draft-options-container');

  const options = getDraftChoices(3);

  if (options.length === 0) {
    showBoonSelection();
    return;
  }

  container.innerHTML = '';
  options.forEach(cardId => {
    const card = CARD_CATALOG[cardId];
    const el   = document.createElement('div');
    el.className = 'card';
    el.style.transform = 'scale(1.1)';
    el.style.margin    = '10px 15px';
    el.dataset.type    = card.type;

    el.innerHTML = `
      <div class="card-glyph">${card.glyph}</div>
      <div class="card-name">${card.name}</div>
      <div class="card-effect">${card.getEffectText()}</div>
      <div class="card-type-bar"></div>
    `;

    el.onclick = () => {
      addCardToRunDeck(cardId);
      log(`<span class="log-buff">Drafted [${card.name}] permanently into the deck.</span>`);
      overlay.classList.add('hidden');
      updateDeckUI(state);
      showBoonSelection();
    };

    container.appendChild(el);
  });

  const skipBtn = document.getElementById('skip-draft-btn');
  if (skipBtn) {
    skipBtn.onclick = () => {
      log(`<span class="log-system">Skipped draft to keep the deck lean.</span>`);
      overlay.classList.add('hidden');
      showBoonSelection();
    };
  }

  overlay.classList.remove('hidden');
}

/**
 * Shows the between-level boon selection overlay.
 * Picks 2 random un-owned boons for the player to choose from.
 */
function showBoonSelection() {
  const overlay   = document.getElementById('boon-overlay');
  const container = document.getElementById('boon-options-container');

  const available = Object.keys(BOONS_CATALOG).filter(k => {
    if (RunState.playerBoons.includes(k)) return false;
    // Lock Blood Surge until Level 3 (index 2)
    if (k === 'bloodSurge' && RunState.levelIndex < 2) return false;
    return true;
  });
  const options = shuffle(available).slice(0, 2);

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
      RunState.playerBoons.push(boonId);
      overlay.classList.add('hidden');
      updateActiveBoonsUI();
      showIntroOverlay();
    };
    container.appendChild(el);
  });

  overlay.classList.remove('hidden');
}
