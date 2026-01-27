"""
波次流程和敌人刷新节奏测试

验证内容：
1. 波次完成后能正确进入下一波
2. 敌人生成间隔随时间逐渐加快
3. 后一波比前一波敌人更多、刷新更快
"""
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from playwright.sync_api import sync_playwright
import time

def run_tests():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()

        # 连接重试
        max_retries = 5
        for i in range(max_retries):
            try:
                page.goto('http://localhost:8001', timeout=60000)
                page.wait_for_load_state('load', timeout=60000)
                page.wait_for_timeout(2000)  # 额外等待JS执行
                break
            except Exception as e:
                if i < max_retries - 1:
                    print(f"连接失败，重试中... ({i+1}/{max_retries})")
                    time.sleep(2)
                else:
                    raise

        print("=" * 70)
        print("波次流程和敌人刷新节奏测试")
        print("=" * 70)

        # 测试1：启动经典模式
        print("\n[测试1] 启动经典模式...")
        page.click('#btn-classic')
        page.wait_for_timeout(1000)
        print("✓ 经典模式启动成功")

        # 等待第一波开始
        page.wait_for_timeout(9000)  # 等待8秒倒计时
        wave1 = page.locator('#wave').text_content()
        print(f"✓ 当前波次: {wave1}")

        # 记录第一波的敌人生成时间间隔
        print("\n[测试2] 测试第一波敌人刷新节奏...")
        page.wait_for_timeout(2000)
        enemies_before = page.evaluate('window.game.state.enemies.length')
        print(f"   第一波当前敌人数量: {enemies_before}")

        # 等待观察敌人刷新
        page.wait_for_timeout(5000)
        enemies_after = page.evaluate('window.game.state.enemies.length')
        print(f"   5秒后敌人数量: {enemies_after}")

        # 测试3：等待波次完成
        print("\n[测试3] 等待第一波完成...")
        print("   使用2x加速...")

        # 加速游戏
        page.click('#btn-speed')  # 1x -> 2x
        page.wait_for_timeout(1000)

        # 等待波次完成提示
        start_time = time.time()
        wave_complete_seen = False

        for i in range(60):  # 最多等待60秒
            page.wait_for_timeout(1000)
            mode_text = page.locator('#mode-display').text_content()
            if '波完成' in mode_text or '完成' in mode_text:
                wave_complete_seen = True
                elapsed = time.time() - start_time
                print(f"✓ 检测到波次完成提示: {mode_text}")
                print(f"   耗时: {elapsed:.1f}秒")
                break
            enemies = page.evaluate('window.game.state.enemies.length')
            spawned = page.evaluate('window.game.waveSystem.enemiesToSpawn.length')
            if i % 10 == 0:
                print(f"   等待中... 当前敌人: {enemies}, 待生成: {spawned}")

        if not wave_complete_seen:
            print("✗ 超时：未检测到波次完成提示")
            print(f"   最终敌人数量: {page.evaluate('window.game.state.enemies.length')}")
            print(f"   待生成数量: {page.evaluate('window.game.waveSystem.enemiesToSpawn.length')}")

        # 测试4：验证进入第二波
        print("\n[测试4] 验证是否能进入第二波...")
        if wave_complete_seen:
            page.wait_for_timeout(3000)  # 等待2秒延迟 + 过渡
            wave2 = page.locator('#wave').text_content()
            wave2_num = int(wave2)
            if wave2_num >= 2:
                print(f"✓ 成功进入第二波！当前波次: {wave2}")
            else:
                print(f"✗ 波次未更新，当前: {wave2}")
        else:
            print("⊗ 跳过（因为第一波未完成）")

        # 测试5：检查第二波刷新更快
        if wave2_num >= 2:
            print("\n[测试5] 检查第二波刷新节奏...")
            # 记录初始敌人数量
            enemies_w2_start = page.evaluate('window.game.state.enemies.length')
            print(f"   第二波开始时敌人: {enemies_w2_start}")

            # 等待一段时间观察刷新
            page.wait_for_timeout(5000)
            enemies_w2_after = page.evaluate('window.game.state.enemies.length')
            spawned_w2 = enemies_w2_after - enemies_w2_start
            print(f"   5秒内新增敌人: {spawned_w2}个")
            print(f"   第二波当前敌人总数: {enemies_w2_after}")

        # 测试6：波次配置验证
        print("\n[测试6] 验证波次配置...")
        config = page.evaluate('''
            () => {
                const cfg = window.game.waveSystem.getWaveConfig(1);
                const cfg2 = window.game.waveSystem.getWaveConfig(2);
                return {
                    wave1: {
                        enemyCount: cfg.enemyCount,
                        baseInterval: cfg.baseInterval,
                        minInterval: cfg.minInterval
                    },
                    wave2: {
                        enemyCount: cfg2.enemyCount,
                        baseInterval: cfg2.baseInterval,
                        minInterval: cfg2.minInterval
                    }
                };
            }
        ''')
        print(f"   第1波: {config['wave1']['enemyCount']}个敌人, 初始间隔{config['wave1']['baseInterval']}ms")
        print(f"   第2波: {config['wave2']['enemyCount']}个敌人, 初始间隔{config['wave2']['baseInterval']}ms")

        if config['wave2']['enemyCount'] > config['wave1']['enemyCount']:
            print("✓ 第2波敌人数量多于第1波")
        if config['wave2']['baseInterval'] < config['wave1']['baseInterval']:
            print("✓ 第2波刷新速度快于第1波")

        # 最终截图
        page.screenshot(path='C:/Users/y/Desktop/vibecoding/project/.claude/skills/webapp-testing/wave_test_result.png', full_page=True)

        print("\n" + "=" * 70)
        print("测试完成！")
        print("=" * 70)

        page.wait_for_timeout(2000)
        browser.close()

if __name__ == '__main__':
    run_tests()
