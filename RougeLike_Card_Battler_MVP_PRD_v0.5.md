# GAME DESIGN DOCUMENT: PROJECT: LOGIC ECHO (MVP v0.6)

> **Changelog from v0.5:** Added 'Spoils of War' Deck Growth (drafting phase after victories). Added 8 new horizontal-progression cards. Introduced 'Blood Surge' systemic action-economy extension as a new Blood Priest Boon.

---

## 1. SYSTEM OVERVIEW

The core loop centers on a restricted action economy to increase tactical depth and forced decision-making.

* **The Vow Mechanic (Dynamic Action Economy):**
    * **Draw Phase:** Player draws **5 cards** from the deck at the start of each turn.
    * **Action Phase:** Player **selects** up to their **Action Capacity** (Base 3), then confirms by pressing **"Play Selected"**. Action Capacity can be dynamically increased mid-turn via specific Boons (e.g., Blood Surge).
    * **Discard Phase:** The remaining cards are automatically **discarded** at the end of the turn.
* **Exhaust Penalty (NEW in v0.4):** High-value cards ([Blood Trade], [Insight]) are **Exhausted** (permanently removed for the rest of the level) if they are discarded unplayed at the end of the turn. This forces players to either use them immediately or lose them.
* **Deck Cycle (The Reshuffle Loop):** When the Draw Pile is empty, the Discard Pile is shuffled to form a new Draw Pile. (Exhausted cards are *not* reshuffled).

---

## 2. UI & UX MECHANICS

### 2.1 Card Selection Flow
The player uses a **two-step confirmation** system to play cards:

1. **Click to Stage:** Clicking a card toggles it into a "staged" state, highlighted with a numbered badge indicating play order (1, 2, 3).
2. **FIFO Overflow:** If a card is clicked while the maximum allowance (3 minus cards already played) is staged, the **oldest** staged card is automatically de-staged to make room.
3. **"Play Selected" Button:** A confirmation button appears only when at least one card is staged. Pressing it plays all staged cards **in the order they were selected**, then hides itself.
4. **"End Turn" Lock:** The "End Turn" button is **disabled** until exactly 3 cards have been played.

### 2.2 Deck Information Glossary (NEW in v0.5)
* At the bottom of the screen, the counters for **Draw**, **Discard**, and **Exhaust** piles are fully interactive. 
* Clicking any of these terms opens a **Glossary Modal** that defines the pile mechanics and provides a visual list of all cards currently residing in that corresponding pile.

### 2.3 On-Demand Rules Reference (NEW in v0.5)
* Players can click the **Info (ℹ️) Button** located next to the Level Indicator at the top of the screen to re-open the Level Rules overlay mid-battle.
* This allows players to review complex intents or level-specific mechanics without losing their current battle progress.

---

## 3. THE CARD CATALOG

Base values are listed. Boon interactions are documented in Section 6.

| Card Name | Type | Base Effect |
| :--- | :--- | :--- |
| **[Strike]** | Attack | Deal **6 damage**. |
| **[Defend]** | Defense | Gain **6 Armor** (blocks incoming damage; expires at the start of the next turn). |
| **[Blood Trade]** | Blood | Deal **12 damage**. Lose **3 to 7 HP** instantly (scales with level). Generates **1 Blood Debt**. **Exhausts** if discarded unplayed. |
| **[Insight]** | Buff | Multiply the damage of all subsequent attack cards played **this turn** by ×1.5. **Exhausts** if discarded unplayed. |

### 3.1 Draftable Cards (Spoils of War Pool)
These cards do not appear in the starting deck. They are exclusively drafted during the post-game Spoils of War sequence (horizontal progression).

| Card Name | Type | Effect |
| :--- | :--- | :--- |
| **[Adrenaline]** | Skill | Draw 2 cards. |
| **[Transfusion]** | Skill | Heal 8 HP. Increases Blood Debt by 1. |
| **[Scavenge]** | Skill | Return 1 random card from Exhaust Pile to your hand. **Exhausts** on play. |
| **[Blood Shield]** | Defense | Gain 12 Armor. Lose 4 HP (true damage). |
| **[Absolution]** | Skill | Remove 1 Blood Debt. **Exhausts** on play. |
| **[Martyr]** | Attack | Deal damage equal to **4× your Blood Debt**. |
| **[Leech Strike]** | Attack | Deal 4 damage. Heal 4 HP. |
| **[Shield Bash]** | Attack | Deal damage equal to your **Current Armor**. Remove all Armor. |

### Blood Debt Mechanic (NEW in v0.4)

Playing [Blood Trade] generates **Blood Debt**. At the start of every player turn, the player takes true damage equal to their current Blood Debt total. Debt persists for the entire level. Spamming Blood Trade rapidly accelerates this turn-over-turn damage. 

---

## 4. ENEMY AI: THE ANCIENT GOLEM

The Golem follows an **Intent Pattern** defined per level, switching to a **Terminal Intent** when low on health.

### Standard Phase (HP > Enrage Threshold)
* **Bash** – Deal damage. (Forces a choice between full mitigation or chip damage).
* **Shatter** – Deal heavy damage. (Requires two [Defend] cards to fully block).
* **Recharge** – 0 damage. (A safe window for the player to set up combos). *(Level 1 only)*
* **Shield** – Gains Armor (between 8 and 12 depending on level) that absorbs incoming damage. *(Levels 3–5 only)*

