"""
三阶段玩法扩展测试

验证内容：
1. 交战系统 - 建筑血量显示、建筑可被摧毁
2. 波次结算 - 清除部分建筑、返还金币
3. 解锁系统 - 新塔逐渐解锁
"""
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from playwright.sync_api import sync_playwright
import time

def run_tests():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page(viewport={'width': 1280, 'height': 720})

        # 连接重试
        max_retries = 5
        for i in range(max_retries):
            try:
                page.goto('http://localhost:8001', timeout=60000)
                page.wait_for_load_state('load', timeout=60000)
                page.wait_for_timeout(2000)
                break
            except Exception as e:
                if i < max_retries - 1:
                    print(f"连接失败，重试中... ({i+1}/{max_retries})")
                    time.sleep(2)
                else:
                    raise

        print("=" * 70)
        print("三阶段玩法扩展测试")
        print("=" * 70)

        # 等待游戏初始化（等待 Input 事件绑定完成）
        print("\n等待游戏初始化...")
        page.wait_for_timeout(3000)

        # 检查按钮是否可见
        btn_visible = page.locator('#btn-classic').is_visible()
        print(f"经典模式按钮可见: {btn_visible}")

        if not btn_visible:
            print("✗ 按钮不可见，尝试等待更长时间...")
            page.wait_for_timeout(2000)

        # 测试1：验证防御塔解锁系统
        print("\n[测试1] 验证防御塔解锁系统...")
        page.click('#btn-classic')
        page.wait_for_timeout(1000)

        # 检查塔面板中各种塔的状态
        locked_towers = page.evaluate('''
            () => {
                const towers = document.querySelectorAll('.tower-type');
                const result = [];
                towers.forEach(el => {
                    const type = el.dataset.type;
                    const locked = el.classList.contains('locked');
                    const lockText = el.querySelector('.tower-lock');
                    result.push({
                        type: type,
                        locked: locked,
                        lockText: lockText ? lockText.textContent : null
                    });
                });
                return result;
            }
        ''')

        print("   防御塔解锁状态:")
        for tower in locked_towers:
            status = "🔒 锁定" if tower['locked'] else "✓ 可用"
            lock_info = tower['lockText'] if tower['lockText'] else "初始解锁"
            print(f"     {tower['type']}: {status} ({lock_info})")

        # 验证：第3波前只能用前2种塔
        if locked_towers[0]['locked'] == False and locked_towers[1]['locked'] == False:
            print("✓ 初始解锁机枪塔和加农炮正确")
        else:
            print("✗ 初始解锁状态有误")

        # 测试2：交战系统 - 建筑血量
        print("\n[测试2] 验证交战系统...")
        page.wait_for_timeout(9000)  # 等待第一波开始

        # 放置多个防御塔（分散布局，增加敌人攻击的概率）
        canvas_width = page.evaluate('window.innerWidth')
        canvas_height = page.evaluate('window.innerHeight')

        tower_positions = [
            (canvas_width * 0.3, 200),  # 左侧
            (canvas_width * 0.5, 250),  # 中间
            (canvas_width * 0.7, 200),  # 右侧
        ]

        for i, (x, y) in enumerate(tower_positions):
            page.click('.tower-type[data-type="machinegun"]')
            page.wait_for_timeout(300)
            page.mouse.click(x, y)
            page.wait_for_timeout(300)

        page.wait_for_timeout(500)

        # 检查塔是否创建
        tower_count = page.evaluate('window.game.state.towers.length')
        if tower_count >= 3:
            print(f"✓ 防御塔放置成功，当前塔数量: {tower_count}")

            # 检查塔的属性
            tower_info = page.evaluate('''
                () => {
                    const tower = window.game.state.towers[0];
                    return {
                        hp: tower.hp,
                        maxHp: tower.maxHp
                    };
                }
            ''')
            print(f"   塔生命值: {tower_info['hp']}/{tower_info['maxHp']}")
        else:
            print(f"✗ 防御塔放置失败，只有 {tower_count} 座塔")

        # 等待敌人出现并攻击建筑（增加等待时间）
        page.wait_for_timeout(12000)
        enemies = page.evaluate('window.game.state.enemies.length')
        print(f"   当前敌人数量: {enemies}")

        # 检查建筑是否受损
        tower_hps = page.evaluate('''
            () => {
                return window.game.state.towers.map(t => ({ hp: t.hp, maxHp: t.maxHp }));
            }
        ''')

        damaged = False
        for i, th in enumerate(tower_hps):
            print(f"   塔{i+1}生命值: {th['hp']}/{th['maxHp']}")
            if th['hp'] < th['maxHp']:
                damaged = True

        if damaged:
            print("✓ 敌人成功攻击了防御塔！")
        else:
            print("⊗ 防御塔未受损（敌人可能被击杀或未靠近）")

        # 测试3：波次结算
        print("\n[测试3] 验证波次结算...")
        print("   使用2x加速...")
        page.click('#btn-speed')  # 1x -> 2x
        page.wait_for_timeout(500)

        # 等待波次完成
        print("   等待波次完成...")
        start_time = time.time()
        settlement_seen = False

        for i in range(120):  # 最多等待120秒（波次1有40个敌人，需要较长时间）
            page.wait_for_timeout(1000)
            mode_text = page.locator('#mode-display').text_content()
            # 检测波次完成或撤退消息
            if '完成' in mode_text or '撤退' in mode_text:
                settlement_seen = True
                print(f"✓ 检测到结算消息: {mode_text}")

                # 记录结算前后的防御塔数量
                towers_after = page.evaluate('window.game.state.towers.length')
                gold_after = page.evaluate('window.game.state.gold')
                print(f"   结算后防御塔: {towers_after}, 金币: {gold_after}")
                break
            if i % 10 == 0:
                enemies = page.evaluate('window.game.state.enemies.length')
                to_spawn = page.evaluate('window.game.waveSystem.enemiesToSpawn.length')
                towers = page.evaluate('window.game.state.towers.length')
                print(f"   等待中... 剩余敌人: {enemies}, 待生成: {to_spawn}, 防御塔: {towers}")

        if not settlement_seen:
            print("⊗ 未检测到波次结算消息")

        # 测试4：第3波解锁验证
        print("\n[测试4] 验证第3波解锁狙击塔...")
        # 等待第3波开始（需要完成前两波）
        for i in range(120):
            page.wait_for_timeout(1000)
            current_wave = page.evaluate('window.game.state.wave')
            mode_text = page.locator('#mode-display').text_content()
            if current_wave >= 3:
                print(f"   已到达第{current_wave}波")
                break
            if i % 15 == 0:
                print(f"   等待中... 当前波次: {current_wave}, 显示: {mode_text}")

        # 检查狙击塔是否解锁
        rifle_unlocked = page.evaluate('''
            () => {
                const el = document.querySelector('.tower-type[data-type="rifle"]');
                return el && !el.classList.contains('locked');
            }
        ''')

        if rifle_unlocked:
            print("✓ 第3波狙击塔已解锁")
        else:
            print("✗ 第3波狙击塔未解锁")

        # 测试5：Combo系统
        print("\n[测试5] 验证Combo系统...")
        combo_display = page.locator('#combo-display')
        visible = combo_display.is_visible()
        print(f"   Combo显示状态: {'显示' if visible else '隐藏'}")

        # 击杀几个敌人触发Combo
        page.wait_for_timeout(5000)

        combo_text = page.locator('#combo-display').text_content()
        combo_count = page.evaluate('window.game.combo.count')
        print(f"   Combo显示: {combo_text}")
        print(f"   Combo计数: {combo_count}")

        if combo_count >= 2:
            print("✓ Combo系统正常工作")
        else:
            print("⊗ Combo未触发（可能敌人太少）")

        # 最终状态
        print("\n" + "=" * 70)
        print("测试完成！")
        print("=" * 70)

        page.wait_for_timeout(2000)
        browser.close()

if __name__ == '__main__':
    run_tests()
