// 游戏主类
import { CONFIG } from '../utils/config.js';
import { Renderer } from './Renderer.js';
import { Input } from './Input.js';
import { WaveSystem } from '../systems/WaveSystem.js';
import { UpgradeSystem } from '../systems/UpgradeSystem.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';
import { Projectile } from '../entities/Projectile.js';
import { Tower } from '../entities/Tower.js';
import { DamageSystem } from '../systems/DamageSystem.js';
import { EffectManager } from '../systems/EffectManager.js';
import { getSoundManager } from '../utils/SoundManager.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.renderer = new Renderer(canvas);
        this.input = new Input(this, canvas);
        this.waveSystem = null;

        // 游戏状态
        this.state = {
            mode: null,
            phase: 'menu', // menu, playing, paused, gameover
            wave: 0,
            gold: CONFIG.INITIAL_GOLD,
            lives: CONFIG.INITIAL_LIVES,
            level: CONFIG.INITIAL_LEVEL,
            kills: 0,
            enemies: [],
            towers: [],
            projectiles: [],
            effects: [],
            // 塔类型全局等级（从 Tower.js 移入，解决多窗口干扰问题）
            towerLevels: {
                machinegun: 1,
                cannon: 1,
                rifle: 1,
                laser: 1,
                em: 1,
                rocket: 1
            }
        };

        this.lastTime = 0;
        this.waveTimer = 0;

        // 速度控制：1=正常, 2=加速
        this.gameSpeed = 1;
        this.speedOptions = [1, 2]; // 正常, 加速
        this.speedIndex = 0; // 默认正常速度

        // 暂停相关时间补偿
        this.pauseStartTime = 0;      // 暂停开始时间
        this.totalPausedTime = 0;     // 本轮准备期间累计暂停时间

        // 波次完成定时器（防止重复触发）
        this.waveCompleteTimer = null;

        // 波次结算标志（防止重复结算）
        this.waveSettlementDone = false;

        // 连击（Combo）系统状态
        this.combo = {
            count: 0,              // 当前连击数
            lastKillTime: 0,       // 上次击杀时间
            multiplier: 1          // 当前倍率
        };

        // 效果管理器（替代散落的 setTimeout）
        this.effectManager = new EffectManager();
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
        document.getElementById('upgrade-panel').classList.add('hidden');
        document.getElementById('gameover').classList.add('hidden');
        document.getElementById('pause-menu').classList.add('hidden');

        // 清空游戏状态和画布
        this.state.enemies = [];
        this.state.towers = [];
        this.state.projectiles = [];
        this.state.effects = [];
        this.renderer.clear();
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

        // 重置防御塔全局等级（防止继承上一局等级）
        Tower.resetGlobalLevels(this.state.towerLevels);

        this.waveSystem = new WaveSystem(this);
        this.waveTimer = 0;

        // 清除之前的波次完成定时器
        if (this.waveCompleteTimer) {
            clearTimeout(this.waveCompleteTimer);
            this.waveCompleteTimer = null;
        }

        // 重置波次结算标志
        this.waveSettlementDone = false;

        // 重置 Combo 状态
        this.combo = {
            count: 0,
            lastKillTime: 0,
            multiplier: 1
        };

        // 记录游戏开始时间，用于倒计时
        this.gameStartTime = performance.now();
        this.preparationActive = true;
        
        // 重置暂停时间补偿
        this.pauseStartTime = 0;
        this.totalPausedTime = 0;

        // 重置速度
        this.speedIndex = 0;
        this.gameSpeed = 1;

        // 更新UI
        document.getElementById('menu').classList.add('hidden');
        document.getElementById('gameover').classList.add('hidden');
        document.getElementById('hud').classList.remove('hidden');
        document.getElementById('tower-panel').classList.remove('hidden');
        document.getElementById('upgrade-panel').classList.remove('hidden');
        document.getElementById('mode-display').textContent = mode === 'classic' ? '经典模式' : '无尽模式';

        // 显示倒计时
        document.getElementById('countdown').classList.remove('hidden');

        // 初始化速度按钮
        this.updateSpeedButton();

        this.updateHUD();
        this.updateTowerPanel();
        this.updateUpgradeButtons();

        // 准备时间由 updateCountdown 在游戏循环中处理，不再使用 setTimeout
        // 这样暂停时可以正确停止倒计时

        // 开始游戏循环
        this.lastTime = performance.now();
        this.loop();
    }

    // 开始下一波
    startNextWave() {
        if (this.state.phase !== 'playing') return;

        // 重置波次结算标志，允许新波次进行结算
        this.waveSettlementDone = false;

        // 扣除塔维护费用（方案A：等级相关维护费 = 等级 × 10金/波）
        let maintenanceCost = 0;
        this.state.towers.forEach(tower => {
            maintenanceCost += Tower.getMaintenanceCostPerTower(tower.level);
        });
        // 使用 state.towerLevels 计算放置成本（已包含等级税收）
        if (maintenanceCost > 0) {
            this.state.gold = Math.max(0, this.state.gold - maintenanceCost);
            // 显示维护费用提示（如果费用显著）
            if (maintenanceCost >= 20) {
                const modeDisplay = document.getElementById('mode-display');
                if (modeDisplay && this.state.wave > 0) {
                    setTimeout(() => {
                        modeDisplay.textContent = `🔧 维护费用: -${maintenanceCost}金币 (${this.state.towers.length}座塔)`;
                        modeDisplay.style.color = '#ffaa00';
                    }, 100);
                }
            }
        }

        this.state.wave++;
        this.waveSystem.startWave(this.state.wave);
        this.preparationActive = false; // 发育时间结束

        // 隐藏倒计时
        const countdown = document.getElementById('countdown');
        if (countdown) countdown.classList.add('hidden');

        // 显示波次提示（在模式显示位置）
        const modeDisplay = document.getElementById('mode-display');
        if (modeDisplay) {
            modeDisplay.style.color = ''; // 重置颜色
            if (this.state.mode === 'classic') {
                const totalWaves = CONFIG.WAVES.classic.totalWaves;
                const currentWave = this.state.wave;
                modeDisplay.textContent = `第${currentWave}/${totalWaves}波`;
            } else {
                modeDisplay.textContent = `无尽模式 - 第${this.state.wave}波`;
            }
        }

        // 显示升级面板（修复Bug #1）
        const upgradePanel = document.getElementById('upgrade-panel');
        if (upgradePanel) upgradePanel.classList.remove('hidden');

        this.updateHUD();
        this.updateTowerPanel();
    }

    // 游戏主循环
    loop() {
        if (this.state.phase !== 'playing' && this.state.phase !== 'paused') return;

        const currentTime = performance.now();
        let deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        // 暂停时不更新逻辑，但继续渲染
        if (this.state.phase === 'playing') {
            // 应用游戏速度
            deltaTime *= this.gameSpeed;

            this.update(deltaTime);
        }

        this.render();

        // 更新倒计时显示（暂停时不更新）
        if (this.state.phase === 'playing') {
            this.updateCountdown();
        }

        requestAnimationFrame(() => this.loop());
    }

    // 更新游戏逻辑
    update(deltaTime) {
        const currentTime = performance.now();

        // 检查 Combo 是否超时（在非暂停状态下）
        if (this.combo.count > 0 && performance.now() - this.combo.lastKillTime > CONFIG.COMBO.windowMs) {
            this.combo.count = 0;
            this.combo.multiplier = 1;
            this.updateHUD();
        }

        // 更新波次系统（生成敌人）
        const newEnemy = this.waveSystem.update(deltaTime);
        if (newEnemy) {
            this.state.enemies.push(newEnemy);
        }

        // 更新敌人位置
        this.state.enemies.forEach(enemy => enemy.update(deltaTime));

        // 敌人攻击防御塔（使用 deltaTime 支持游戏速度调整）
        this.state.enemies.forEach(enemy => {
            const target = enemy.canAttackTowerWithDeltaTime(deltaTime, this.state.towers);
            if (target && target.isAlive()) {
                enemy.attackTowerWithDeltaTime(target);
            }
        });

        // 移除被摧毁的防御塔
        const aliveTowers = this.state.towers.filter(tower => tower.isAlive());
        if (aliveTowers.length !== this.state.towers.length) {
            this.state.towers = aliveTowers;
            // 注：旧代码曾在此隐藏单个塔升级面板，现已改为全局升级面板无需此操作
        }

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

        // 防御塔攻击（使用 deltaTime 支持游戏速度调整）
        const soundManager = getSoundManager();
        this.state.towers.forEach(tower => {
            const target = CollisionSystem.getTargetInRange(tower, this.state.enemies);
            if (target && tower.canFireWithDeltaTime(deltaTime)) {
                const projectile = tower.fireWithDeltaTime(target);
                if (projectile) {
                    this.state.projectiles.push(new Projectile(projectile));
                    // 播放开火音效
                    if (soundManager) {
                        const soundName = tower.getSoundName();
                        if (soundName) {
                            soundManager.play(soundName);
                        }
                    }
                }
            }
        });

        // 更新子弹
        this.state.projectiles = this.state.projectiles.filter(proj => {
            const result = proj.update(deltaTime);

            // 检查命中
            if (result === 'hit') {
                const target = this.state.enemies.find(e => e.id === proj.targetId);
                if (target && target.isAlive()) {
                    // 获取子弹来源的塔
                    const sourceTower = this.state.towers.find(t => t.id === proj.sourceTowerId);
                    
                    // 伤害计算已移至 DamageSystem.calculateDamage()
                    
                    // 使用 DamageSystem 计算伤害（替代内联逻辑）
                    const damageResult = DamageSystem.calculateDamage(proj, target, sourceTower, this.state.wave);
                    let actualDamage = damageResult.damage;
                    
                    // 处理溅射伤害（如果有）
                    const towerConfig = sourceTower ? CONFIG.TOWERS[sourceTower.type] : null;
                    const splashRadius = towerConfig ? towerConfig.splashRadius : 0;
                    if (splashRadius && splashRadius > 0) {
                        // 对范围内所有敌人造成伤害
                        this.state.enemies.forEach(enemy => {
                            if (enemy.isAlive() && enemy.id !== target.id) {
                                const dist = Math.hypot(enemy.x - target.x, enemy.y - target.y);
                                if (dist <= splashRadius) {
                                    const splashDamage = DamageSystem.calculateSplashDamage(actualDamage, sourceTower, enemy);
                                    enemy.takeDamage(splashDamage);
                                }
                            }
                        });
                    }
                    
                    // 处理减速效果（使用 EffectManager）
                    const slowEffect = DamageSystem.getSlowEffectInfo(towerConfig);
                    if (slowEffect) {
                        this.effectManager.addEffect('slow', target, slowEffect.duration, null, slowEffect.data);
                    }
                    
                    // 处理眩晕效果（电磁塔计数机制，使用 EffectManager）
                    const stunEffect = DamageSystem.getStunEffectInfo(damageResult.isStun, damageResult.stunDuration);
                    if (stunEffect) {
                        this.effectManager.addEffect('stun', target, stunEffect.duration);
                    }
                    
                    const killed = target.takeDamage(actualDamage);
                    if (killed) {
                        this.state.kills++;
                        // 更新 Combo
                        this.updateCombo();
                        // 获取基于波次的实际奖励（极限紧缩）
                        const baseReward = CONFIG.getEnemyReward(target.type, this.state.wave);
                        // 应用 Combo 倍率到金币奖励
                        this.state.gold += Math.floor(baseReward * this.combo.multiplier);
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

        // 更新效果管理器（处理眩晕、减速等延时效果）
        this.effectManager.update(deltaTime, this.state.phase === 'paused');

        // 检查波次是否完成（仅在波次开始后检查）
        if (this.state.wave > 0 && this.waveSystem.isWaveComplete() && !this.waveSettlementDone) {
            // 执行波次结算（清除部分防御塔）
            this.waveSettlementDone = true;
            this.processWaveSettlement();

            // 检查是否通关（经典模式）
            if (this.waveSystem.isClassicComplete()) {
                this.gameOver(true);
                return;
            }

            // 显示波次完成提示并开始下一波（只触发一次）
            if (!this.waveCompleteTimer) {
                const modeDisplay = document.getElementById('mode-display');
                if (modeDisplay) {
                    modeDisplay.textContent = `✅ 第${this.state.wave}波完成！`;
                    modeDisplay.style.color = '#4aff4a';
                }

                // 延迟后进入下一波准备阶段
                const delay = CONFIG.WAVE_MECHANICS.waveCompleteDelay;
                this.waveCompleteTimer = setTimeout(() => {
                    this.waveCompleteTimer = null;
                    // 进入准备阶段（倒计时）
                    this.preparationActive = true;
                    this.gameStartTime = performance.now();
                    
                    // 重置暂停时间补偿
                    this.pauseStartTime = 0;
                    this.totalPausedTime = 0;
                    // 显示准备倒计时
                    const countdown = document.getElementById('countdown');
                    if (countdown) countdown.classList.remove('hidden');
                    // 显示升级面板（修复Bug #2：准备期应该可以升级）
                    const upgradePanel = document.getElementById('upgrade-panel');
                    if (upgradePanel) upgradePanel.classList.remove('hidden');
                    // 准备时间由 updateCountdown 在游戏循环中处理，不再使用 setTimeout
                }, delay);
            }
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

    // 更新 Combo 系统
    updateCombo() {
        const now = performance.now();
        const comboWindow = CONFIG.COMBO.windowMs;

        // 检查是否在 Combo 时间窗口内
        if (now - this.combo.lastKillTime <= comboWindow) {
            // 在窗口内，增加 Combo 数
            this.combo.count++;
        } else {
            // 超出窗口，重置 Combo
            this.combo.count = 1;
        }

        // 更新最后击杀时间
        this.combo.lastKillTime = now;

        // 计算当前倍率
        this.combo.multiplier = this.calculateComboMultiplier();
    }

    // 计算 Combo 倍率
    calculateComboMultiplier() {
        const steps = CONFIG.COMBO.multiplierSteps;
        let multiplier = 1;

        for (const step of steps) {
            if (this.combo.count >= step.kills) {
                multiplier = step.mult;
            } else {
                break;
            }
        }

        return Math.min(multiplier, CONFIG.COMBO.maxMultiplier);
    }

    // 更新HUD
    updateHUD() {
        document.getElementById('wave').textContent = this.state.wave;
        document.getElementById('lives').textContent = this.state.lives;
        document.getElementById('gold').textContent = this.state.gold;
        document.getElementById('kills').textContent = this.state.kills;
        document.getElementById('level').textContent = this.state.level;

        // 更新 Combo 显示
        const comboEl = document.getElementById('combo-display');
        if (comboEl) {
            if (this.combo.count >= 2) {
                comboEl.textContent = `Combo x${this.combo.count}! 💥`;
                comboEl.style.display = 'inline';
                // 根据倍率显示不同颜色
                if (this.combo.multiplier >= 3) {
                    comboEl.style.color = '#ff4a4a'; // 红色 - 最高倍率
                } else if (this.combo.multiplier >= 2) {
                    comboEl.style.color = '#ffaa00'; // 橙色
                } else {
                    comboEl.style.color = '#4aff4a'; // 绿色
                }
            } else {
                comboEl.style.display = 'none';
            }
        }

        // 实时更新所有升级按钮状态
        this.updateUpgradeButtons();
    }

    // 更新防御塔面板（锁定状态）
    updateTowerPanel() {
        const towerTypes = document.querySelectorAll('.tower-type');
        towerTypes.forEach(element => {
            const type = element.dataset.type;
            const config = CONFIG.TOWERS[type];
            if (config) {
                const unlockWave = config.unlockWave || 0;
                if (this.state.wave < unlockWave) {
                    element.classList.add('locked');
                } else {
                    element.classList.remove('locked');
                }
                
                // 更新放置成本显示（等级税收）
                const costElement = element.querySelector('.tower-cost');
                if (costElement) {
                    const placementCost = Tower.getPlacementCost(type, this.state.towerLevels);
                    const level = Tower.getGlobalLevel(type, this.state.towerLevels);
                    if (level > 1) {
                        costElement.textContent = `💰 ${placementCost} (Lv.${level})`;
                    } else {
                        costElement.textContent = `💰 ${placementCost}`;
                    }
                }
            }
        });
    }

    // 更新倒计时
    updateCountdown() {
        if (!this.preparationActive) return;

        const elapsed = performance.now() - this.gameStartTime;
        // 根据是否首波使用不同的准备时间
        const prepTime = this.state.wave === 0
            ? CONFIG.WAVE_MECHANICS.firstWavePreparationTime
            : CONFIG.WAVE_MECHANICS.wavePreparationTime;
        const remaining = Math.max(0, Math.ceil((prepTime - elapsed) / 1000));

        const countdownTime = document.getElementById('countdown-time');
        if (countdownTime) {
            countdownTime.textContent = remaining;
        }

        // 如果倒计时结束，开始下一波
        if (remaining <= 0) {
            const countdown = document.getElementById('countdown');
            if (countdown) countdown.classList.add('hidden');
            
            // 准备时间结束，开始下一波
            this.preparationActive = false;
            this.startNextWave();
        }
    }

    // 升级塔类型（全局升级）
    upgradeTowerType(type) {
        const cost = Tower.getUpgradeCost(type, this.state.towerLevels);
        if (cost === Infinity || this.state.gold < cost) {
            return false;
        }

        // 扣除金币
        this.state.gold -= cost;

        // 升级全局等级
        Tower.upgradeType(type, this.state.towerLevels);

        // 同步更新场上所有该类型的塔
        Tower.updateAllTowersOfType(this.state.towers, type, this.state.towerLevels);

        this.updateHUD();
        this.updateTowerPanel(); // 更新放置成本显示（等级税收）
        return true;
    }

    // 实时更新所有升级按钮状态
    updateUpgradeButtons() {
        // 更新塔类型升级面板中的按钮
        for (const type of Object.keys(CONFIG.TOWERS)) {
            const btn = document.getElementById(`btn-upgrade-${type}`);
            if (!btn) continue;

            const cost = Tower.getUpgradeCost(type, this.state.towerLevels);
            const isMaxLevel = Tower.isTypeMaxLevel(type, this.state.towerLevels);
            const currentLevel = Tower.getGlobalLevel(type, this.state.towerLevels);
            const towerName = CONFIG.TOWERS[type].name;

            if (isMaxLevel) {
                btn.textContent = `${towerName.slice(0, 2)}Lv.MAX`;
                btn.disabled = true;
                btn.classList.add('max-level');
            } else {
                btn.textContent = `${towerName.slice(0, 2)}Lv.${currentLevel}→${cost}`;
                btn.disabled = this.state.gold < cost;
                btn.classList.toggle('max-level', false);
            }
        }
    }

    // 游戏结束
    gameOver(isWin) {
        this.state.phase = 'gameover';
        document.getElementById('hud').classList.add('hidden');
        document.getElementById('tower-panel').classList.add('hidden');
        document.getElementById('upgrade-panel').classList.add('hidden');
        document.getElementById('gameover').classList.remove('hidden');
        document.getElementById('pause-menu').classList.add('hidden');

        // 显示统计
        document.getElementById('final-level').textContent = this.state.level;
        document.getElementById('final-kills').textContent = this.state.kills;
        document.getElementById('final-wave').textContent = this.state.wave;
        document.getElementById('final-mode').textContent = this.state.mode === 'classic' ? '经典模式' : '无尽模式';

        const title = document.getElementById('gameover-title');
        const reason = document.getElementById('gameover-reason');

        // 播放游戏结束音效
        const soundManager = getSoundManager();
        if (soundManager) {
            soundManager.play(isWin ? 'game_victory' : 'game_fail');
        }

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

    // 切换游戏速度（只控制倍速）
    toggleSpeed() {
        this.speedIndex = (this.speedIndex + 1) % this.speedOptions.length;
        this.gameSpeed = this.speedOptions[this.speedIndex];

        // 更新UI
        this.updateSpeedButton();
    }

    // 切换暂停状态
    togglePause() {
        if (this.state.phase === 'paused') {
            // 恢复游戏
            this.state.phase = 'playing';
            
            // 补偿准备时间的倒计时
            if (this.preparationActive && this.pauseStartTime > 0) {
                const pauseDuration = performance.now() - this.pauseStartTime;
                this.totalPausedTime += pauseDuration;
                // 将暂停时长加到 gameStartTime，使倒计时"回退"
                this.gameStartTime += pauseDuration;
                this.pauseStartTime = 0;
            }
        } else if (this.state.phase === 'playing') {
            // 暂停游戏
            this.state.phase = 'paused';
            
            // 记录暂停开始时间（仅在准备期间）
            if (this.preparationActive) {
                this.pauseStartTime = performance.now();
            }
        }

        // 更新UI
        this.updatePauseMenu();
    }

    // 更新速度按钮显示
    updateSpeedButton() {
        const btn = document.getElementById('btn-speed');
        if (!btn) return;

        const labels = ['1x', '2x'];
        btn.textContent = labels[this.speedIndex];
    }

    // 更新暂停菜单显示
    updatePauseMenu() {
        const menu = document.getElementById('pause-menu');
        if (!menu) return;

        if (this.state.phase === 'paused') {
            menu.classList.remove('hidden');
            // 更新音效开关按钮状态
            const soundManager = getSoundManager();
            const btnSoundToggle = document.getElementById('btn-sound-toggle');
            if (soundManager && btnSoundToggle) {
                btnSoundToggle.textContent = soundManager.isEnabled() ? '🔊 音效: 开' : '🔇 音效: 关';
            }
        } else {
            menu.classList.add('hidden');
        }
    }

    // 波次结算：随机清除部分防御塔（比例随波次变化）
    processWaveSettlement() {
        const towers = this.state.towers;
        if (towers.length === 0) return;

        // 计算清除比例（前期35%，中期40%，后期50%）
        const clearRatio = CONFIG.WAVE_SETTLEMENT.getClearRatio(this.state.wave);
        // 计算需要清除的数量（四舍五入）
        const clearCount = Math.round(towers.length * clearRatio);
        if (clearCount === 0) return;

        // 随机打乱并选择要清除的塔
        const shuffled = [...towers].sort(() => Math.random() - 0.5);
        const toClear = shuffled.slice(0, clearCount);

        // 获取当前波次的返还比例（方案A：随波次衰减）
        const refundRatio = CONFIG.WAVE_SETTLEMENT.getRefundRatio(this.state.wave);

        // 计算返还金币（使用累计投入成本）
        let refund = 0;
        const clearedIds = new Set();
        toClear.forEach(tower => {
            refund += Math.floor(tower.totalInvested * refundRatio);
            clearedIds.add(tower.id);
        });

        // 移除被清除的防御塔
        this.state.towers = towers.filter(t => !clearedIds.has(t.id));

        // 返还金币
        this.state.gold += refund;

        // 显示结算消息（传入返还比例用于显示）
        this.showSettlementMessage(clearCount, refund, refundRatio);

        // 更新 HUD
        this.updateHUD();

        // 只在实际清除了塔时���藏升级面板
        if (clearCount > 0) {
            document.getElementById('upgrade-panel').classList.add('hidden');
        }
    }

    // 显示结算消息
    // refundRatio: 当前波次的返还比例（用于显示）
    showSettlementMessage(count, refund, refundRatio) {
        const modeDisplay = document.getElementById('mode-display');
        if (modeDisplay) {
            const originalText = modeDisplay.textContent;
            const ratioPercent = Math.round(refundRatio * 100);
            modeDisplay.textContent = `🏰 撤退 ${count} 座防御塔，返还 ${refund} 金币 (${ratioPercent}%)`;
            modeDisplay.style.color = '#ffaa00';

            // 3秒后恢复原文本
            setTimeout(() => {
                if (this.state.mode === 'classic') {
                    const totalWaves = CONFIG.WAVES.classic.totalWaves;
                    modeDisplay.textContent = `第${this.state.wave}/${totalWaves}波`;
                } else {
                    modeDisplay.textContent = `无尽模式 - 第${this.state.wave}波`;
                }
                modeDisplay.style.color = '';
            }, 3000);
        }
    }
}
