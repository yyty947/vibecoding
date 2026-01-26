// 游戏主类
import { CONFIG } from '../utils/config.js';
import { Renderer } from './Renderer.js';
import { Input } from './Input.js';
import { WaveSystem } from '../systems/WaveSystem.js';
import { UpgradeSystem } from '../systems/UpgradeSystem.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';
import { Projectile } from '../entities/Projectile.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.renderer = new Renderer(canvas);
        this.input = new Input(this, canvas);
        this.waveSystem = null;

        // 游戏状态
        this.state = {
            mode: null,
            phase: 'menu', // menu, playing, gameover
            wave: 0,
            gold: CONFIG.INITIAL_GOLD,
            lives: CONFIG.INITIAL_LIVES,
            level: CONFIG.INITIAL_LEVEL,
            kills: 0,
            enemies: [],
            towers: [],
            projectiles: [],
            effects: []
        };

        this.lastTime = 0;
        this.waveTimer = 0;
    }

    // 初始化游戏
    init() {
        this.renderer.clear();
        this.showMenu();
    }

    // 显示主菜单
    showMenu() {
        this.state.phase = 'menu';
        document.getElementById('menu').classList.remove('hidden');
        document.getElementById('hud').classList.add('hidden');
        document.getElementById('tower-panel').classList.add('hidden');
        document.getElementById('gameover').classList.add('hidden');
    }

    // 开始游戏
    start(mode) {
        this.state.mode = mode;
        this.state.phase = 'playing';
        this.state.wave = 0;
        this.state.gold = CONFIG.INITIAL_GOLD;
        this.state.lives = CONFIG.INITIAL_LIVES;
        this.state.level = CONFIG.INITIAL_LEVEL;
        this.state.kills = 0;
        this.state.enemies = [];
        this.state.towers = [];
        this.state.projectiles = [];
        this.state.effects = [];

        this.waveSystem = new WaveSystem(this);
        this.waveTimer = 0;

        // 记录游戏开始时间，用于倒计时
        this.gameStartTime = performance.now();
        this.preparationActive = true;

        // 更新UI
        document.getElementById('menu').classList.add('hidden');
        document.getElementById('gameover').classList.add('hidden');
        document.getElementById('hud').classList.remove('hidden');
        document.getElementById('tower-panel').classList.remove('hidden');
        document.getElementById('mode-display').textContent = mode === 'classic' ? '经典模式' : '无尽模式';

        // 显示倒计时
        document.getElementById('countdown').classList.remove('hidden');

        this.updateHUD();

        // 发育时间 - 玩家有时间布置防御塔
        setTimeout(() => this.startNextWave(), CONFIG.PREPARATION_TIME);

        // 开始游戏循环
        this.lastTime = performance.now();
        this.loop();
    }

    // 开始下一波
    startNextWave() {
        if (this.state.phase !== 'playing') return;

        this.state.wave++;
        this.waveSystem.startWave(this.state.wave);
        this.preparationActive = false; // 发育时间结束

        // 隐藏倒计时
        const countdown = document.getElementById('countdown');
        if (countdown) countdown.classList.add('hidden');

        this.updateHUD();
    }

    // 游戏主循环
    loop() {
        if (this.state.phase !== 'playing') return;

        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        this.update(deltaTime);
        this.render();

        // 更新倒计时显示
        this.updateCountdown();

        requestAnimationFrame(() => this.loop());
    }

    // 更新游戏逻辑
    update(deltaTime) {
        // 更新波次系统（生成敌人）
        const newEnemy = this.waveSystem.update(deltaTime);
        if (newEnemy === 'waveComplete') {
            // 波次完成
            if (this.waveSystem.isClassicComplete()) {
                this.gameOver(true);
                return;
            }
            // 开始下一波
            setTimeout(() => this.startNextWave(), 2000);
        } else if (newEnemy) {
            this.state.enemies.push(newEnemy);
        }

        // 更新敌人位置
        this.state.enemies.forEach(enemy => enemy.update());

        // 检查敌人是否到达终点
        const reachedEnemies = CollisionSystem.checkEnemiesReachedEnd(this.state.enemies);
        reachedEnemies.forEach(enemy => {
            this.state.lives -= enemy.damage;
            this.state.enemies = this.state.enemies.filter(e => e.id !== enemy.id);
        });

        // 检查游戏结束
        if (this.state.lives <= 0) {
            this.gameOver(false);
            return;
        }

        // 防御塔攻击
        this.state.towers.forEach(tower => {
            const target = CollisionSystem.getTargetInRange(tower, this.state.enemies);
            if (target && tower.canFire(performance.now())) {
                const projectile = tower.fire(target, performance.now());
                if (projectile) {
                    this.state.projectiles.push(new Projectile(projectile));
                }
            }
        });

        // 更新子弹
        this.state.projectiles = this.state.projectiles.filter(proj => {
            const result = proj.update();

            // 检查命中
            if (result === 'hit') {
                const target = this.state.enemies.find(e => e.id === proj.targetId);
                if (target && target.isAlive()) {
                    const killed = target.takeDamage(proj.damage);
                    if (killed) {
                        this.state.kills++;
                        this.state.gold += target.reward;
                        this.state.level = UpgradeSystem.calculateLevel(this.state.kills, this.state.wave);
                        this.state.enemies = this.state.enemies.filter(e => e.id !== target.id);
                        this.addEffect(target.x, target.y);
                        this.updateHUD();
                    }
                }
                return false; // 移除子弹
            }

            return result !== false;
        });

        // 更新特效
        this.state.effects = this.state.effects.filter(effect => {
            effect.age += deltaTime;
            return effect.age < effect.maxAge;
        });

        // 检查是否波次结束
        if (this.state.enemies.length === 0 && this.waveSystem.enemiesToSpawn.length === 0) {
            this.waveSystem.waveInProgress = false;
        }
    }

    // 渲染
    render() {
        this.renderer.clear();
        this.renderer.drawMap();
        this.renderer.drawTowers(this.state.towers);
        this.renderer.drawEnemies(this.state.enemies);
        this.renderer.drawProjectiles(this.state.projectiles);
        this.renderer.drawEffects(this.state.effects);

        // 绘制放置预览
        if (this.input.selectedTowerType) {
            const pos = this.input.getMousePosition();
            const canPlace = CollisionSystem.canPlaceTower(pos.x, pos.y, this.state.towers);
            this.renderer.drawPlacementPreview(pos.x, pos.y, this.input.selectedTowerType, canPlace);
        }
    }

    // 添加爆炸特效
    addEffect(x, y) {
        this.state.effects.push({
            x, y,
            age: 0,
            maxAge: 300,
            size: 20
        });
    }

    // 更新HUD
    updateHUD() {
        document.getElementById('wave').textContent = this.state.wave;
        document.getElementById('lives').textContent = this.state.lives;
        document.getElementById('gold').textContent = this.state.gold;
        document.getElementById('kills').textContent = this.state.kills;
        document.getElementById('level').textContent = this.state.level;
    }

    // 更新倒计时
    updateCountdown() {
        if (!this.preparationActive) return;

        const elapsed = performance.now() - this.gameStartTime;
        const remaining = Math.max(0, Math.ceil((CONFIG.PREPARATION_TIME - elapsed) / 1000));

        const countdownTime = document.getElementById('countdown-time');
        if (countdownTime) {
            countdownTime.textContent = remaining;
        }

        // 如果倒计时结束，隐藏倒计时元素
        if (remaining <= 0) {
            const countdown = document.getElementById('countdown');
            if (countdown) countdown.classList.add('hidden');
        }
    }

    // 升级防御塔
    upgradeTower(tower) {
        const result = UpgradeSystem.upgrade(tower, this.state.gold);
        if (result) {
            this.state.gold -= result.cost;
            this.updateHUD();
            return result;
        }
        return null;
    }

    // 游戏结束
    gameOver(isWin) {
        this.state.phase = 'gameover';
        document.getElementById('hud').classList.add('hidden');
        document.getElementById('tower-panel').classList.add('hidden');
        document.getElementById('upgrade-panel').classList.add('hidden');
        document.getElementById('gameover').classList.remove('hidden');

        // 显示统计
        document.getElementById('final-level').textContent = this.state.level;
        document.getElementById('final-kills').textContent = this.state.kills;
        document.getElementById('final-wave').textContent = this.state.wave;
        document.getElementById('final-mode').textContent = this.state.mode === 'classic' ? '经典模式' : '无尽模式';

        const title = document.getElementById('gameover-title');
        const reason = document.getElementById('gameover-reason');

        if (isWin) {
            title.textContent = '🎉 胜利！';
            title.style.color = '#4aff4a';
            reason.textContent = `你成功抵御了 ${this.state.wave} 波敌军进攻，守住了防线！`;
        } else {
            // 根据失败原因显示不同消息
            if (this.state.lives <= 0) {
                title.textContent = '💀 防线被突破！';
                title.style.color = '#ff4444';
                reason.textContent = `敌军突破了你的防线，你坚持了 ${this.state.wave} 波，击杀了 ${this.state.kills} 个敌人。`;
            } else {
                title.textContent = '游戏结束';
                title.style.color = '#ff4444';
                reason.textContent = '';
            }
        }
    }

    // 重新开始
    restart() {
        this.start(this.state.mode);
    }

    // 返回主菜单
    returnToMenu() {
        this.showMenu();
    }
}
