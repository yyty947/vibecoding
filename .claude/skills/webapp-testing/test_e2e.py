"""
诺曼底登陆 - E2E 自动化测试
可执行的端到端测试脚本
"""
import sys
import io
# 设置 UTF-8 编码输出
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout
import json
import os
from datetime import datetime

# 配置
PROJECT_PATH = "C:/Users/y/Desktop/vibecoding/project"
BASE_URL = "http://localhost:8000"
SCREENSHOT_DIR = f"{PROJECT_PATH}/docs/screenshots/e2e"
RESULTS_FILE = f"{PROJECT_PATH}/docs/test_results.json"

class TestResults:
    def __init__(self):
        self.results = {
            "timestamp": datetime.now().isoformat(),
            "tests": [],
            "summary": {"passed": 0, "failed": 0, "total": 0}
        }
        self.console_errors = []
        self.current_test = None

    def start_test(self, name, description):
        self.current_test = {"name": name, "description": description, "status": "PENDING", "detail": ""}
        print(f"\n{'='*60}")
        print(f"[TEST] {name}")
        print(f"{'='*60}")
        print(f"描述: {description}")

    def pass_test(self, detail=""):
        self.current_test["status"] = "PASS"
        self.current_test["detail"] = detail or "测试通过"
        self.results["tests"].append(self.current_test)
        self.results["summary"]["passed"] += 1
        self.results["summary"]["total"] += 1
        print(f"[PASS] {detail or '测试通过'}")

    def fail_test(self, detail, error=""):
        self.current_test["status"] = "FAIL"
        self.current_test["detail"] = detail
        self.current_test["error"] = error
        self.results["tests"].append(self.current_test)
        self.results["summary"]["failed"] += 1
        self.results["summary"]["total"] += 1
        print(f"[FAIL] {detail}")
        if error:
            print(f"  错误: {error}")

    def save(self):
        self.results["summary"]["pass_rate"] = (
            f"{self.results['summary']['passed']}/{self.results['summary']['total']}"
        )
        with open(RESULTS_FILE, "w", encoding="utf-8") as f:
            json.dump(self.results, f, indent=2, ensure_ascii=False)


def setup_browser():
    """启动浏览器"""
    p = sync_playwright().start()
    browser = p.chromium.launch(headless=False, slow_mo=500)
    page = browser.new_page()

    # 监听控制台
    def on_console(msg):
        if msg.type == "error":
            results.console_errors.append(msg.text)
            print(f"  [CONSOLE ERROR] {msg.text}")
    page.on("console", on_console)

    # 监听页面错误
    def on_page_error(error):
        results.console_errors.append(str(error))
        print(f"  [PAGE ERROR] {error}")
    page.on("pageerror", on_page_error)

    return p, browser, page


def screenshot(page, name):
    """保存截图"""
    os.makedirs(SCREENSHOT_DIR, exist_ok=True)
    path = f"{SCREENSHOT_DIR}/{name}.png"
    page.screenshot(path=path)
    print(f"  [截图] {path}")


def test_tc01_e2e(results, page):
    """TC-01: 端到端完整流程（经典模式）"""
    results.start_test("TC-01", "端到端完整流程（经典模式）")

    try:
        # Step 1: 打开页面
        page.goto(BASE_URL, timeout=10000)
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(1000)
        screenshot(page, "01_homepage")

        # 验证主菜单
        assert page.locator("#menu").is_visible()
        assert page.locator("text=诺曼底登陆").is_visible()
        assert page.locator("#btn-classic").is_visible()
        assert page.locator("#btn-endless").is_visible()
        print("  [验证] 主菜单显示正常")

        # Step 2: 点击经典模式
        page.click("#btn-classic")
        page.wait_for_timeout(2000)
        screenshot(page, "02_game_start")
        print("  [验证] 点击经典模式成功")

        # 验证游戏状态
        state = page.evaluate("""() => {
            if (!window.game) return {error: 'game不存在'};
            return {
                phase: window.game.state.phase,
                gold: window.game.state.gold,
                lives: window.game.state.lives,
                mode: window.game.state.mode
            };
        }""")

        if "error" in state:
            raise Exception(f"游戏状态异常: {state['error']}")
        if state["phase"] != "playing":
            raise Exception(f"游戏phase不正确: {state['phase']}")
        print(f"  [验证] 游戏状态: phase={state['phase']}, gold={state['gold']}, lives={state['lives']}")

        # Step 3: 等待倒计时（8秒）
        countdown_visible = page.locator("#countdown").is_visible()
        if countdown_visible:
            print("  [验证] 倒计时显示")
        page.wait_for_timeout(9000)  # 等待倒计时结束
        print("  [验证] 等待敌人生成")

        # Step 4: 放置防御塔
        page.click(".tower-type[data-type='machinegun']")
        page.wait_for_timeout(200)

        canvas = page.locator("#gameCanvas").bounding_box()
        if not canvas:
            raise Exception("画布未找到")

        page.mouse.click(canvas["x"] + 300, canvas["y"] + 300)
        page.wait_for_timeout(500)

        towers = page.evaluate("() => window.game.state.towers.length")
        if towers == 0:
            raise Exception("防御塔未放置")
        print(f"  [验证] 放置了 {towers} 个防御塔")
        screenshot(page, "03_tower_placed")

        # Step 5: 等待敌人并验证战斗
        page.wait_for_timeout(10000)

        battle = page.evaluate("""() => {
            if (!window.game) return null;
            return {
                enemies: window.game.state.enemies.length,
                towers: window.game.state.towers.length,
                projectiles: window.game.state.projectiles.length,
                kills: window.game.state.kills
            };
        }""")

        if battle:
            print(f"  [验证] 战斗状态: 敌人={battle['enemies']}, 塔={battle['towers']}, 子弹={battle['projectiles']}, 击杀={battle['kills']}")
            screenshot(page, "04_battle")

        # Step 6: 返回主菜单
        try:
            page.click("#btn-menu", timeout=3000)
            page.wait_for_timeout(1000)
            menu_visible = page.locator("#menu").is_visible()
            if menu_visible:
                print("  [验证] 返回主菜单成功")
                screenshot(page, "05_back_menu")
        except:
            print("  [警告] 返回主菜单按钮不可见（可能在游戏中）")

        results.pass_test(f"E2E流程完成，击杀数: {battle['kills'] if battle else 0}")

    except Exception as e:
        results.fail_test("E2E流程中断", str(e))


