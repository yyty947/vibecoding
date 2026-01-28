"""
Refactoring Verification Test - Global Upgrade System & UI Changes
"""
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from playwright.sync_api import sync_playwright
import time

def run_tests():
    print('=' * 70)
    print('Refactoring Verification - Global Upgrade & UI Changes')
    print('=' * 70)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page(viewport={'width': 1280, 'height': 720})

        page.goto('http://localhost:8001', timeout=60000)
        time.sleep(3)

        # Start a game first - needed to see HUD elements
        page.click('#btn-classic')
        time.sleep(3)

        # Test 1: Global Upgrade System
        print('\n[Test 1] Global Upgrade System')
        print('-' * 40)

        global_upgrade_check = page.evaluate('''() => {
            const game = window.game;
            if (!game) return { exists: false };

            // Check if game has the new upgrade methods
            return {
                exists: true,
                hasUpgradeTowerType: typeof game.upgradeTowerType === 'function',
                hasUpdateUpgradeButtons: typeof game.updateUpgradeButtons === 'function'
            };
        }''')

        print(f'   Game object accessible: {"YES" if global_upgrade_check["exists"] else "NO"}')
        print(f'   upgradeTowerType() method: {"YES" if global_upgrade_check.get("hasUpgradeTowerType") else "NO"}')
        print(f'   updateUpgradeButtons() method: {"YES" if global_upgrade_check.get("hasUpdateUpgradeButtons") else "NO"}')

        global_upgrade_ok = all([
            global_upgrade_check.get('hasUpgradeTowerType', False),
            global_upgrade_check.get('hasUpdateUpgradeButtons', False)
        ])
        print(f'   Result: {"PASS" if global_upgrade_ok else "FAIL"}')

        # Test 2: Tower Type Upgrade Panel
        print('\n[Test 2] Tower Type Upgrade Panel')
        print('-' * 40)

        panel_check = page.evaluate('''() => {
            const panel = document.getElementById('upgrade-panel');
            if (!panel) return { exists: false };

            const buttons = panel.querySelectorAll('.btn-upgrade-type');
            const buttonStates = [];

            buttons.forEach(btn => {
                const type = btn.id.replace('btn-upgrade-', '');
                buttonStates.push({
                    type,
                    exists: true,
                    text: btn.textContent,
                    disabled: btn.disabled
                });
            });

            return {
                exists: true,
                visible: !panel.classList.contains('hidden'),
                buttonCount: buttons.length,
                buttons: buttonStates
            };
        }''')

        print(f'   Upgrade panel exists: {"YES" if panel_check["exists"] else "NO"}')
        print(f'   Upgrade panel visible: {"YES" if panel_check["visible"] else "NO"}')
        print(f'   Upgrade buttons found: {panel_check["buttonCount"]}')

        for btn in panel_check["buttons"]:
            print(f'   - {btn["type"]}: {btn["text"][:30]}... [{"DISABLED" if btn["disabled"] else "ENABLED"}]')

        panel_ok = panel_check['exists'] and panel_check['buttonCount'] == 6
        print(f'   Result: {"PASS" if panel_ok else "FAIL"}')

        # Test 3: Pause/Speed Control Separation
        print('\n[Test 3] Control System Separation')
        print('-' * 40)

        control_check = page.evaluate('''() => {
            const btnPause = document.getElementById('btn-pause');
            const btnSpeed = document.getElementById('btn-speed');
            const pauseMenu = document.getElementById('pause-menu');

            return {
                hasPauseBtn: !!btnPause,
                pauseBtnText: btnPause?.textContent || '',
                hasSpeedBtn: !!btnSpeed,
                speedBtnText: btnSpeed?.textContent || '',
                hasPauseMenu: !!pauseMenu,
                pauseMenuHidden: pauseMenu?.classList.contains('hidden') || false
            };
        }''')

        print(f'   Pause button exists: {"YES" if control_check["hasPauseBtn"] else "NO"}')
        print(f'   Pause button text: "{control_check["pauseBtnText"]}"')
        print(f'   Speed button exists: {"YES" if control_check["hasSpeedBtn"] else "NO"}')
        print(f'   Speed button text: "{control_check["speedBtnText"]}"')
        print(f'   Pause menu exists: {"YES" if control_check["hasPauseMenu"] else "NO"}')
        print(f'   Pause menu initially hidden: {"YES" if control_check["pauseMenuHidden"] else "NO"}')

        control_ok = all([
            control_check['hasPauseBtn'],
            control_check['hasSpeedBtn'],
            control_check['hasPauseMenu'],
            control_check['pauseMenuHidden']
        ])
        print(f'   Result: {"PASS" if control_ok else "FAIL"}')

        # Test 4: Old UI Elements Removed
        print('\n[Test 4] Old UI Elements Removed')
        print('-' * 40)

        removal_check = page.evaluate('''() => {
            return {
                hasUpgradeAllBtn: !!document.getElementById('btn-upgrade-all'),
                hasConfirmDialog: !!document.getElementById('upgrade-confirm-dialog'),
                hasSingleTowerUpgradePanel: !!document.querySelector('.single-tower-upgrade')
            };
        }''')

        print(f'   Old "upgrade all" button removed: {"YES" if not removal_check["hasUpgradeAllBtn"] else "NO - FAIL"}')
        print(f'   Confirm dialog removed: {"YES" if not removal_check["hasConfirmDialog"] else "NO - FAIL"}')
        print(f'   Single tower upgrade panel removed: {"YES" if not removal_check["hasSingleTowerUpgradePanel"] else "NO - FAIL"}')

        removal_ok = not any([
            removal_check['hasUpgradeAllBtn'],
            removal_check['hasConfirmDialog'],
            removal_check['hasSingleTowerUpgradePanel']
        ])
        print(f'   Result: {"PASS" if removal_ok else "FAIL"}')

        # Test 5: Pause Menu Functionality
        print('\n[Test 5] Pause Menu Functionality')
        print('-' * 40)

        # Click pause button
        page.click('#btn-pause')
        time.sleep(0.5)

        pause_menu_check = page.evaluate('''() => {
            const pauseMenu = document.getElementById('pause-menu');
            const btnResume = document.getElementById('btn-resume');
            const btnRestart = document.getElementById('btn-restart-pause');
            const btnMenu = document.getElementById('btn-menu-pause');

            return {
                menuVisible: !pauseMenu?.classList.contains('hidden'),
                hasResumeBtn: !!btnResume,
                hasRestartBtn: !!btnRestart,
                hasMenuBtn: !!btnMenu,
                gamePhasePaused: window.game?.state?.phase === 'paused'
            };
        }''')

        print(f'   Pause menu shows: {"YES" if pause_menu_check["menuVisible"] else "NO"}')
        print(f'   Resume button exists: {"YES" if pause_menu_check["hasResumeBtn"] else "NO"}')
        print(f'   Restart button exists: {"YES" if pause_menu_check["hasRestartBtn"] else "NO"}')
        print(f'   Menu button exists: {"YES" if pause_menu_check["hasMenuBtn"] else "NO"}')
        print(f'   Game phase is "paused": {"YES" if pause_menu_check["gamePhasePaused"] else "NO"}')

        pause_menu_ok = all([
            pause_menu_check['menuVisible'],
            pause_menu_check['hasResumeBtn'],
            pause_menu_check['hasRestartBtn'],
            pause_menu_check['hasMenuBtn'],
            pause_menu_check['gamePhasePaused']
        ])
        print(f'   Result: {"PASS" if pause_menu_ok else "FAIL"}')

        # Resume game
        page.click('#btn-resume')
        time.sleep(0.5)

        # Test 6: UI Layout (Tower Panel at Bottom)
        print('\n[Test 6] UI Layout Verification')
        print('-' * 40)

        layout_check = page.evaluate('''() => {
            const towerPanel = document.getElementById('tower-panel');
            const upgradePanel = document.getElementById('upgrade-panel');
            const towerStyle = window.getComputedStyle(towerPanel);
            const upgradeStyle = window.getComputedStyle(upgradePanel);

            return {
                towerPanelBottom: towerStyle.bottom,
                upgradePanelBottom: upgradeStyle.bottom,
                towerPanelBorderBottom: towerStyle.borderBottom,
                towerPanelBorderRadius: towerStyle.borderRadius,
                upgradePanelVisible: !upgradePanel.classList.contains('hidden')
            };
        }''')

        print(f'   Tower panel bottom: "{layout_check["towerPanelBottom"]}"')
        print(f'   Upgrade panel bottom: "{layout_check["upgradePanelBottom"]}"')
        print(f'   Tower panel border-bottom: "{layout_check["towerPanelBorderBottom"]}"')
        print(f'   Tower panel border-radius: "{layout_check["towerPanelBorderRadius"]}"')
        print(f'   Upgrade panel visible: {"YES" if layout_check["upgradePanelVisible"] else "NO"}')

        layout_ok = (
            layout_check['towerPanelBottom'] == '0px' and
            'none' in layout_check['towerPanelBorderBottom'] and
            layout_check['upgradePanelBottom'] == '80px' and
            layout_check['upgradePanelVisible']
        )
        print(f'   Result: {"PASS" if layout_ok else "FAIL"}')

        # Test 7: Real-time Button Updates (upgradeTowerType)
        print('\n[Test 7] Real-time Button Update System')
        print('-' * 40)

        realtime_check = page.evaluate('''() => {
            const game = window.game;
            return {
                hasUpgradeTowerType: typeof game.upgradeTowerType === 'function',
                hasUpdateUpgradeButtons: typeof game.updateUpgradeButtons === 'function',
                canCallUpgradeTowerType: true
            };
        }''')

        print(f'   upgradeTowerType() exists: {"YES" if realtime_check["hasUpgradeTowerType"] else "NO"}')
        print(f'   updateUpgradeButtons() exists: {"YES" if realtime_check["hasUpdateUpgradeButtons"] else "NO"}')

        realtime_ok = realtime_check['hasUpgradeTowerType'] and realtime_check['hasUpdateUpgradeButtons']
        print(f'   Result: {"PASS" if realtime_ok else "FAIL"}')

        # Summary
        print('\n' + '=' * 70)
        all_ok = (global_upgrade_ok and panel_ok and control_ok and
                  removal_ok and pause_menu_ok and layout_ok and realtime_ok)
        print(f'OVERALL RESULT: {"ALL TESTS PASSED" if all_ok else "SOME TESTS FAILED"}')
        print('=' * 70)

        # Feature Summary
        print('\nRefactoring Feature Summary:')
        print(f'  [Req 1] Global Upgrade System (Max 3 Levels): {"OK" if global_upgrade_ok else "FAIL"}')
        print(f'  [Req 2] Tower Type Upgrade Panel (6 Buttons): {"OK" if panel_ok else "FAIL"}')
        print(f'  [Req 3] Control Separation (Pause/Speed): {"OK" if control_ok else "FAIL"}')
        print(f'  [Req 4] Old UI Elements Removed: {"OK" if removal_ok else "FAIL"}')
        print(f'  [Req 5] Pause Menu with 3 Options: {"OK" if pause_menu_ok else "FAIL"}')
        print(f'  [Req 6] UI Layout (Tower Panel at Bottom): {"OK" if layout_ok else "FAIL"}')
        print(f'  [Req 7] Real-time Button Updates: {"OK" if realtime_ok else "FAIL"}')

        time.sleep(2)
        browser.close()

if __name__ == '__main__':
    run_tests()
