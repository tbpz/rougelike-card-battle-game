# GAME DESIGN DOCUMENT: PROJECT: LOGIC ECHO (MVP v0.3)

> **Changelog from v0.2:** Added meta-progression system (Archetypes + Boons), FIFO card selection with "Play Selected" confirmation, updated card catalog with boon interactions, Last Rites bug fix, and reactive damage boons (Thorns, War Tax, Spiked Armor).

---

## 1. SYSTEM OVERVIEW

The core loop centers on a restricted action economy to increase tactical depth and forced decision-making.

* **The "3/5 Vow" Mechanic:**
    * **Draw Phase:** Player draws **5 cards** from the deck at the start of each turn.
    * **Action Phase:** Player **selects** up to **3 cards**, then confirms by pressing **"Play Selected"**.
    * **Discard Phase:** The remaining cards are automatically **discarded** at the end of the turn.
* **Deck Cycle (The Reshuffle Loop):** When the Draw Pile is empty, the Discard Pile (including cards forced out by the Vow) is shuffled to form a new Draw Pile.

---

## 2. CARD SELECTION UX (NEW in v0.3)

The player no longer plays cards immediately on click. Instead, a **two-step confirmation** system is enforced:

1. **Click to Stage:** Clicking a card toggles it into a "staged" state, highlighted with a numbered badge indicating play order (1, 2, 3).
2. **FIFO Overflow:** If a 4th card is clicked while 3 are already staged, the **oldest** staged card is automatically de-staged to make room. This ensures no accidental lockout.
3. **"Play Selected" Button:** A confirmation button appears only when at least one card is staged. Pressing it plays all staged cards **in the order they were selected**, then hides itself.
4. **"End Turn" Lock:** The "End Turn" button is **disabled** until exactly 3 cards have been played. This enforces the Vow economy strictly.

| State | "Play Selected" Button | "End Turn" Button |
| :--- | :--- | :--- |
| 0 cards staged | Hidden | Disabled |
| 1–3 cards staged | Visible (`Play N Cards ✓`) | Disabled |
| 3 cards played | Hidden | **Enabled** |

---

## 3. THE CARD CATALOG

Base values are listed. Boon interactions are documented in Section 6.

| Card Name | Type | Base Effect |
| :--- | :--- | :--- |
| **[Strike]** | Attack | Deal **6 damage**. |
| **[Defend]** | Defense | Gain **6 Armor** (blocks incoming damage; expires at the start of the next turn). |
| **[Blood Trade]** | Blood | Deal **12 damage** / Lose **3 HP** (true damage to self, ignores armor). |
| **[Insight]** | Buff | Multiply the damage of all subsequent attack cards played **this turn** by ×1.5. |

---

## 4. ENEMY AI: THE ANCIENT GOLEM

The Golem follows an **Intent Pattern** defined per level, switching to a **Terminal Intent** when low on health.

### Standard Phase (HP > Enrage Threshold)
* **Bash** – Deal damage. (Forces a choice between full mitigation or chip damage).
* **Shatter** – Deal heavy damage. (Requires two [Defend] cards to fully block).
* **Recharge** – 0 damage. (A safe window for the player to set up combos). *(Levels 1–2 only)*

### Enrage Phase (HP ≤ Enrage Threshold)
Once the Golem's HP drops to or below the enrage threshold **at the start of the player's turn**, it abandons the loop.
* **Intent: Fatal Strike** – Deal fixed damage every turn until the battle ends.
* **Design Goal:** Creates a "Damage Race" forcing the player to use high-risk cards like **[Blood Trade]**.

---

## 5. THE 5-LEVEL DIFFICULTY LADDER

> Difficulty scales by tuning HP, damage values, enrage timing, enemy intent cycle, and deck composition. No new systems are introduced per level.

| Level | Name | Player HP | Enemy HP | Bash | Shatter | Intent Cycle | Enrage At | Fatal Strike | Deck Composition |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **1** | The Awakening | 35 | 35 | 5 | 8 | Bash→Shatter→**Recharge** | ≤10 | 10 | 4×Strike, **5×Defend**, 2×Blood Trade, 2×Insight |
| **2** | Calibrated Pressure | 30 | 50 | 8 | 12 | Bash→Shatter→**Recharge** | ≤15 | 15 | 4×Strike, 4×Defend, 2×Blood Trade, 2×Insight |
| **3** | The Relentless | 28 | 55 | 9 | 14 | Bash→Shatter→**Bash** | ≤20 | 16 | 4×Strike, 4×Defend, **1×Blood Trade**, 2×Insight |
| **4** | Iron Vow | 25 | 60 | 10 | 15 | Bash→Shatter→**Bash** | ≤25 | 18 | **3×Strike, 3×Defend, 3×Blood Trade**, 2×Insight |
| **5** | The Final Vow | 22 | 65 | 11 | 16 | Bash→Shatter→**Bash** | ≤30 | 20 | **3×Strike, 2×Defend, 3×Blood Trade, 4×Insight** |

### Level Design Notes

