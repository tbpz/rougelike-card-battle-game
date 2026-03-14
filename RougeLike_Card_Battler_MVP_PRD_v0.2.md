# GAME DESIGN DOCUMENT: PROJECT: LOGIC ECHO (MVP v0.2)

## 1. SYSTEM OVERVIEW
The core loop centers on a restricted action economy to increase tactical depth and forced decision-making.

* **The "3/5 Vow" Mechanic:**
    * **Draw Phase:** Player draws **5 cards** from the deck at the start of each turn.
    * **Action Phase:** Player chooses to play a maximum of **3 cards**.
    * **Discard Phase:** The remaining 2 cards are automatically **discarded** at the end of the turn.
* **Deck Cycle (The Reshuffle Loop):** When the Draw Pile is empty, the Discard Pile (including cards forced out by the Vow) is shuffled to form a new Draw Pile.

---

## 2. THE CARD CATALOG

| Card Name | Effect |
| :--- | :--- |
| **[Strike]** | Deal 6 damage. |
| **[Defend]** | Gain 6 Armor (Blocks incoming damage; expires at the start of the next turn). |
| **[Blood Trade]** | Deal 12 damage / Lose 3 of your own HP (True damage to self). |
| **[Insight]** | **Buff:** Multiply the damage of all subsequent attack cards in this turn by ×1.5. |

---

## 3. ENEMY AI: THE ANCIENT GOLEM

The Golem follows an **Intent Pattern** defined per level, switching to a **Terminal Intent** when low on health.

### Standard Phase (HP > Enrage Threshold)
* **Bash** – Deal damage. (Forces a choice between full mitigation or chip damage).
* **Shatter** – Deal heavy damage. (Requires two [Defend] cards to fully block).
* **Recharge** – 0 damage. (A safe window for the player to set up combos). *(Levels 1–2 only)*

### Enrage Phase (HP ≤ Enrage Threshold)
Once the Golem's HP drops to the enrage threshold at the start of its turn, it abandons the loop.
* **Intent: Fatal Strike** – Deal fixed damage every turn until the battle ends.
* **Design Goal:** Creates a "Damage Race" forcing the player to use high-risk cards like **[Blood Trade]**.

---

## 4. THE 5-LEVEL DIFFICULTY LADDER

> Difficulty scales by tuning HP, damage values, enrage timing, enemy intent cycle, and deck composition. No new systems are introduced.

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

## 5. WIN / LOSS CONDITIONS

* **Win:** Reduce the Golem's HP to 0 before it kills the player.
* **Lose:** Player HP reaches 0 (from enemy attacks or Blood Trade self-damage).

---

## 6. SIMULATED BATTLE LOG (Level 2 Reference)

1. **Turn 1 (Golem Bash - 8):** Player draws 3 [Strikes], 2 [Defends]. Plays 1 [Defend] and 2 [Strikes]. Takes $8 - 6 = 2$ damage. **(Player: 28 HP | Golem: 38 HP)**.
2. **Turn 2 (Golem Shatter - 12):** Player draws 2 [Defends], 1 [Insight], 2 [Strikes]. Plays 2 [Defends]. Blocks all damage. **(Player: 28 HP | Golem: 38 HP)**.
3. **Turn 3 (Golem Recharge - 0):** Player draws [Insight], [Blood Trade], [Strike]. Plays all three for $18 + 9 = 27$ damage. **(Player: 25 HP | Golem: 11 HP)**.
4. **Turn 4 (Golem Fatal Strike - 15):** Golem is **Enraged**. Player draws a [Strike] and wins before the Golem acts.