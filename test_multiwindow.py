"""
多窗口检测测试
"""
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)  # 非无头模式便于观察
    
    # 打开第一个窗口
    page1 = browser.new_page()
    page1.goto('http://localhost:8001')
    page1.wait_for_load_state('networkidle')
    
    # 检查版本号显示
    version_text = page1.evaluate('''() => {
        const el = document.querySelector('.version-info');
        return el ? el.textContent : 'not found';
    }''')
    print(f'Window 1 - Version: {version_text}')
    
    page1.screenshot(path='test_window1_initial.png')
    
    # 打开第二个窗口
    page2 = browser.new_page()
    page2.goto('http://localhost:8001')
    page2.wait_for_load_state('networkidle')
    
    # 等待多窗口检测完成（500ms timeout）
    page2.wait_for_timeout(1000)
    
    # 检查是否显示警告
    warning_text = page2.evaluate('''() => {
        const el = document.querySelector('.multi-window-warning');
        return el ? el.textContent : 'not found';
    }''')
    print(f'Window 2 - Warning: {warning_text}')
    
    page2.screenshot(path='test_window2_warning.png')
    
    # 回到第一个窗口，应该也显示警告
    page1.wait_for_timeout(1000)
    warning_text1 = page1.evaluate('''() => {
        const el = document.querySelector('.multi-window-warning');
        return el ? el.textContent : 'not found';
    }''')
    print(f'Window 1 - Warning: {warning_text1}')
    
    page1.screenshot(path='test_window1_warning.png')
    
    browser.close()
    print('\nTest completed!')
