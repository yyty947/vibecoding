"""
Three-Stage Feature Expansion - Final Verification Test
"""
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from playwright.sync_api import sync_playwright
import time

def run_tests():
    print('=' * 70)
    print('Three-Stage Feature Expansion - Final Verification')
    print('=' * 70)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page(viewport={'width': 1280, 'height': 720})

        page.goto('http://localhost:8001', timeout=60000)
        time.sleep(3)

        # Test 1: Unlock System
        print('\n[Test 1] Tower Unlock System')
        print('-' * 40)
        page.click('#btn-classic')
        time.sleep(2)

        locked_towers = page.evaluate('''() => {
            const towers = document.querySelectorAll('.tower-type');
            const result = [];
            towers.forEach(el => {
                const type = el.dataset.type;
                const locked = el.classList.contains('locked');
                const lockText = el.querySelector('.tower-lock')?.textContent || '';
                result.push({ type, locked, lockText });
            });
            return result;
        }''')

        unlock_ok = True
        for t in locked_towers:
            status = 'LOCKED' if t['locked'] else 'UNLOCKED'
            info = f' ({t["lockText"]})' if t['lockText'] else ''
            print(f'   {t["type"]}: {status}{info}')
            if t['type'] in ['machinegun', 'cannon'] and t['locked']:
                unlock_ok = False
            if t['type'] in ['rifle', 'laser', 'em', 'rocket'] and not t['locked']:
                unlock_ok = False

        print(f'   Result: {"PASS" if unlock_ok else "FAIL"}')

        # Test 2: Combat System
        print('\n[Test 2] Combat System (Tower HP + Enemy Attack)')
        print('-' * 40)

        # Place tower
        page.click('.tower-type[data-type="machinegun"]')
        time.sleep(0.5)
        canvas_width = page.evaluate('window.innerWidth')
        page.mouse.click(canvas_width / 2, 150)
        time.sleep(1)

        tower_check = page.evaluate('''() => {
            const tower = window.game.state.towers[0];
            if (!tower) return { exists: false };
            return {
                exists: true,
                hasTakeDamage: typeof tower.takeDamage === 'function',
                hasIsAlive: typeof tower.isAlive === 'function',
                hp: tower.hp,
                maxHp: tower.maxHp
            };
        }''')

        if tower_check['exists']:
            print(f'   Tower placed: YES')
            print(f'   Tower HP: {tower_check["hp"]}/{tower_check["maxHp"]}')
            print(f'   takeDamage() method: {"YES" if tower_check["hasTakeDamage"] else "NO"}')
            print(f'   isAlive() method: {"YES" if tower_check["hasIsAlive"] else "NO"}')
            combat_ok = tower_check['hasTakeDamage'] and tower_check['hasIsAlive']
        else:
            print('   Tower placed: NO')
            combat_ok = False

        # Test 3: Wave Settlement Methods
        print('\n[Test 3] Wave Settlement System')
        print('-' * 40)

        settlement_methods = page.evaluate('''() => {
            return {
                hasProcessWaveSettlement: typeof window.game.processWaveSettlement === 'function',
                hasShowSettlementMessage: typeof window.game.showSettlementMessage === 'function'
            };
        }''')

        print(f'   processWaveSettlement(): {"YES" if settlement_methods["hasProcessWaveSettlement"] else "NO"}')
        print(f'   showSettlementMessage(): {"YES" if settlement_methods["hasShowSettlementMessage"] else "NO"}')
        settlement_ok = settlement_methods['hasProcessWaveSettlement'] and settlement_methods['hasShowSettlementMessage']

        # Test 4: Combo System
        print('\n[Test 4] Combo System')
        print('-' * 40)

        combo_check = page.evaluate('''() => {
            const combo = window.game.combo;
            return {
                exists: !!combo,
                hasCount: combo && typeof combo.count === 'number',
                hasMultiplier: combo && typeof combo.multiplier === 'number',
                count: combo?.count || 0,
                multiplier: combo?.multiplier || 0
            };
        }''')

        print(f'   Combo object exists: {"YES" if combo_check["exists"] else "NO"}')
        print(f'   count: {combo_check["count"]}')
        print(f'   multiplier: {combo_check["multiplier"]}x')
        combo_ok = combo_check['exists'] and combo_check['hasCount'] and combo_check['hasMultiplier']

        # Test 5: Bug Fix Verification (currentTime)
        print('\n[Test 5] Bug Fix Verification')
        print('-' * 40)

        bug_fixed = page.evaluate('''() => {
            const fn = window.game.update.toString();
            return fn.includes('const currentTime = performance.now()');
        }''')

        print(f'   currentTime bug fixed: {"YES" if bug_fixed else "NO"}')

        # Summary
        print('\n' + '=' * 70)
        all_ok = unlock_ok and combat_ok and settlement_ok and combo_ok and bug_fixed
        print(f'OVERALL RESULT: {"ALL TESTS PASSED" if all_ok else "SOME TESTS FAILED"}')
        print('=' * 70)

        # Feature Summary
        print('\nFeature Summary:')
        print(f'  [Stage 1] Combat System (Tower HP + Enemy Attack): {"OK" if combat_ok else "FAIL"}')
        print(f'  [Stage 2] Wave Settlement (Tower Clear + Refund): {"OK" if settlement_ok else "FAIL"}')
        print(f'  [Stage 3] Unlock System (6 Towers, 4 Enemy Types): {"OK" if unlock_ok else "FAIL"}')
        print(f'  [Bonus] Combo System: {"OK" if combo_ok else "FAIL"}')
        print(f'  [Fix] Bug Fix (currentTime in update): {"OK" if bug_fixed else "FAIL"}')

        time.sleep(2)
        browser.close()

if __name__ == '__main__':
    run_tests()