* **Level 1 — The Awakening:** Extra Defend and lower enemy stats let new players learn the Vow without punishment. No real pressure.
* **Level 2 — Calibrated Pressure:** The original PRD baseline. Shatter requires 2 Defends to fully block. Recharge gives a safe combo window.
* **Level 3 — The Relentless:** Recharge is replaced by a second Bash. No safe turn = no free combos. One fewer Blood Trade reduces burst options. Earlier enrage heightens urgency.
* **Level 4 — Iron Vow:** Deck floods with Blood Trade, forcing high-risk plays. Enrage at 25 HP means the damage race begins early.
* **Level 5 — The Final Vow:** Deck is volatile (heavy Insight). Fatal Strike at 20 is near-lethal without armor. Enrage at 30 HP means the Golem rampages with over half its HP remaining.

---

## 6. META-PROGRESSION: ARCHETYPES & BOONS (NEW in v0.3)

After clearing each level (except the last), the player chooses **one Boon** from a random pair. Boons carry through all subsequent levels, creating a unique run identity.

### 6.1 Player Archetypes

Players are assigned an archetype at run start. Boons are drawn from across all archetypes regardless of player choice (providing variety). The archetype tag is primarily cosmetic/thematic at MVP.

| Archetype | Glyph | Design Philosophy |
| :--- | :---: | :--- |
| **Berserker** | ⚔️ | Aggression builds momentum. Leans into high-damage burst and low-HP synergies. |
| **Blood Priest** | 🩸 | Sacrifice fuels power. Leans into Blood Trade risk/reward cycles and Insight amplification. |
| **Iron Sentinel** | 🛡️ | Defense is offense. Leans into armor stacking and reactive counterattack damage. |

### 6.2 Boons Catalog

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
| **Thick Blood** | 🩸 | [Blood Trade] self-damage costs **1 HP** instead of 3. |
| **Enduring Insight** | ✨ | [Insight]'s ×1.5 multiplier persists for **2 turns** instead of 1. |
| **Hemorrhage** | 🥀 | [Blood Trade] deals **+4 damage** (16 total base). |
| **Last Rites** | ⚰️ | **Once per run:** Survive a killing blow at **1 HP** instead of dying. Consumed on use. |

#### Iron Sentinel Boons

| Boon | Glyph | Effect |
| :--- | :---: | :--- |
| **Spiked Armor** | 🛡️ | Playing [Defend] deals **3 damage** to the Golem immediately. |
| **Fortress** | 🏰 | [Defend] grants **8 Armor** instead of 6. |
| **Thorns** | 🌵 | Whenever you **lose HP to an enemy attack**, deal **3 damage** to the Golem. |
| **Grit** | 💪 | At the **start of each turn**, gain **3 Armor** before drawing. |

### 6.3 Boon Interaction Matrix

Key interactions between boons and base cards for quick reference:

| Boon Combo | Result |
| :--- | :--- |
| **Insight + Momentum** | 3rd attack card deals ×2.25 damage (×1.5 × ×1.5). |
| **Insight + Enduring Insight** | [Insight] multiplier persists into the next turn (turns 2 and 3). |
| **Blood Trade + War Tax** | Self-damage triggers War Tax → 2 bonus damage to Golem per Blood Trade. |
| **Blood Trade + Thick Blood + Hemorrhage** | 16 damage for only 1 HP recoil. Maximum efficiency Blood Trade. |
| **Spiked Armor + Fortress** | [Defend] = 8 Armor + 3 damage. Stacks with Grit's free Armor. |
| **Thorns + War Tax** | Enemy hits trigger both: 3 + 2 = 5 damage returned per real hit. |
| **Last Rites + Bloodlust** | If Last Rites saves you, you're at 1 HP — permanently in Bloodlust range. |

---

## 7. WIN / LOSS CONDITIONS

* **Win (Level):** Reduce the Golem's HP to 0 before it kills the player.
* **Win (Run):** Defeat all 5 levels in sequence.
* **Lose:** Player HP reaches 0 after all survival effects (e.g., Last Rites) have resolved.

### Last Rites Resolution Order (Bug Fix Note)
> **Critical:** `applyLastRitesIfNeeded()` must be called **after** HP is set to 0, **before** `checkLose()` is evaluated. This ensures the one-time save proc fires correctly regardless of the damage source (enemy attack or Blood Trade self-damage).

---

## 8. SIMULATED BATTLE LOG (Level 2 Reference)

1. **Turn 1 (Golem Bash - 8):** Player draws 3 [Strikes], 2 [Defends]. Plays 1 [Defend] and 2 [Strikes]. Takes $8 - 6 = 2$ damage. **(Player: 28 HP | Golem: 38 HP)**.
2. **Turn 2 (Golem Shatter - 12):** Player draws 2 [Defends], 1 [Insight], 2 [Strikes]. Plays 2 [Defends]. Blocks all damage. **(Player: 28 HP | Golem: 38 HP)**.
3. **Turn 3 (Golem Recharge - 0):** Player draws [Insight], [Blood Trade], [Strike]. Plays all three for $18 + 9 = 27$ damage. **(Player: 25 HP | Golem: 11 HP)**.
4. **Turn 4 (Golem Fatal Strike - 15):** Golem is **Enraged**. Player draws a [Strike] and wins before the Golem acts.
