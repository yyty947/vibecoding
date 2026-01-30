"""
多窗口检测测试 - 使用同一个 context
"""
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    
    # 使用同一个 context（这样 BroadcastChannel 才能通信）
    context = browser.new_context()
    
    # 打开第一个页面
    page1 = context.new_page()
    page1.goto('http://localhost:8001')
    page1.wait_for_load_state('networkidle')
    page1.wait_for_timeout(1000)
    
    print('Window 1 opened')
    
    # 打开第二个页面（同 context）
    page2 = context.new_page()
    page2.goto('http://localhost:8001')
    page2.wait_for_load_state('networkidle')
    page2.wait_for_timeout(1500)  # 等待检测完成
    
    # 检查第二个页面的警告
    warning2 = page2.evaluate('''() => {
        const el = document.querySelector('.multi-window-warning');
        return el ? el.textContent : 'NOT FOUND';
    }''')
    print(f'Window 2 Warning: {warning2}')
    
    page2.screenshot(path='test_multiwindow_page2.png')
    
    # 第一个页面也应该收到 pong 并显示警告
    page1.wait_for_timeout(1000)
    warning1 = page1.evaluate('''() => {
        const el = document.querySelector('.multi-window-warning');
        return el ? el.textContent : 'NOT FOUND';
    }''')
    print(f'Window 1 Warning: {warning1}')
    
    page1.screenshot(path='test_multiwindow_page1.png')
    
    context.close()
    browser.close()
    print('\nTest completed!')
