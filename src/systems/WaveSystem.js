// 波次管理系统
import { CONFIG } from '../utils/config.js';
import { Enemy } from '../entities/Enemy.js';

export class WaveSystem {
    constructor(game) {
        this.game = game;
        this.currentWave = 0;
        this.enemiesToSpawn = [];
        this.spawnTimer = 0;
        this.waveInProgress = false;
        this.waveStartTime = 0; // 波次开始时间（用于计算间隔衰减）
    }

    // 开始新波次
    startWave(waveNumber) {
        this.currentWave = waveNumber;
        const config = this.getWaveConfig(waveNumber);

        // 生成敌人列表
        this.enemiesToSpawn = [];
        for (let i = 0; i < config.enemyCount; i++) {
            // 随机选择敌人类型
            const types = config.enemyTypes;
            const type = types[Math.floor(Math.random() * types.length)];

            // 随机生成位置
            const x = 100 + Math.random() * (CONFIG.CANVAS_WIDTH - 200);

            this.enemiesToSpawn.push({
                type,
                x,
                y: CONFIG.MAP.spawnY,
                hpMultiplier: config.hpMultiplier
            });
        }

        this.spawnTimer = 0;
        this.waveInProgress = true;
        this.waveStartTime = performance.now(); // 记录波次开始时间
    }

    // 获取波次配置
    getWaveConfig(waveNumber) {
        const mode = this.game.state.mode;
        const mechanics = CONFIG.WAVE_MECHANICS;

        // 计算敌人数量
        let count;
        if (mode === 'classic') {
            count = CONFIG.WAVES.classic.baseEnemyCount + (waveNumber - 1) * mechanics.enemyCountPerWave;
        } else {
            count = CONFIG.WAVES.endless.baseEnemyCount + (waveNumber - 1) * mechanics.enemyCountPerWave;
        }

        // 计算基础生成间隔（随波次递减）
        const baseInterval = Math.max(
            mechanics.minSpawnInterval,
            mechanics.baseSpawnInterval - (waveNumber - 1) * mechanics.intervalDecreasePerWave
        );

        // 计算血量倍率
        let hpMult;
        if (mode === 'classic') {
            hpMult = CONFIG.WAVES.classic.baseHpMultiplier + (waveNumber - 1) * 0.1;
        } else {
            hpMult = CONFIG.WAVES.endless.baseHpMultiplier + (waveNumber - 1) * 0.1;
        }

        // 随着波次增加，解锁新敌人类型
        let types = ['soldier'];
        if (waveNumber >= 3) types.push('landing_craft');
        if (waveNumber >= 5) types.push('tank');           // 波次5解锁坦克
        if (waveNumber >= 7) types.push('suicide');        // 波次7解锁自杀兵
        if (waveNumber >= 9) types.push('landing_craft');  // 后期更多登陆艇

        return {
            waveNumber,
            enemyCount: count,
            enemyTypes: types,
            baseInterval: baseInterval,        // 波次开始时的间隔
            minInterval: mechanics.minSpawnInterval,
            intervalDecay: mechanics.intervalDecay, // 间隔衰减系数
            hpMultiplier: hpMult
        };
    }

    // 计算当前生成间隔（随时间线性衰减）
    getCurrentSpawnInterval() {
        const config = this.getWaveConfig(this.currentWave);
        const elapsed = performance.now() - this.waveStartTime;

        // 估算波次总时长（基于敌人数量和最小间隔）
        const estimatedWaveDuration = this.enemiesToSpawn.length * config.minInterval;

        // 计算衰减进度（0~1）
        const decayProgress = Math.min(1, elapsed / (estimatedWaveDuration * 2)); // *2 让衰减更平缓

        // 线性衰减公式
        const currentInterval = config.baseInterval - (config.baseInterval - config.minInterval) * decayProgress * config.intervalDecay;

        return Math.max(config.minInterval, currentInterval);
    }

    // 更新生成逻辑
    update(deltaTime) {
        if (!this.waveInProgress) {
            return null;
        }

        // 如果没有敌人需要生成，标记波次生成完成
        if (this.enemiesToSpawn.length === 0) {
            this.waveInProgress = false; // 关键：设为 false，允许波次完成检查
            return null;
        }

        this.spawnTimer += deltaTime;

        // 使用动态间隔（随时间逐渐加快）
        const interval = this.getCurrentSpawnInterval();

        if (this.spawnTimer >= interval) {
            const enemyData = this.enemiesToSpawn.shift();
            const enemy = new Enemy(
                enemyData.type,
                enemyData.x,
                enemyData.y,
                enemyData.hpMultiplier
            );
            this.spawnTimer = 0;
            return enemy;
        }

        return null;
    }

    // 检查波次是否完成（所有敌人生成完毕且被消灭）
    isWaveComplete() {
        return !this.waveInProgress && // 生成已完成
               this.enemiesToSpawn.length === 0 && // 待生成列表为空
               this.game.state.enemies.length === 0; // 当前敌人已全部消灭
    }

    // 检查经典模式是否通关
    isClassicComplete() {
        return this.game.state.mode === 'classic' && this.currentWave >= CONFIG.WAVES.classic.totalWaves;
    }

    // 获取波次进度信息（用于调试和UI显示）
    getWaveProgress() {
        const config = this.getWaveConfig(this.currentWave);
        const totalEnemies = config.enemyCount;
        const spawnedEnemies = totalEnemies - this.enemiesToSpawn.length;
        const remainingEnemies = this.game.state.enemies.length;

        return {
            total: totalEnemies,
            spawned: spawnedEnemies,
            alive: remainingEnemies,
            killed: spawnedEnemies - remainingEnemies
        };
    }
}
