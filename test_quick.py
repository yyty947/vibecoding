"""
快速测试 - 核心功能验证
"""
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto('http://localhost:8001')
    page.wait_for_load_state('networkidle')
    
    # 开始游戏
    page.click('#btn-classic')
    page.wait_for_timeout(500)
    
    # 放置机枪塔
    page.click('#tower-panel .tower-type[data-type="machinegun"]')
    page.click('canvas', position={'x': 400, 'y': 300})
    page.wait_for_timeout(200)
    
    # 升级机枪塔类型
    page.click('#btn-upgrade-machinegun')
    page.wait_for_timeout(200)
    
    # 检查升级后成本是否更新
    page.screenshot(path='test_after_upgrade.png')
    
    # 放置加农炮
    page.click('#tower-panel .tower-type[data-type="cannon"]')
    page.click('canvas', position={'x': 500, 'y': 300})
    page.wait_for_timeout(200)
    
    page.screenshot(path='test_cannon_placed.png')
    
    # 模拟游戏进行（加速模式）
    page.click('#btn-speed')  # 切换到2x
    page.wait_for_timeout(500)
    
    # 等待一段时间让敌人出现
    page.wait_for_timeout(8000)
    page.screenshot(path='test_enemies_appeared.png')
    
    browser.close()
    print("Quick test completed")
