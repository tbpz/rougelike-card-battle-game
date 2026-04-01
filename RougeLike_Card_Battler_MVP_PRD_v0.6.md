# GAME DESIGN DOCUMENT: PROJECT: LOGIC ECHO (MVP v0.7)

> **Changelog from v0.6:** 
> 1. **Architectural Refactor**: Transitioned to a strictly layered module architecture (Data → Engine → UI → Entry).
> 2. **State Management**: Encapsulated global run variables into a centralized `RunState` object.
> 3. **8-Level Synchronisation**: Updated documentation to match the implemented 8-level difficulty ladder and tiered card draft pools.
> 4. **Effect Bus Hardening**: Centralized all HP mutations and visual signaling via the Effect Bus, removing direct DOM access from logic layers.

---

## 1. SYSTEM OVERVIEW

The core loop centers on a restricted action economy to increase tactical depth and forced decision-making.

* **The Vow Mechanic (Dynamic Action Economy):**
    * **Draw Phase:** Player draws **5 cards** from the deck at the start of each turn.
    * **Action Phase:** Player **selects** up to their **Action Capacity** (Base 3), then confirms by pressing **"Play Selected"**. Action Capacity can be dynamically increased mid-turn via specific Boons (e.g., Blood Surge).
    * **Discard Phase:** The remaining cards are automatically **discarded** at the end of the turn.
* **Exhaust Penalty:** High-value cards ([Blood Trade], [Insight]) are **Exhausted** (permanently removed for the rest of the battle) if they are discarded unplayed at the end of the turn. This forces players to either use them immediately or lose them.
* **Deck Cycle:** When the Draw Pile is empty, the Discard Pile is shuffled to form a new Draw Pile. (Exhausted cards are *not* reshuffled).

---

## 2. UI & UX MECHANICS

### 2.1 Card Selection Flow
The player uses a **two-step confirmation** system to play cards:

1. **Click to Stage:** Clicking a card toggles it into a "staged" state, highlighted with a numbered badge indicating play order (1, 2, 3).
2. **VP Enforcement:** Cards cannot be staged if their VP cost exceeds the remaining turn allowance.
3. **"Play Selected" Button:** A confirmation button appears only when at least one card is staged. Pressing it plays all staged cards in selection order.
4. **"End Turn" Lock:** The "End Turn" button is **disabled** if the player has unspent VP and affordable cards in hand (anti-misclick protection).

### 2.2 Deck Information Glossary
* Terminology for **Draw**, **Discard**, and **Exhaust** piles is interactive. Clicking opens a **Glossary Modal** with pile mechanics and a visual card list.

### 2.3 On-Demand Rules Reference
* Players can click the **Info (ℹ️) Button** to re-open the Level Rules overlay mid-battle to check enemy patterns or level-specific mechanics.

---

## 3. THE CARD CATALOG

### 3.1 Starting Deck
| Card Name | Type | Base Effect |
| :--- | :--- | :--- |
| **[Strike]** | Attack | Deal **6 damage**. |
| **[Defend]** | Defense | Gain **6 Armor**. |
| **[Blood Trade]** | Blood | Deal **12 damage**. Lose **2 HP**. Generates **1 Blood Debt**. **Exhausts** if discarded. |
| **[Insight]** | Buff | Attack cards deal ×1.5 damage. **Exhausts** if discarded. |

### 3.2 Draftable Cards (Tiered Pool)
Cards are unlocked based on the current level reached.

| Tier | Card | Effect |
| :---: | :--- | :--- |
| **1** | [Adrenaline] | Draw 2 cards. (0 VP) |
| **1** | [Leech Strike] | Deal 4 damage. Heal 4 HP. |
| **1** | [Blood Shield] | Gain 12 Armor. Lose 4 HP. |
| **1** | [Foresight] | Peek top 3 of draw pile, add 1 to hand. |
| **1** | [Shatter Guard]| Deal damage = Armor. Set Armor to 3. |
| **1** | [Opening Gambit]| Draw 2 if first card, else draw 1. (0 VP) |
| **2** | [Execution] | Deal 4 damage. Deals 12 if played last. |
| **2** | [Ritual Blade]| Deal 3 damage per card played before this. |
| **2** | [Echo] | Next card played fires twice. (2 VP) |
| **2** | [Desperation]| Deal damage equal to missing HP. |
| **2** | [Hollow Guard]| Gain 3 Armor per Debt. +1 Debt. |
| **2** | [Overflow] | Deal 5 damage. Pierces Armor if player has 10+ Armor. |
| **3** | [All In] | Deal 20 damage. End turn immediately. (0 VP) |
| **3** | [Life Tap] | Lose 4 HP. Gain +2 VP this turn. (0 VP) |
| **3** | [Smolder] | Deal 3 damage now, 6 at start of next turn. |
| **3** | [Crimson Tide]| Deal 3 damage per Blood Debt. (2 VP) |
| **3** | [Volatile Flask]| Chaotic: 18/12/6 dmg to enemy, 0/3/6 self dmg. |
| **3** | [Penance] | Remove all Blood Debt. Take 2 damage per Debt. |
| **4** | [Transfusion] | Heal 8 HP. +1 Debt. |
| **4** | [Scavenge] | Return 1 card from Exhaust to hand. |
| **4** | [Absolution] | Remove 1 Blood Debt. |
| **4** | [Martyr] | Deal 4 damage per Blood Debt. |
| **4** | [Blood Tithe] | Remove up to 2 Debt. Pay 5 HP per Debt. |
| **4** | [Shield Bash] | Deal damage = Armor. Remove all Armor. |