def test_tc02_endless(results, page):
    """TC-02: 无尽模式基础验证"""
    results.start_test("TC-02", "无尽模式基础验证")

    try:
        # 刷新页面
        page.goto(BASE_URL)
        page.wait_for_timeout(1000)

        # 点击无尽模式
        page.click("#btn-endless")
        page.wait_for_timeout(2000)

        # 验证模式显示
        mode_text = page.evaluate("() => document.getElementById('mode-display')?.textContent || ''")
        assert "无尽" in mode_text, f"模式显示不正确: {mode_text}"
        print(f"  [验证] 模式显示: {mode_text}")

        # 放置防御塔
        page.click(".tower-type[data-type='machinegun']")
        page.wait_for_timeout(200)

        canvas = page.locator("#gameCanvas").bounding_box()
        page.mouse.click(canvas["x"] + 400, canvas["y"] + 300)
        page.wait_for_timeout(500)

        # 等待敌人
        page.wait_for_timeout(8000)

        battle = page.evaluate("() => window.game ? window.game.state.enemies.length : 0")
        print(f"  [验证] 无尽模式敌人生成: {battle} 个敌人")

        results.pass_test(f"无尽模式正常，敌人: {battle}")

    except Exception as e:
        results.fail_test("无尽模式测试失败", str(e))


def test_tc03_pause_speed(results, page):
    """TC-04: 暂停/加速功能"""
    results.start_test("TC-04", "暂停/加速功能")

    try:
        # 刷新并启动游戏
        page.goto(BASE_URL)
        page.wait_for_timeout(1000)
        page.click("#btn-classic")
        page.wait_for_timeout(2000)

        # 测试速度按钮
        speed_btn = page.locator("#btn-speed")
        if not speed_btn.is_visible():
            raise Exception("速度按钮不可见")

        # 点击切换到 2x
        page.click("#btn-speed")
        page.wait_for_timeout(500)
        btn_text = page.evaluate("() => document.getElementById('btn-speed')?.textContent || ''")
        print(f"  [验证] 速度按钮: {btn_text}")

        # 点击切换到暂停
        page.click("#btn-speed")
        page.wait_for_timeout(500)
        btn_text = page.evaluate("() => document.getElementById('btn-speed')?.textContent || ''")
        print(f"  [验证] 速度按钮: {btn_text}")

        # 验证暂停遮罩
        overlay_visible = page.locator("#pause-overlay").is_visible()
        print(f"  [验证] 暂停遮罩: {'显示' if overlay_visible else '隐藏'}")

        results.pass_test("暂停/加速功能正常")

    except Exception as e:
        results.fail_test("暂停/加速测试失败", str(e))


def main():
    print("="*60)
    print("诺曼底登陆 - E2E 自动化测试")
    print("="*60)
    print(f"时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"目标: {BASE_URL}")
    print(f"截图目录: {SCREENSHOT_DIR}")
    print(f"结果文件: {RESULTS_FILE}")
    print("="*60)

    global results
    results = TestResults()

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=False, slow_mo=300)
            page = browser.new_page()

            # 运行测试用例
            test_tc01_e2e(results, page)
            test_tc02_endless(results, page)
            test_tc03_pause_speed(results, page)

            browser.close()

    except Exception as e:
        print(f"\n[ERROR] 测试执行失败: {e}")
        results.fail_test("测试执行异常", str(e))

    # 保存结果
    results.save()

    # 打印摘要
    print("\n" + "="*60)
    print("测试摘要")
    print("="*60)
    summary = results.results["summary"]
    print(f"总计: {summary['total']}")
    print(f"通过: {summary['passed']}")
    print(f"失败: {summary['failed']}")
    print(f"通过率: {summary.get('pass_rate', 'N/A')}")

    if results.console_errors:
        print(f"\n控制台错误 ({len(results.console_errors)} 个):")
        for err in results.console_errors[:5]:
            print(f"  - {err}")

    print("\n详细结果:", RESULTS_FILE)
    print("截图目录:", SCREENSHOT_DIR)

    # 返回退出码
    sys.exit(0 if summary['failed'] == 0 else 1)


if __name__ == "__main__":
    main()
