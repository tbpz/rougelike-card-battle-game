import random
import itertools

def simulate():
    wins = 0
    losses = 0
    winning_games_log = []
    
    for game_idx in range(5000):
        # Initial State Level 4
        player_hp = 25
        enemy_hp = 60
        enrage_threshold = 25
        enraged = False
        
        draw_pile = ['S', 'S', 'S', 'D', 'D', 'D', 'B', 'B', 'B', 'I', 'I']
        random.shuffle(draw_pile)
        discard_pile = []
        
        turn_index = 0
        cycle = [10, 15, 10, 15, 10, 15, 10, 15]
        game_log = []
        
        while player_hp > 0 and enemy_hp > 0:
            if not enraged and enemy_hp <= enrage_threshold:
                enraged = True
            
            intent_dmg = 18 if enraged else cycle[turn_index]
            
            # Draw 5
            hand = []
            for _ in range(5):
                if not draw_pile:
                    draw_pile = discard_pile[:]
                    random.shuffle(draw_pile)
                    discard_pile = []
                if draw_pile:
                    hand.append(draw_pile.pop())
                    
            combos = []
            for r in range(1, 4):
                combos.extend(list(itertools.permutations(hand, r)))
                
            best_combo = ()
            best_score = -99999
            
            for combo in combos:
                temp_p_hp = player_hp
                temp_e_hp = enemy_hp
                armor = 0
                mult = 1.0
                dead = False
                
                for card in combo:
                    if card == 'D':
                        armor += 6
                    elif card == 'I':
                        mult = 1.5
                    elif card == 'B':
                        dmg = int(12 * mult)
                        temp_e_hp -= dmg
                        temp_p_hp -= 3
                    elif card == 'S':
                        dmg = int(6 * mult)
                        temp_e_hp -= dmg
                        
                    if temp_p_hp <= 0:
                        dead = True
                        break
                        
                if dead:
                    continue
                    
                blocked = min(armor, intent_dmg)
                real_dmg = intent_dmg - blocked
                temp_p_hp -= real_dmg
                
                if temp_p_hp <= 0 and temp_e_hp > 0:
                    score = -5000 + temp_e_hp # Died
                elif temp_e_hp <= 0:
                    score = 10000 + temp_p_hp # Won
                else:
                    # Survival score -> Balance between dealing damage and keeping HP
                    score = (-temp_e_hp * 3) + (temp_p_hp * 5)
                    
                if score > best_score:
                    best_score = score
                    best_combo = combo
                    
            if not best_combo and len(combos) > 0:
                # Force loss if no combo keeps us alive during our own turn
                player_hp = 0
                break
                
            # Play best combo
            armor = 0
            mult = 1.0
            
            for card in best_combo:
                # Simple list removal
                if card in hand:
                    hand.remove(card)
                
                discard_pile.append(card)
                
                if card == 'D':
                    armor += 6
                elif card == 'I':
                    mult = 1.5
                elif card == 'B':
                    player_hp -= 3
                    enemy_hp -= int(12 * mult)
                elif card == 'S':
                    enemy_hp -= int(6 * mult)
                    
            game_log.append(f"T{turn_index+1} vs {intent_dmg}dmg | Hand: {hand+list(best_combo)} | Played: {best_combo} | EHP: {enemy_hp} PHP: {player_hp} (before enemy hit)")
                    
            discard_pile.extend(hand) # end turn empty hand
            
            if enemy_hp <= 0:
                break
                
            blocked = min(armor, intent_dmg)
            real_dmg = intent_dmg - blocked
            player_hp -= real_dmg
            
            if not enraged:
                turn_index += 1
                
        if player_hp > 0 and enemy_hp <= 0:
            wins += 1
            if len(winning_games_log) < 2:
                winning_games_log.append(game_log)
        else:
            losses += 1
            
    print(f"Total Simulations: 5000")
    print(f"Wins: {wins}")
    print(f"Win Rate: {wins/(wins+losses)*100:.2f}%")
    print("\nExample Winning Game:")
    if winning_games_log:
        for step in winning_games_log[0]:
            print(step)
    else:
        print("No wins found.")

if __name__ == '__main__':
    simulate()
