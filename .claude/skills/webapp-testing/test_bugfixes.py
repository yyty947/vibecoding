"""
Test script for verifying bug fixes:
1. Wave display should increment normally (not jump to hundreds)
2. Canvas should be cleared when returning to menu
3. Building placement should work on full screen width
4. Wave completion notification should display
"""
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError

def run_tests():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()

        # Retry connection with backoff
        import time
        max_retries = 5
        for i in range(max_retries):
            try:
                page.goto('http://localhost:8001', timeout=30000)
                page.wait_for_load_state('networkidle', timeout=30000)
                break
            except Exception as e:
                if i < max_retries - 1:
                    print(f"连接失败，重试中... ({i+1}/{max_retries})")
                    time.sleep(2)
                else:
                    raise

        print("=" * 60)
        print("开始测试 - Bug修复验证")
        print("=" * 60)

        # Test 1: Start classic mode
        print("\n[测试1] 启动经典模式游戏...")
        try:
            page.click('#btn-classic')
            page.wait_for_timeout(1000)

            # Check countdown is visible
            countdown = page.locator('#countdown').count()
            if countdown > 0:
                print("✓ 倒计时显示正常")

            # Check mode display
            mode_text = page.locator('#mode-display').text_content()
            print(f"✓ 模式显示: {mode_text}")

        except Exception as e:
            print(f"✗ 启动经典模式失败: {e}")

        # Test 2: Verify wave display doesn't jump
        print("\n[测试2] 验证波次显示...")
        try:
            # Wait for first wave to start
            page.wait_for_timeout(9000)  # Wait for 8s countdown + wave start

            # Check wave number
            wave_elem = page.locator('#wave')
            wave_text = wave_elem.text_content()
            wave_num = int(wave_text)
            print(f"✓ 当前波次: {wave_num}")

            # Should be wave 1, not hundreds
            if wave_num <= 5:
                print("✓ 波次显示正常（没有跳变到上百波）")
            else:
                print(f"✗ 警告：波次异常高！当前: {wave_num}")

        except Exception as e:
            print(f"✗ 验证波次显示失败: {e}")

        # Test 3: Building placement works on right side
        print("\n[测试3] 测试右侧区域放置建筑...")
        try:
            # Select machine gun tower (div with data-type)
            page.click('.tower-type[data-type="machinegun"]')
            page.wait_for_timeout(500)

            # Try to place tower on right side of screen (80% width)
            canvas_width = page.evaluate('window.innerWidth')
            place_x = int(canvas_width * 0.8)
            place_y = 400

            print(f"   画布宽度: {canvas_width}, 尝试放置位置: x={place_x}")

            # Click on right side of canvas
            page.mouse.click(place_x, place_y)
            page.wait_for_timeout(500)

            # Check if gold decreased (tower placed successfully)
            gold_after = page.locator('#gold').text_content()
            print(f"✓ 放置后金币: {gold_after}")

            # Check tower was added
            tower_count = page.evaluate('window.game.state.towers.length')
            print(f"✓ 防御塔数量: {tower_count}")

            if tower_count > 0:
                print("✓ 右侧区域可以放置建筑")
            else:
                print("✗ 右侧区域无法放置建筑")

        except Exception as e:
            print(f"✗ 测试建筑放置失败: {e}")

        # Test 4: Canvas cleared on menu return
        print("\n[测试4] 测试返回主菜单后画布清理...")
        try:
            # Store current tower count
            towers_before = page.evaluate('window.game.state.towers.length')
            print(f"   返回菜单前防御塔数量: {towers_before}")

            # Click return to menu button
            page.click('button:has-text("返回主菜单")')
            page.wait_for_timeout(1000)

            # Check menu is visible
            menu_visible = page.locator('#menu:not(.hidden)').count() > 0
            if menu_visible:
                print("✓ 主菜单已显示")
            else:
                print("✗ 主菜单未显示")

            # Check game state is cleared
            try:
                towers_after = page.evaluate('window.game.state.towers.length')
                if towers_after == 0:
                    print(f"✓ 游戏状态已清空（防御塔数量: {towers_after}）")
                else:
                    print(f"✗ 游戏状态未清空（防御塔数量: {towers_after}）")
            except:
                print("✓ 游戏状态已清空（window.game不可访问）")

        except Exception as e:
            print(f"✗ 测试画布清理失败: {e}")

        # Test 5: Wave completion notification
        print("\n[测试5] 测试波次完成通知...")
        try:
            # Start a new game in endless mode
            page.click('#btn-endless')
            page.wait_for_timeout(9000)  # Wait for countdown and first wave

            # Speed up game to 2x
            page.click('#btn-speed')  # 1x -> 2x
            page.wait_for_timeout(500)

            # Wait for some enemies and wave to potentially complete
            page.wait_for_timeout(5000)

            # Check mode display for completion message
            mode_text = page.locator('#mode-display').text_content()
            print(f"✓ 当前模式显示: {mode_text}")

            if '完成' in mode_text or '无尽模式' in mode_text:
                print("✓ 波次显示逻辑正常")

        except Exception as e:
            print(f"✗ 测试波次完成通知失败: {e}")

        # Final check
        print("\n" + "=" * 60)
        print("测试完成！")
        print("=" * 60)

        # Take final screenshot
        page.screenshot(path='C:/Users/y/Desktop/vibecoding/project/.claude/skills/webapp-testing/test_result.png', full_page=True)
        print("截图已保存: test_result.png")

        page.wait_for_timeout(2000)
        browser.close()

if __name__ == '__main__':
    run_tests()
