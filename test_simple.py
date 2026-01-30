"""
简单测试 - 检查版本号和控制台输出
"""
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    
    # 监听控制台消息
    page.on('console', lambda msg: print(f'Console: {msg.text}'))
    
    page.goto('http://localhost:8001')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(2000)  # 等待多窗口检测完成
    
    # 截图
    page.screenshot(path='test_single_window.png')
    
    # 检查版本号
    version = page.evaluate('''() => {
        const el = document.querySelector('.version-info');
        return el ? el.textContent : 'NOT FOUND';
    }''')
    print(f'Version: {version}')
    
    # 检查警告（单窗口不应该有）
    warning = page.evaluate('''() => {
        const el = document.querySelector('.multi-window-warning');
        return el ? el.textContent : 'NOT FOUND';
    }''')
    print(f'Warning: {warning}')
    
    browser.close()