---

## 4. ENEMY AI: THE ANCIENT GOLEM

The Golem uses weighted intent pools and priority overrides to adapt to player behavior.

### Standard Intents
* **Bash** – Deal fixed damage.
* **Shatter** – Deal heavy damage.
* **Shield** – Gain Armor.
* **Recharge** – No damage (lower level window).

### Survival Overrides
* **Enrage Phase:** Triggered at specific HP thresholds. The Golem enters a permanent cycle of **Fatal Strike** (high damage, no rest).

---

## 5. THE 8-LEVEL CAMPAIGN LADDER

Difficulty scales through HP increases, earlier enrage triggers, and more punishing intent pools.

| Level | Name | Enemy HP | Bash | Shatter | Enrage At | Fatal Strike | Shield |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **1** | The Awakening | 30 | 3 | 5 | ≤8 | 6 | — |
| **2** | First Blood | 40 | 5 | 8 | ≤10 | 8 | — |
| **3** | Calibrated Pressure | 55 | 7 | 12 | ≤15 | 12 | 6 |
| **4** | The Crucible | 65 | 8 | 14 | ≤18 | 14 | 8 |
| **5** | The Relentless | 75 | 9 | 15 | ≤28 | 16 | 8 |
| **6** | Blood Meridian | 85 | 10 | 16 | ≤35 | 18 | 10 |
| **7** | Iron Vow | 95 | 11 | 18 | ≤45 | 22 | 10 |
| **8** | The Final Vow | 110 | 12 | 20 | ≤60 | 26 | 12 |

---

## 6. META-PROGRESSION & BOONS

### 6.1 Spoils of War
After clearing each level, players draft **1 of 3** random tiered cards into their permanent deck.

### 6.2 Boons Catalog
| Archetype | Glyph | Boon | Effect |
| :--- | :---: | :--- | :--- |
| **Berserker** | ⚔️ | Momentum | 3rd card deals ×1.5 damage. |
| | | Vampiric Strike| Play 3 Strikes → Heal 3 HP. |
| | | Bloodlust | Strikes deal +3 dmg at ≤50% HP. |
| | | War Tax | Take dmg → Return 2 dmg to Golem. |
| **Blood Priest** | 🩸 | Thick Blood | -2 HP cost on Blood Trade. 1st play = no Debt. |
| | | Enduring Insight| Insight lasts 2 turns. |
| | | Hemorrhage | +4 dmg on Blood Trade. +2 Debt gain. |
| | | Blood Surge | Pay 1 Debt for +1 Action (Limit 1/turn). |
| | | Last Rites | Survive a killing blow at 1 HP (1/run). |
| **Iron Sentinel** | 🛡️ | Spiked Armor | Playing Defend deals 3 damage. |
| | | Fortress | Defend grants 8 Armor. |
| | | Thorns | Lose HP to attack → Return 3 damage. |
| | | Grit | Start of turn: Gain 3 Armor. |
| | | Plated Armor | Retain 50% of Armor at start of turn. |

---

## 7. WIN / LOSS CONDITIONS

* **Win (Level):** Reduce Golem HP to 0.
* **Win (Run):** Clear all 8 levels.
* **Lose:** Player HP reaches 0 (including dying to Blood Debt tick).

---

## 8. TECHNICAL ARCHITECTURE (NEW in v0.7)

Logic Echo utilizes a strictly **Layered Module Architecture** to ensure maintainability and separation of concerns.

1.  **Data Layer (`js/data/`)**: Pure configuration files (cards, boons, enemies, levels). No logic.
2.  **Engine Layer (`js/engine/`)**: Pure logic modules. No DOM access. 
    *   `effectBus.js`: Central gateway for all HP mutations and game-logic reactions.
    *   `state.js`: Single source of truth via the battle-scoped `state` and run-scoped `RunState` objects.
3.  **UI Layer (`js/ui/`)**: Pure rendering. Reads state and updates the DOM.
    *   Uses a **Pending Effects** pattern to execute visual animations signaled by the engine.
4.  **Entry Layer (`main.js`)**: Orchestrates event listeners and boots the game.
