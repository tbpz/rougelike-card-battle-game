'use strict';

/* ══════════════════════════════════════════
   UI — Battle Logger
   Centralizes all battle-log DOM operations.
   No game logic here.
══════════════════════════════════════════ */

let logEl;

/**
 * Appends an HTML string as a new log entry to the battle log.
 * @param {string} html - HTML content for the log entry
 */
function log(html) {
  if (!logEl) logEl = document.getElementById('turn-log');
  const entry = document.createElement('div');
  entry.className = 'log-entry';
  entry.innerHTML = html;
  logEl.appendChild(entry);
  logEl.scrollTop = logEl.scrollHeight;
}

/**
 * Appends a styled turn-header divider to the battle log.
 * @param {number} turn - Current turn number
 * @param {object} intent - The enemy's current intent object
 */
function logTurnHeader(turn, intent) {
  if (!logEl) logEl = document.getElementById('turn-log');
  const header = document.createElement('div');
  header.className = 'log-turn-header';
  header.innerHTML = `— Turn ${turn} — Golem intends: ${intent.icon} ${intent.name}${intent.damage > 0 ? ` (${intent.damage} dmg)` : ''} —`;
  logEl.appendChild(header);
  logEl.scrollTop = logEl.scrollHeight;
}