### Enrage Phase (HP ≤ Enrage Threshold)
Once the Golem's HP drops to or below the enrage threshold **at the start of the player's turn**, it abandons the loop.
* **Intent: Fatal Strike** – Deal massive fixed damage (up to 28) every turn until the battle ends.
* **Design Goal:** Creates an escalating "Damage Race" forcing the player to burst down the boss.

---

## 5. THE 5-LEVEL DIFFICULTY LADDER (REVISED in v0.4)

> Difficulty scales aggressively. The Golem gains more HP, enrages earlier (at higher HP values), hits harder during enrage, and uses Shield to blunt player burst combos. [Blood Trade] also costs more HP to play at higher levels.

| Level | Name | Player HP | Enemy HP | Bash | Shatter | Intent Cycle | Enrage At | Fatal Strike | Blood Trade Cost |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **1** | The Awakening | 35 | 35 | 5 | 8 | Bash→**Recharge**→Shatter | ≤10 | 10 | 3 HP |
| **2** | Calibrated Pressure | 30 | 60 | 8 | 12 | Bash→Shatter→**Bash** | ≤22 | 15 | 4 HP |
| **3** | The Relentless | 28 | 75 | 9 | 14 | Bash→Shatter→Bash→**Shield(8)** | ≤34 | 18 | 5 HP |
| **4** | Iron Vow | 25 | 85 | 10 | 15 | Bash→Shatter→Bash→**Shield(10)** | ≤47 | 22 | 6 HP |
| **5** | The Final Vow | 22 | 100 | 11 | 16 | Bash→Shatter→Bash→**Shield(12)** | ≤65 | 28 | 7 HP |

---

## 6. META-PROGRESSION: DECK GROWTH & BOONS

After clearing each level (except the last), the player enters the Meta-Progression Phase.

### 6.1 Spoils of War (Deck Growth)
The player is presented with a Draft Modal containing **3 Random Cards** pulled from the Draftable Card Pool. The player must permanently add exactly **1 Card** to their `globalRunDeck`. This ensures the deck evolves organically across the 5 levels, enabling new systemic combo interactions.

### 6.2 Archetypes & Boons
After drafting a card, the player chooses **one Boon** from a random pair. Boons carry through all subsequent levels.

### 6.1 Player Archetypes

| Archetype | Glyph | Design Philosophy |
| :--- | :---: | :--- |
| **Berserker** | ⚔️ | Aggression builds momentum. Leans into high-damage burst and low-HP synergies. |
| **Blood Priest** | 🩸 | Sacrifice fuels power. Leans into Blood Trade risk/reward cycles and Insight amplification. |
| **Iron Sentinel** | 🛡️ | Defense is offense. Leans into armor stacking and reactive counterattack damage. |

### 6.2 Boons Catalog (REVISED in v0.4)

#### Berserker Boons
| Boon | Glyph | Effect |
| :--- | :---: | :--- |
| **Momentum** | ⚡ | The **3rd card played** in a turn deals ×1.5 damage. Stacks with Insight. |
| **Vampiric Strike** | 💖 | If you play **exactly 3 [Strike] cards** in a turn, heal **3 HP**. |
| **Bloodlust** | 🔥 | [Strike] deals **+3 damage** if your HP is at or below **50%** of max HP. |
| **War Tax** | ⚖️ | Every time **you lose HP** (from any source), deal **2 damage** to the Golem. |

#### Blood Priest Boons
| Boon | Glyph | Effect |
| :--- | :---: | :--- |
| **Thick Blood** | 🩸 | [Blood Trade] self-damage costs **2 fewer HP**. The **first** [Blood Trade] played each turn generates **no Blood Debt**. |
| **Enduring Insight** | ✨ | [Insight]'s ×1.5 multiplier persists for **2 turns** instead of 1. |
| **Hemorrhage** | 🥀 | [Blood Trade] deals **+4 damage**, but generates **2 Blood Debt** markers instead of 1. |
| **Blood Surge** | 💉 | **Unlocks at Level 3.** Unlocks a glowing UI button to artificially extend Action Capacity. Pay 1 Blood Debt for **+1 Action** this turn. Limit 1 use per turn. |
| **Last Rites** | ⚰️ | **Once per run:** Survive a killing blow at **1 HP** instead of dying. Consumed on use. |

#### Iron Sentinel Boons
| Boon | Glyph | Effect |
| :--- | :---: | :--- |
| **Spiked Armor** | 🛡️ | Playing [Defend] deals **3 damage** to the Golem immediately. |
| **Fortress** | 🏰 | [Defend] grants **8 Armor** instead of 6. |
| **Thorns** | 🌵 | Whenever you **lose HP to an enemy attack**, deal **3 damage** to the Golem. |
| **Grit** | 💪 | At the **start of each turn**, gain **3 Armor** before drawing. |

---

## 7. WIN / LOSS CONDITIONS

* **Win (Level):** Reduce the Golem's HP to 0 before it kills the player.
* **Win (Run):** Defeat all 5 levels in sequence.
* **Lose:** Player HP reaches 0 after all survival effects (e.g., Last Rites) have resolved. (This includes dying to Blood Debt at the start of a turn).
