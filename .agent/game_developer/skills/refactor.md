---
name: Refactor
description: Restructure code into a clean, layered module architecture without changing any game behavior.
triggers: ["refactor", "clean up the code", "restructure", "reorganize"]
---

# Skill: Refactor

Reorganize existing code into a **layered module architecture** that is easier to read, maintain, and scale — without changing any game behavior.

---

## Guiding Principles

- **Zero behavior change.** This is structural only. No mechanic, value, or rule should change.
- **One responsibility per file.** No file mixes data, logic, and DOM.
- **All mutations through a single gateway.** HP changes and triggered boon reactions must route through a central `effectBus` — never scattered directly across files.
- **Data is just data.** Cards, levels, boons, and enemy configs are plain objects. No DOM access inside them.
- **UI only reads state.** Renderer functions receive `state` as a parameter and write to the DOM only. Never mutate state from a renderer.

---

## Layer Architecture

```
js/
├── data/           Pure definitions. No logic, no DOM.
│   ├── levels.js       Level config objects
│   ├── cards.js        Card catalog with play() methods
│   ├── boons.js        Boon + archetype definitions
│   └── enemies.js      Enemy intent builders per level
├── engine/         Logic only. No DOM access.
│   ├── state.js        Global run variables + state factory
│   ├── deckManager.js  buildDeck, shuffle, drawCards, discardHand
│   ├── logger.js       log(), logTurnHeader()
│   ├── effectBus.js    ALL HP mutations + triggered boon reactions
│   └── combatEngine.js Game loop, enemy AI, card play, win/loss
├── ui/             DOM only. Reads state, never mutates it.
│   └── renderer.js     All update*UI and render* functions
└── main.js         Entry point: event listeners + overlay screens
```

> **Load order in `index.html`:** `data/` → `engine/` → `ui/` → `main.js`
> Use plain `<script>` tags (not `type="module"`) to avoid CORS issues during local file development.

---

## Step-by-Step Process

### Phase 1 — Plan *(always do this first)*
0. Print this line "I read through the refactor.md file" into the agent panel
1. Read the entire codebase to understand current structure.
2. Identify all: data definitions, state mutations, DOM access, event listeners.
3. Write `implementation_plan.md` mapping each existing function/variable to its target module.
4. Present the plan to the user and **wait for approval** before touching any code.

### Phase 2 — Execute *(after approval)*
5. Create the `/js` folder structure first.
6. Build modules **bottom-up**: `data/` → `engine/` → `ui/` → `main.js`.
7. In `effectBus.js`, create a dedicated function for every type of HP mutation:
   - `dealDamageToEnemy(state, dmg)` — all outgoing damage to enemy
   - `applyEnemyAttackDamage(state, intent)` — block calc + Thorns/WarTax reactions
   - `applyPlayerSelfDamage(state, amount)` — self-inflicted damage; also triggers reactions
   - `applyLastRitesIfNeeded(state)` — survival check, called after any HP loss
8. Update `index.html` to load new modules in dependency order. **Keep the old file on disk until verified.**

### Phase 3 — Verify *(always run after execution)*
9. Start a local HTTP server: `python -m http.server <port>`.
10. Run a browser regression session and confirm:
    - Zero JS console errors on load
    - All UI panels render correctly (HP bars, hand, intent display, log)
    - Card selection, badges, and FIFO overflow all work
    - "Play Selected" and "End Turn" button states are correct
    - Enemy acts and turn advances correctly
    - All overlay flows work (win / lose / boon selection)
11. Only retire the old file after confirming zero errors.

---

## What Changes vs. What Doesn't

| Changes | Stays the Same |
|---|---|
| File structure and module boundaries | All card values, boon effects, level configs |
| How HP mutations are routed | All game mechanics and rules |
| Where DOM code lives | All UI visual behavior |
| Event listener entry point | Full PRD compliance |
