# GAME DESIGN DOCUMENT: PROJECT: LOGIC ECHO (MVP v0.2)

## 1. SYSTEM OVERVIEW
The core loop centers on a restricted action economy to increase tactical depth and forced decision-making.

* **Player Health:** 30 HP.
* **Enemy (Ancient Golem):** 50 HP.
* **The "3/5 Vow" Mechanic:**
    * **Draw Phase:** Player draws **5 cards** from the deck at the start of each turn.
    * **Action Phase:** Player chooses to play a maximum of **3 cards**.
    * **Discard Phase:** The remaining 2 cards are automatically **discarded** at the end of the turn.
* **Deck Cycle (The Reshuffle Loop):** When the Draw Pile is empty, the Discard Pile (including cards forced out by the Vow) is shuffled to form a new Draw Pile.

---

## 2. THE 12-CARD FIXED STARTER DECK
To ensure tactical consistency for the MVP, the player uses a hard-coded deck. This ratio guarantees a mix of basic survival and high-impact "Vow" decisions.

| Card Name | Quantity | Effect |
| :--- | :--- | :--- |
| **[Strike]** | 4 | Deal 6 damage. |
| **[Defend]** | 4 | Gain 6 Armor (Blocks incoming damage; expires at the start of the next turn). |
| **[Blood Trade]** | 2 | Deal 12 damage / Lose 3 of your own HP (True damage to self). |
| **[Insight]** | 2 | **Buff:** Multiply the damage of all subsequent attack cards in this turn by x1.5. |

---

## 3. ENEMY AI: THE ANCIENT GOLEM
The Golem follows a **Cyclic Intent Pattern** to allow for strategic planning, switching to a **Terminal Intent** when low on health.

### Phase 1: The Standard Loop (HP > 15)
The Golem repeats this 3-turn cycle indefinitely:
* **Turn 1: Bash** – Deal **8 damage**. (Forces a choice between full mitigation or chip damage).
* **Turn 2: Shatter** – Deal **12 damage**. (Requires two [Defend] cards to fully block).
* **Turn 3: Recharge** – **0 damage**. (A safe window for the player to set up combos).

### Phase 2: Enrage (HP ≤ 15)
Once the Golem's HP is 15 or lower at the start of its turn, it abandons the loop.
* **Intent: Fatal Strike** – Deal **15 damage** every turn until the battle ends.
* **Design Goal:** Creates a "Damage Race" forcing the player to use high-risk cards like **[Blood Trade]**.

---

## 4. SIMULATED BATTLE LOG
This log demonstrates a typical 4-turn encounter utilizing the mechanics above.

1.  **Turn 1 (Golem Bash - 8):** Player draws 3 [Strikes], 2 [Defends]. Plays 1 [Defend] and 2 [Strikes]. Takes $8 - 6 = 2$ damage. **(Player: 28 HP | Golem: 38 HP)**.
2.  **Turn 2 (Golem Shatter - 12):** Player draws 2 [Defends], 1 [Insight], 2 [Strikes]. Plays 2 [Defends]. Blocks all damage. **(Player: 28 HP | Golem: 38 HP)**.
3.  **Turn 3 (Golem Recharge - 0):** Player draws [Insight], [Blood Trade], [Strike]. Plays all three for $18 + 9 = 27$ damage. **(Player: 25 HP | Golem: 11 HP)**.
4.  **Turn 4 (Golem Fatal Strike - 15):** Golem is **Enraged**. Player draws a [Strike] and wins before the Golem acts.