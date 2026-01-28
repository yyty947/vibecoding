"""
Layout Fix Verification Test
"""
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from playwright.sync_api import sync_playwright
import time

def run_tests():
    print('=' * 70)
    print('Layout Fix Verification')
    print('=' * 70)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page(viewport={'width': 1280, 'height': 720})

        page.goto('http://localhost:8001', timeout=60000)
        time.sleep(3)

        # Start game
        page.click('#btn-classic')
        time.sleep(3)

        # Test 1: Panel Width Consistency
        print('\n[Test 1] Panel Width Consistency')
        print('-' * 40)

        panel_widths = page.evaluate('''() => {
            const towerPanel = document.getElementById('tower-panel');
            const upgradePanel = document.getElementById('upgrade-panel');
            const towerStyle = window.getComputedStyle(towerPanel);
            const upgradeStyle = window.getComputedStyle(upgradePanel);

            return {
                towerPanel: {
                    width: towerPanel.offsetWidth,
                    bottom: towerStyle.bottom,
                    gap: towerStyle.gap,
                    padding: towerStyle.padding,
                    border: towerStyle.border,
                    borderRadius: towerStyle.borderRadius
                },
                upgradePanel: {
                    width: upgradePanel.offsetWidth,
                    bottom: upgradeStyle.bottom,
                    gap: upgradeStyle.gap,
                    padding: upgradeStyle.padding,
                    border: upgradeStyle.border,
                    borderRadius: upgradeStyle.borderRadius
                }
            };
        }''')

        print(f'   Tower Panel: width={panel_widths["towerPanel"]["width"]}px, bottom="{panel_widths["towerPanel"]["bottom"]}"')
        print(f'   Upgrade Panel: width={panel_widths["upgradePanel"]["width"]}px, bottom="{panel_widths["upgradePanel"]["bottom"]}"')
        print(f'   Width difference: {abs(panel_widths["towerPanel"]["width"] - panel_widths["upgradePanel"]["width"])}px')

        width_ok = abs(panel_widths["towerPanel"]["width"] - panel_widths["upgradePanel"]["width"]) < 50
        print(f'   Result: {"PASS" if width_ok else "FAIL"}')

        # Test 2: Style Consistency
        print('\n[Test 2] Style Consistency')
        print('-' * 40)

        print(f'   Tower gap: "{panel_widths["towerPanel"]["gap"]}"')
        print(f'   Upgrade gap: "{panel_widths["upgradePanel"]["gap"]}"')
        gap_ok = panel_widths["towerPanel"]["gap"] == panel_widths["upgradePanel"]["gap"]

        print(f'   Tower border: "{panel_widths["towerPanel"]["border"]}"')
        print(f'   Upgrade border: "{panel_widths["upgradePanel"]["border"]}"')
        border_ok = panel_widths["towerPanel"]["border"] == panel_widths["upgradePanel"]["border"]

        print(f'   Tower borderRadius: "{panel_widths["towerPanel"]["borderRadius"]}"')
        print(f'   Upgrade borderRadius: "{panel_widths["upgradePanel"]["borderRadius"]}"')
        radius_ok = panel_widths["towerPanel"]["borderRadius"] == panel_widths["upgradePanel"]["borderRadius"]

        style_ok = gap_ok and border_ok and radius_ok
        print(f'   Result: {"PASS" if style_ok else "FAIL"}')

        # Test 3: Button Text Format
        print('\n[Test 3] Upgrade Button Text Format')
        print('-' * 40)

        button_texts = page.evaluate('''() => {
            const buttons = document.querySelectorAll('.btn-upgrade-type');
            return Array.from(buttons).map(btn => btn.textContent);
        }''')

        for text in button_texts:
            print(f'   - "{text}"')

        # Check if text is shortened (should be like "机枪Lv.1→50" not "机枪塔 Lv.1 → 2 (50)")
        text_ok = all('→' in text and '(' not in text and '塔' not in text for text in button_texts)
        print(f'   Result: {"PASS" if text_ok else "FAIL"}')

        # Test 4: Defense Line Position
        print('\n[Test 4] Defense Line Position (from config)')
        print('-' * 40)

        # Check the config file directly
        import re
        config_content = open('C:/Users/y/Desktop/vibecoding/project/src/utils/config.js', 'r', encoding='utf-8').read()
        match = re.search(r'endY:\s*(\d+)', config_content)
        endY = int(match.group(1)) if match else 0

        print(f'   Defense line endY (from config): {endY}')
        print(f'   Canvas height: 720px')
        print(f'   Distance from bottom: {720 - endY}px')

        # endY=620 means 100px from bottom
        distance = 720 - endY
        defense_ok = 80 <= distance <= 150  # Reasonable range
        print(f'   Result: {"PASS" if defense_ok else "FAIL"}')

        # Test 5: No Overlap Check
        print('\n[Test 5] No Visual Overlap')
        print('-' * 40)

        overlap_check = page.evaluate('''() => {
            const towerPanel = document.getElementById('tower-panel');
            const upgradePanel = document.getElementById('upgrade-panel');
            const towerRect = towerPanel.getBoundingClientRect();
            const upgradeRect = upgradePanel.getBoundingClientRect();

            return {
                towerTop: towerRect.top,
                upgradeBottom: upgradeRect.bottom,
                gap: towerRect.top - upgradeRect.bottom
            };
        }''')

        print(f'   Tower panel top: {overlap_check["towerTop"]}px')
        print(f'   Upgrade panel bottom: {overlap_check["upgradeBottom"]}px')
        print(f'   Gap between panels: {overlap_check["gap"]}px')

        no_overlap = overlap_check["gap"] >= 0
        print(f'   Result: {"PASS" if no_overlap else "FAIL"} (panels overlap!)')

        # Summary
        print('\n' + '=' * 70)
        all_ok = width_ok and style_ok and text_ok and defense_ok and no_overlap
        print(f'OVERALL RESULT: {"ALL TESTS PASSED" if all_ok else "SOME TESTS FAILED"}')
        print('=' * 70)

        time.sleep(2)
        browser.close()

if __name__ == '__main__':
    run_tests()
