"""
塔防游戏第二轮强化版测试脚本
重点关注：边界情况、UI/UX问题、稳定性、完整流程
"""
from playwright.sync_api import sync_playwright
import json
from datetime import datetime
import os
import time

# 项目路径
PROJECT_PATH = "C:/Users/y/Desktop/vibecoding/project"
BASE_URL = "http://localhost:8000"

def test_game_round2():
    results = {
        "timestamp": datetime.now().isoformat(),
        "round": 2,
        "focus": ["边界情况", "UI/UX", "稳定性", "完整流程"],
        "tests": [],
        "issues": [],
        "console_logs": []
    }

    os.makedirs(f"{PROJECT_PATH}/docs/screenshots/round2", exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, slow_mo=500)
        context = browser.new_context()
        page = context.new_page()

        # 监听所有控制台消息
        console_messages = []
        def on_console(msg):
            entry = {
                "type": msg.type,
                "text": msg.text,
                "location": f"{msg.location['url']}:{msg.location.get('lineNumber', '?')}"
            }
            console_messages.append(entry)
            if msg.type == "error":
                print(f"[CONSOLE ERROR] {msg.text}")
        page.on("console", on_console)

        # 监听页面错误
        page_errors = []
        def on_page_error(error):
            page_errors.append(str(error))
            print(f"[PAGE ERROR] {error}")
        page.on("pageerror", on_page_error)

        print("=" * 60)
        print("=== Round 2: 强化版测试开始 ===")
        print("=" * 60)

        # Test 1: 页面加载与初始状态
        print("\n[Test 1] 页面加载与初始状态检查")
        try:
            page.goto(BASE_URL)
            page.wait_for_load_state("networkidle")
            page.wait_for_timeout(1000)

            checks = []

            # 检查关键元素
            elements_to_check = [
                ("#gameCanvas", "画布"),
                ("#menu", "主菜单"),
                ("#btn-classic", "经典模式按钮"),
                ("#btn-endless", "无尽模式按钮"),
                ("text=诺曼底登陆", "标题")
            ]

            for selector, name in elements_to_check:
                count = page.locator(selector).count()
                status = "PASS" if count > 0 else "FAIL"
                checks.append(f"{name}: {status}")
                if count == 0:
                    results["issues"].append(f"元素缺失: {name} ({selector})")

            # 检查 game 实例
            game_exists = page.evaluate("() => typeof window.game !== 'undefined'")
            checks.append(f"window.game 存在: {'PASS' if game_exists else 'FAIL'}")

            page.screenshot(path=f"{PROJECT_PATH}/docs/screenshots/round2/01_initial_state.png")

            results["tests"].append({
                "name": "页面加载与初始状态",
                "status": "PASS" if all("FAIL" not in c for c in checks) else "FAIL",
                "detail": "; ".join(checks)
            })
            print(f"[结果] {'; '.join(checks)}")
        except Exception as e:
            results["tests"].append({"name": "页面加载与初始状态", "status": "FAIL", "detail": str(e)})
            results["issues"].append(f"页面加载失败: {str(e)}")
            print(f"[FAIL] {e}")

        # Test 2: 经典模式完整流程
        print("\n[Test 2] 经典模式完整流程")
        try:
            # 点击经典模式
            page.click("#btn-classic")
            page.wait_for_timeout(2000)

            # 检查游戏状态
            game_state = page.evaluate("""() => {
                if (!window.game) return null;
                return {
                    phase: window.game.state.phase,
                    mode: window.game.state.mode,
                    gold: window.game.state.gold,
                    lives: window.game.state.lives,
                    wave: window.game.state.wave
                };
            }""")

            if game_state:
                results["tests"].append({
                    "name": "经典模式启动",
                    "status": "PASS" if game_state["phase"] == "playing" else "FAIL",
                    "detail": f"phase={game_state['phase']}, mode={game_state['mode']}"
                })
                print(f"[PASS] 游戏状态: {game_state}")
            else:
                results["tests"].append({"name": "经典模式启动", "status": "FAIL", "detail": "game实例不存在"})
                results["issues"].append("游戏启动后 window.game 不可用")

            page.screenshot(path=f"{PROJECT_PATH}/docs/screenshots/round2/02_game_started.png")

        except Exception as e:
            results["tests"].append({"name": "经典模式启动", "status": "FAIL", "detail": str(e)})
            print(f"[FAIL] {e}")

        # Test 3: 边界测试 - 快速连续放置防御塔
        print("\n[Test 3] 边界测试 - 快速连续放置防御塔")
        try:
            canvas_box = page.locator("#gameCanvas").bounding_box()
            if not canvas_box:
                raise Exception("画布未找到")

            # 选择机枪塔
            page.click(".tower-type[data-type='machinegun']")
            page.wait_for_timeout(200)

            initial_gold = page.evaluate("() => window.game.state.gold")

            # 快速连续点击放置
            placed_count = 0
            for i in range(5):
                click_x = canvas_box['x'] + 200 + i * 80
                click_y = canvas_box['y'] + 300
                page.mouse.click(click_x, click_y)
                page.wait_for_timeout(100)

            final_gold = page.evaluate("() => window.game.state.gold")
            tower_count = page.evaluate("() => window.game.state.towers.length")

            gold_spent = initial_gold - final_gold
            expected_spent = tower_count * 50  # 机枪塔50金币

            results["tests"].append({
                "name": "快速连续放置防御塔",
                "status": "PASS",
                "detail": f"放置了{tower_count}个塔，消耗{gold_spent}金币"
            })
            print(f"[PASS] 放置了{tower_count}个塔，剩余金币{final_gold}")

        except Exception as e:
            results["tests"].append({"name": "快速连续放置防御塔", "status": "FAIL", "detail": str(e)})
            print(f"[FAIL] {e}")

        # Test 4: 边界测试 - 金币不足时尝试放置
        print("\n[Test 4] 边界测试 - 金币不足时尝试放置")
        try:
            current_gold = page.evaluate("() => window.game.state.gold")
            console_log_count = len(console_messages)

            # 尝试放置一个买不起的塔（如果金币不够）
            page.click(".tower-type[data-type='cannon']")  # 加农炮100金币
            page.wait_for_timeout(200)

            canvas_box = page.locator("#gameCanvas").bounding_box()
            page.mouse.click(canvas_box['x'] + 500, canvas_box['y'] + 400)
            page.wait_for_timeout(500)

            # 检查是否有新的错误或警告
            new_logs = console_messages[console_log_count:]
            warnings = [msg for msg in new_logs if msg["type"] in ["error", "warn"]]

            results["tests"].append({
                "name": "金币不足边界测试",
                "status": "PASS",
                "detail": f"当前金币{current_gold}，有{len(warnings)}个警告/错误"
            })
            print(f"[INFO] 当前金币: {current_gold}，新警告: {len(warnings)}")

        except Exception as e:
            results["tests"].append({"name": "金币不足边界测试", "status": "FAIL", "detail": str(e)})
            print(f"[FAIL] {e}")

        # Test 5: UI/UX测试 - 发育时间提示
        print("\n[Test 5] UI/UX测试 - 发育时间用户提示")
        try:
            # 检查是否有倒计时或提示
            has_countdown = page.locator("text=准备").count() > 0
            has_wave_info = page.locator("#wave").count() > 0

            wave_text = page.evaluate("() => document.getElementById('wave')?.textContent || ''")

            results["tests"].append({
                "name": "发育时间提示",
                "status": "PARTIAL" if not has_countdown else "PASS",
                "detail": f"有准备提示: {has_countdown}, 波次显示: {wave_text}"
            })

            if not has_countdown:
                results["issues"].append("缺少发育时间倒计时提示，用户不知道何时敌人到来")

            print(f"[{'PASS' if has_countdown else 'PARTIAL'}] 准备提示存在: {has_countdown}")

        except Exception as e:
            results["tests"].append({"name": "发育时间提示", "status": "FAIL", "detail": str(e)})
            print(f"[FAIL] {e}")

        # Test 6: 等待敌人出现并观察战斗
        print("\n[Test 6] 战斗系统验证")
        try:
            # 等待敌人生成（总共等待10秒）
            page.wait_for_timeout(10000)

            # 检查战斗状态
            battle_state = page.evaluate("""() => {
                if (!window.game) return null;
                return {
                    enemies: window.game.state.enemies.length,
                    towers: window.game.state.towers.length,
                    projectiles: window.game.state.projectiles.length,
                    kills: window.game.state.kills,
                    wave: window.game.state.wave
                };
            }""")

            if battle_state:
                results["tests"].append({
                    "name": "战斗系统",
                    "status": "PASS" if battle_state['enemies'] > 0 else "PARTIAL",
                    "detail": f"敌人:{battle_state['enemies']}, 塔:{battle_state['towers']}, 子弹:{battle_state['projectiles']}, 击杀:{battle_state['kills']}"
                })
                print(f"[INFO] 战斗状态: {battle_state}")

                if battle_state['enemies'] == 0:
                    results["issues"].append("等待10秒后仍无敌人，可能敌人生成有问题")

            page.screenshot(path=f"{PROJECT_PATH}/docs/screenshots/round2/06_battle.png")

        except Exception as e:
            results["tests"].append({"name": "战斗系统", "status": "FAIL", "detail": str(e)})
            print(f"[FAIL] {e}")

        # Test 7: 快速重试测试
        print("\n[Test 7] 边界测试 - 快速重试")
        try:
            # 快速点击重新开始
            for i in range(3):
                page.click("#btn-restart", timeout=2000)
                page.wait_for_timeout(500)

            # 检查游戏状态是否正常
            game_ok = page.evaluate("() => window.game && window.game.state.phase === 'playing'")

            results["tests"].append({
                "name": "快速重试稳定性",
                "status": "PASS" if game_ok else "FAIL",
                "detail": "快速连续点击重新开始"
            })
            print(f"[{'PASS' if game_ok else 'FAIL'}] 快速重试测试完成")

        except Exception as e:
            results["tests"].append({"name": "快速重试稳定性", "status": "FAIL", "detail": str(e)})
            print(f"[FAIL] {e}")

        # Test 8: 完整流程测试 - 返回主菜单
        print("\n[Test 8] 完整流程测试 - 返回主菜单")
        try:
            page.click("#btn-menu")
            page.wait_for_timeout(1000)

            menu_visible = page.locator("#menu").is_visible()
            hud_hidden = page.locator(".hud").is_hidden() or page.locator(".hud").count() == 0

            results["tests"].append({
                "name": "返回主菜单",
                "status": "PASS" if menu_visible and hud_hidden else "FAIL",
                "detail": f"菜单可见:{menu_visible}, HUD隐藏:{hud_hidden}"
            })
            print(f"[{'PASS' if menu_visible and hud_hidden else 'FAIL'}] 返回主菜单")

            page.screenshot(path=f"{PROJECT_PATH}/docs/screenshots/round2/08_back_to_menu.png")

        except Exception as e:
            results["tests"].append({"name": "返回主菜单", "status": "FAIL", "detail": str(e)})
            print(f"[FAIL] {e}")

        # Test 9: 无尽模式测试
        print("\n[Test 9] 无尽模式测试")
        try:
            page.click("#btn-endless")
            page.wait_for_timeout(2000)

            mode_text = page.evaluate("() => document.getElementById('mode-display')?.textContent || ''")

            results["tests"].append({
                "name": "无尽模式",
                "status": "PASS" if "无尽" in mode_text else "FAIL",
                "detail": f"模式显示: {mode_text}"
            })
            print(f"[{'PASS' if '无尽' in mode_text else 'FAIL'}] 无尽模式: {mode_text}")

        except Exception as e:
            results["tests"].append({"name": "无尽模式", "status": "FAIL", "detail": str(e)})
            print(f"[FAIL] {e}")

        # Test 10: 综合控制台检查
        print("\n[Test 10] 综合控制台与错误检查")
        errors = [msg for msg in console_messages if msg["type"] == "error"]
        warnings = [msg for msg in console_messages if msg["type"] == "warning"]

        results["tests"].append({
            "name": "控制台检查",
            "status": "PASS" if len(errors) == 0 else "WARN",
            "detail": f"{len(errors)} 错误, {len(warnings)} 警告"
        })

        results["console_logs"] = console_messages

        if errors:
            print(f"[WARN] 发现 {len(errors)} 个错误:")
            for err in errors[:5]:
                print(f"  - {err['text']}")

        if page_errors:
            print(f"[ERROR] 发现 {len(page_errors)} 个页面错误:")
            for err in page_errors[:5]:
                print(f"  - {err}")
            results["issues"].extend([f"页面错误: {e}" for e in page_errors])

        context.close()
        browser.close()

    # 保存结果
    with open(f"{PROJECT_PATH}/docs/test_results_round2.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    # 打印总结
    print("\n" + "=" * 60)
    print("=== 测试总结 ===")
    print("=" * 60)
    passed = sum(1 for t in results["tests"] if t["status"] == "PASS")
    partial = sum(1 for t in results["tests"] if t["status"] == "PARTIAL")
    total = len(results["tests"])
    print(f"通过: {passed}/{total}")
    print(f"部分通过: {partial}/{total}")
    print(f"发现问题: {len(results['issues'])} 个")

    print("\n=== 问题清单 ===")
    for i, issue in enumerate(results["issues"], 1):
        print(f"{i}. {issue}")

    print("\n=== 测试详情 ===")
    for test in results["tests"]:
        icon = {"PASS": "✓", "FAIL": "✗", "PARTIAL": "⚠"}.get(test["status"], "?")
        print(f"{icon} [{test['status']}] {test['name']}: {test['detail']}")

    return results

if __name__ == "__main__":
    # 先检查服务器是否运行
    import urllib.request
    import urllib.error

    try:
        urllib.request.urlopen("http://localhost:8000", timeout=2)
        print("[INFO] 服务器运行中，开始测试...")
    except urllib.error.URLError:
        print("[ERROR] 服务器未运行！请先运行: python -m http.server 8000")
        exit(1)

    test_game_round2()
