"""
完整游戏测试 - 验证三种塔的使用价值
"""
from playwright.sync_api import sync_playwright

def test_tower_balance():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto('http://localhost:8001')
        page.wait_for_load_state('networkidle')
        
        # 开始游戏
        page.click('#btn-classic')
        page.wait_for_timeout(500)
        
        # ========== 第1波：机枪塔起步 ==========
        print("=== Wave 1: Machine Gun Start ===")
        # 放置3个机枪塔形成防线
        positions = [(400, 300), (500, 300), (450, 400)]
        for pos in positions:
            page.click('#tower-panel .tower-type[data-type="machinegun"]')
            page.click('canvas', position={'x': pos[0], 'y': pos[1]})
            page.wait_for_timeout(200)
        
        page.screenshot(path='test_w1_machinegun.png')
        print("Placed 3 machine guns")
        
        # 等待第1波结束
        page.wait_for_timeout(12000)
        
        # ========== 第2-3波：观察清除比例 ==========
        print("=== Wave 2-3: Testing Clear Ratio ===")
        page.wait_for_timeout(20000)  # 等待波次结算
        page.screenshot(path='test_w3_after_clear.png')
        print("After wave 3 settlement (should clear ~35%)")
        
        # 补充防御
        for pos in [(350, 350), (550, 350)]:
            try:
                page.click('#tower-panel .tower-type[data-type="machinegun"]')
                page.click('canvas', position={'x': pos[0], 'y': pos[1]})
                page.wait_for_timeout(200)
            except:
                pass  # 可能金币不够
        
        # ========== 第4波：测试加农炮对护盾兵 ==========
        print("=== Wave 4: Cannon vs Shield Soldiers ===")
        page.wait_for_timeout(15000)
        page.screenshot(path='test_w4_cannon_test.png')
        print("Wave 4 - Shield soldiers should appear, cannon should be effective")
        
        # 尝试放置加农炮
        try:
            page.click('#tower-panel .tower-type[data-type="cannon"]')
            page.click('canvas', position={'x': 450, 'y': 350})
            page.wait_for_timeout(200)
            print("Placed cannon")
        except:
            print("Could not place cannon (not enough gold)")
        
        # ========== 第5-6波：继续推进 ==========
        print("=== Wave 5-6: Progress ===")
        page.wait_for_timeout(25000)
        page.screenshot(path='test_w6_progress.png')
        
        # ========== 第7波：电磁塔解锁测试 ==========
        print("=== Wave 7: EM Tower Unlock ===")
        page.wait_for_timeout(15000)
        page.screenshot(path='test_w7_em_unlock.png')
        print("EM tower should be unlocked")
        
        # 尝试放置电磁塔
        try:
            page.click('#tower-panel .tower-type[data-type="em"]')
            page.click('canvas', position={'x': 450, 'y': 450})
            page.wait_for_timeout(500)
            page.screenshot(path='test_w7_em_placed.png')
            print("Placed EM tower - check for counter dots below tower")
        except:
            print("Could not place EM tower")
        
        # 继续观察几波
        page.wait_for_timeout(20000)
        page.screenshot(path='test_final.png')
        print("Final state")
        
        browser.close()
        print("\n=== Test Completed ===")
        print("Check screenshots for:")
        print("1. test_w1_machinegun.png - Initial MG placement")
        print("2. test_w3_after_clear.png - Clear ratio (~35% in early waves)")
        print("3. test_w4_cannon_test.png - Cannon effectiveness vs shields")
        print("4. test_w7_em_placed.png - EM tower with counter visualization")

if __name__ == "__main__":
    test_tower_balance()
