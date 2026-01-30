from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto('http://localhost:8001')
    page.wait_for_load_state('networkidle')
    
    # 点击经典模式开始游戏
    page.click('#btn-classic')
    page.wait_for_timeout(500)
    
    # 放置几个机枪塔
    page.click('#tower-panel .tower-type[data-type="machinegun"]')
    page.click('canvas', position={'x': 400, 'y': 300})
    page.wait_for_timeout(200)
    
    page.click('#tower-panel .tower-type[data-type="machinegun"]')
    page.click('canvas', position={'x': 500, 'y': 300})
    page.wait_for_timeout(200)
    
    # 截图查看初始状态
    page.screenshot(path='test_wave1_start.png')
    print('Screenshot saved: test_wave1_start.png')
    
    # 等待第一波结束（约15秒）
    page.wait_for_timeout(15000)
    page.screenshot(path='test_wave1_end.png')
    print('Screenshot saved: test_wave1_end.png')
    
    # 等待第二波结束，查看清除比例
    page.wait_for_timeout(15000)
    page.screenshot(path='test_wave2_end.png')
    print('Screenshot saved: test_wave2_end.png')
    
    browser.close()
    print('Test completed')
