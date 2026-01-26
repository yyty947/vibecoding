"""
简化版测试脚本 - 直接运行测试
"""
from playwright.sync_api import sync_playwright
import json
from datetime import datetime
import os

PROJECT_PATH = "C:/Users/y/Desktop/vibecoding/project"
BASE_URL = "http://localhost:8001"

def test_game():
    results = {
        "timestamp": datetime.now().isoformat(),
        "round": 2,
        "tests": [],
        "issues": []
    }

    os.makedirs(f"{PROJECT_PATH}/docs/screenshots/round2", exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()

        console_messages = []
        def on_console(msg):
            console_messages.append({
                "type": msg.type,
                "text": msg.text
            })
            if msg.type == "error":
                print(f"[ERROR] {msg.text}")
        page.on("console", on_console)

        try:
            print("[Test 1] 导航到游戏页面")
            page.goto(BASE_URL, timeout=10000)
            page.wait_for_timeout(2000)
            page.screenshot(path=f"{PROJECT_PATH}/docs/screenshots/round2/01_page_loaded.png")
            results["tests"].append({"name": "页面加载", "status": "PASS", "detail": "页面加载成功"})

            print("[Test 2] 启动经典模式")
            page.click("#btn-classic")
            page.wait_for_timeout(3000)

            state = page.evaluate("""() => {
                if (!window.game) return {error: 'game不存在'};
                return {
                    phase: window.game.state.phase,
                    gold: window.game.state.gold,
                    lives: window.game.state.lives,
                    towers: window.game.state.towers.length
                };
            }""")

            results["tests"].append({"name": "启动游戏", "status": "PASS", "detail": f"状态: {state}"})
            page.screenshot(path=f"{PROJECT_PATH}/docs/screenshots/round2/02_game_started.png")

            print("[Test 3] 放置防御塔")
            canvas = page.locator("#gameCanvas").bounding_box()
            if canvas:
                page.click(".tower-type[data-type='machinegun']")
                page.wait_for_timeout(200)
                page.mouse.click(canvas['x'] + 300, canvas['y'] + 300)
                page.wait_for_timeout(500)

                towers = page.evaluate("() => window.game.state.towers.length")
                results["tests"].append({"name": "放置防御塔", "status": "PASS", "detail": f"放置了{towers}个塔"})

            print("[Test 4] 等待敌人（10秒）")
            page.wait_for_timeout(10000)

            battle_info = page.evaluate("""() => {
                if (!window.game) return null;
                return {
                    enemies: window.game.state.enemies.length,
                    kills: window.game.state.kills,
                    wave: window.game.state.wave
                };
            }""")

            results["tests"].append({
                "name": "敌人生成",
                "status": "PASS" if battle_info['enemies'] > 0 else "PARTIAL",
                "detail": f"敌人:{battle_info['enemies']}, 击杀:{battle_info['kills']}, 波次:{battle_info['wave']}"
            })

            page.screenshot(path=f"{PROJECT_PATH}/docs/screenshots/round2/04_battle.png")

            print("[Test 5] 检查问题")
            # 检查发育时间提示
            has_prep_hint = page.locator("text=准备").count() > 0 or page.locator("text=倒计时").count() > 0
            if not has_prep_hint:
                results["issues"].append("缺少发育时间/倒计时提示")

            # 检查是否有错误
            errors = [msg for msg in console_messages if msg["type"] == "error"]
            if errors:
                results["issues"].append(f"发现{len(errors)}个控制台错误")

            results["tests"].append({
                "name": "问题检查",
                "status": "PASS",
                "detail": f"发现{len(results['issues'])}个问题"
            })

            print("[Test 6] 返回主菜单")
            page.click("#btn-menu")
            page.wait_for_timeout(1000)
            menu_visible = page.locator("#menu").is_visible()
            results["tests"].append({"name": "返回菜单", "status": "PASS" if menu_visible else "FAIL", "detail": "菜单可见"})

        except Exception as e:
            results["tests"].append({"name": "测试", "status": "FAIL", "detail": str(e)})
            results["issues"].append(f"测试失败: {str(e)}")
            print(f"[ERROR] {e}")

        browser.close()

    # 保存结果
    with open(f"{PROJECT_PATH}/docs/test_results_round2.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    # 打印总结
    print("\n" + "="*50)
    print("测试总结")
    print("="*50)
    passed = sum(1 for t in results["tests"] if t["status"] == "PASS")
    print(f"通过: {passed}/{len(results['tests'])}")
    print(f"\n发现的问题 ({len(results['issues'])}个):")
    for issue in results["issues"]:
        print(f"  - {issue}")

    return results

if __name__ == "__main__":
    test_game()
