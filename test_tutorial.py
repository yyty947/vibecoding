"""
测试新手教学页
"""
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    
    # 清除 localStorage，确保显示教学页
    page.context.clear_cookies()
    
    page.goto('http://localhost:8001')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(1000)
    
    # 截图检查教学页是否显示
    page.screenshot(path='test_tutorial_page.png')
    
    # 检查教学页元素是否存在
    tutorial_title = page.evaluate('''() => {
        const el = document.querySelector('#tutorial h1');
        return el ? el.textContent : 'NOT FOUND';
    }''')
    print(f'Tutorial title: {tutorial_title}')
    
    # 检查"开始游戏"按钮
    has_start_btn = page.evaluate('''() => {
        return !!document.getElementById('btn-start-game');
    }''')
    print(f'Has start button: {has_start_btn}')
    
    # 检查复选框
    has_checkbox = page.evaluate('''() => {
        return !!document.getElementById('skip-tutorial-checkbox');
    }''')
    print(f'Has checkbox: {has_checkbox}')
    
    # 点击"开始游戏"
    page.click('#btn-start-game')
    page.wait_for_timeout(500)
    
    # 截图检查是否显示主菜单
    page.screenshot(path='test_tutorial_after_start.png')
    
    # 检查主菜单是否可见
    menu_visible = page.evaluate('''() => {
        const menu = document.getElementById('menu');
        return menu && !menu.classList.contains('hidden');
    }''')
    print(f'Menu visible: {menu_visible}')
    
    # 检查"游戏指南"按钮
    has_guide_btn = page.evaluate('''() => {
        return !!document.getElementById('btn-tutorial');
    }''')
    print(f'Has guide button: {has_guide_btn}')
    
    browser.close()
    print('\nTutorial test completed!')
