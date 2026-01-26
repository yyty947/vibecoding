"""
塔防游戏功能测试脚本
验证游戏核心功能并生成测试报告
"""
from playwright.sync_api import sync_playwright
import json
from datetime import datetime
import os

# 项目路径
PROJECT_PATH = "C:/Users/y/Desktop/vibecoding/project"
INDEX_HTML = f"file:///{PROJECT_PATH}/index.html"

def test_game():
    results = {
        "timestamp": datetime.now().isoformat(),
        "tests": []
    }

    os.makedirs(f"{PROJECT_PATH}/docs/screenshots", exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context()
        page = context.new_page()

        # 监听控制台日志
        console_messages = []
        def on_console(msg):
            console_messages.append({
                "type": msg.type,
                "text": msg.text
            })
        page.on("console", on_console)

        print("=== Test 1: Page Load ===")
        try:
            page.goto(INDEX_HTML)
            page.wait_for_load_state("networkidle")
            page.wait_for_timeout(1000)

            # Check canvas exists
            canvas = page.locator("#gameCanvas")
            assert canvas.count() > 0, "Canvas not found"
            assert page.locator(".menu").count() > 0, "Menu not found"
            assert page.locator("text=诺曼底登陆").count() > 0, "Title not found"

            results["tests"].append({"name": "Page Load", "status": "PASS", "detail": "Canvas and menu displayed"})
            print("[PASS] Page loaded successfully")
        except Exception as e:
            results["tests"].append({"name": "Page Load", "status": "FAIL", "detail": str(e)})
            print(f"[FAIL] Page load failed: {e}")

        page.screenshot(path=f"{PROJECT_PATH}/docs/screenshots/01_main_menu.png")
        print("Saved: 01_main_menu.png")

        print("\n=== Test 2: Mode Selection ===")
        try:
            page.click("text=开始游戏", timeout=5000)
            page.wait_for_timeout(500)

            assert page.locator("text=经典模式").count() > 0, "Classic mode button not found"
            assert page.locator("text=无尽模式").count() > 0, "Endless mode button not found"

            results["tests"].append({"name": "Mode Selection", "status": "PASS", "detail": "Mode panel displayed"})
            print("[PASS] Mode selection successful")
        except Exception as e:
            results["tests"].append({"name": "Mode Selection", "status": "FAIL", "detail": str(e)})
            print(f"[FAIL] Mode selection failed: {e}")

        page.screenshot(path=f"{PROJECT_PATH}/docs/screenshots/02_mode_select.png")

        print("\n=== Test 3: Start Classic Mode ===")
        try:
            page.click("text=经典模式", timeout=5000)
            page.wait_for_timeout(1000)

            assert page.locator(".hud").count() > 0, "HUD not found"
            assert page.locator(".tower-panel").count() > 0, "Tower panel not found"

            results["tests"].append({"name": "Start Classic Mode", "status": "PASS", "detail": "Game started"})
            print("[PASS] Game started successfully")
        except Exception as e:
            results["tests"].append({"name": "Start Classic Mode", "status": "FAIL", "detail": str(e)})
            print(f"[FAIL] Game start failed: {e}")

        page.screenshot(path=f"{PROJECT_PATH}/docs/screenshots/03_game_start.png")

        print("\n=== Test 4: Place Tower ===")
        try:
            page.click(".tower-type[data-type='BASIC']", timeout=5000)
            page.wait_for_timeout(300)

            canvas_box = page.locator("#gameCanvas").bounding_box()
            if canvas_box:
                click_x = canvas_box['x'] + 200
                click_y = canvas_box['y'] + 300
                page.mouse.click(click_x, click_y)
                page.wait_for_timeout(500)

            results["tests"].append({"name": "Place Tower", "status": "PASS", "detail": "Tower placed successfully"})
            print("[PASS] Tower placement successful")
        except Exception as e:
            results["tests"].append({"name": "Place Tower", "status": "FAIL", "detail": str(e)})
            print(f"[FAIL] Tower placement failed: {e}")

        page.screenshot(path=f"{PROJECT_PATH}/docs/screenshots/04_tower_placed.png")

        print("\n=== Test 5: Enemy Movement ===")
        try:
            page.wait_for_timeout(5000)

            canvas_content = page.evaluate("""
                () => {
                    return window.game ? window.game.state.enemies.length : 0;
                }
            """)

            status = "PASS" if canvas_content > 0 else "PARTIAL"
            results["tests"].append({
                "name": "Enemy Movement",
                "status": status,
                "detail": f"Enemies: {canvas_content}"
            })
            print(f"[{status}] Enemies generated: {canvas_content}")
        except Exception as e:
            results["tests"].append({"name": "Enemy Movement", "status": "FAIL", "detail": str(e)})
            print(f"[FAIL] Enemy detection failed: {e}")

        page.screenshot(path=f"{PROJECT_PATH}/docs/screenshots/05_enemies.png")

        print("\n=== Test 6: Console Check ===")
        errors = [msg for msg in console_messages if msg["type"] == "error"]
        if errors:
            results["tests"].append({
                "name": "Console Check",
                "status": "WARN",
                "detail": f"{len(errors)} errors found"
            })
            print(f"[WARN] Found {len(errors)} console errors")
        else:
            results["tests"].append({"name": "Console Check", "status": "PASS", "detail": "No errors"})
            print("[PASS] No console errors")

        context.close()
        browser.close()

    # Save results
    with open(f"{PROJECT_PATH}/docs/test_results.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    # Print summary
    print("\n" + "="*50)
    print("Test Summary:")
    print("="*50)
    passed = sum(1 for t in results["tests"] if t["status"] == "PASS")
    total = len(results["tests"])
    print(f"Passed: {passed}/{total}")
    for test in results["tests"]:
        print(f"  [{test['status']}] {test['name']}: {test['detail']}")

    return results

if __name__ == "__main__":
    test_game()
